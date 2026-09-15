import { getDb } from "../lib/db";
import { getCurrentMember } from "./auth-actions";
import { recordAuditLog } from "./audit-actions";
import { createNotification, sendDiscordWebhook, getWebhookUrlForPlatformChannel } from "./notification-actions";
import { revalidatePath } from "next/cache";
import { ChecklistItem, DEFAULT_TIKTOK_CHECKLIST } from "../lib/types";

function parseJsonSafe<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") return value as T;
  if (typeof value !== "string" || !value.trim()) return fallback;
  try { return JSON.parse(value) as T; } catch { return fallback; }
}

// ==========================================
// 5. GATE 4: QC CHECKLIST & APPROVAL
// ==========================================
export async function approveGate4QcAction(ideaId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const member = await getCurrentMember();
    if (!member) return { success: false, error: "Chưa đăng nhập" };
    if (member.role !== "E" && member.role !== "Core") {
      return { success: false, error: "Chỉ Editor hoặc Core mới có quyền duyệt QC" };
    }

    const sql = getDb();
    const rows = await sql.query(`SELECT * FROM ideas WHERE id = $1 LIMIT 1`, [ideaId]);
    const idea = rows[0];
    if (!idea) return { success: false, error: "Không tìm thấy ý tưởng" };
    if (idea.status !== "QA" || idea.active_gate !== "GATE_4_QC") {
      return { success: false, error: "Chỉ có thể duyệt QC khi task ở Cổng 4 (QC)" };
    }
    // Ensure QC checklist fully checked
    const qcChecklist = parseJsonSafe<ChecklistItem[]>(idea.qc_checklist, []);
    const unchecked = qcChecklist.filter((i: ChecklistItem) => !i.checked);
    if (unchecked.length > 0) {
      return { success: false, error: `QC checklist chưa hoàn thành, còn ${unchecked.length} mục chưa tích` };
    }

    const now = new Date().toISOString();
    await sql.query(
      `UPDATE ideas SET 
         status = 'CORE_REVIEW',
         active_gate = 'GATE_5_CORE',
         gate4_approved_at = $1,
         gate4_approved_by_email = $2,
         core_approval_notes = COALESCE(core_approval_notes, ''),
         qc_checklist = $3 
       WHERE id = $4`,
      [now, member.id, JSON.stringify(qcChecklist), ideaId]
    );

    await recordAuditLog(ideaId, member.id, "Cổng 4: QC duyệt", { approvedBy: member.id, timestamp: now });
    // Notify Core
    if (idea.assigned_to_email) {
      await createNotification(idea.assigned_to_email, "info", ideaId, `QC đã hoàn thành cho "${idea.title}". Core vui lòng duyệt.`);
    }
    const webhook = await getWebhookUrlForPlatformChannel(idea.platform_channel_id);
    await sendDiscordWebhook(`✅ QC checklist cho "${idea.title}" đã được ${member.name} duyệt.`, undefined, webhook, "general");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi khi duyệt QC" };
  }
}

// ==========================================
// 6. GATE 5: CORE FINAL APPROVAL & PUBLISH
// ==========================================
export async function approveGate5CoreAction(ideaId: string, publishData: {
  title: string;
  thumbnail?: string;
  caption?: string;
  hashtags?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const member = await getCurrentMember();
    if (!member) return { success: false, error: "Chưa đăng nhập" };
    if (member.role !== "Core") {
      return { success: false, error: "Chỉ Core mới có quyền duyệt cuối cùng và publish" };
    }

    const sql = getDb();
    const rows = await sql.query(`SELECT * FROM ideas WHERE id = $1 LIMIT 1`, [ideaId]);
    const idea = rows[0];
    if (!idea) return { success: false, error: "Không tìm thấy ý tưởng" };
    if (idea.status !== "CORE_REVIEW" || idea.active_gate !== "GATE_5_CORE") {
      return { success: false, error: "Chỉ có thể publish khi ở Cổng 5 (Core Review)" };
    }

    const now = new Date().toISOString();
    await sql.query(
      `UPDATE ideas SET 
         status = 'READY_TO_PUBLISH',
         active_gate = 'READY_TO_PUBLISH',
         gate5_approved_at = $1,
         gate5_approved_by_email = $2,
         published_title = $3,
         published_thumbnail = $4,
         published_caption = $5,
         published_hashtags = $6,
         target_publish_date = $7
       WHERE id = $8`,
      [
        now,
        member.id,
        publishData.title,
        publishData.thumbnail || null,
        publishData.caption || null,
        publishData.hashtags || null,
        now.slice(0, 10), // today as target publish date
        ideaId,
      ]
    );

    await recordAuditLog(ideaId, member.id, "Cổng 5: Core duyệt và publish", { publishData });
    const webhook = await getWebhookUrlForPlatformChannel(idea.platform_channel_id);
    await sendDiscordWebhook(`🚀 ${member.name} đã duyệt và publish video "${publishData.title}".`, undefined, webhook, "general");
    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi khi publish" };
  }
}

// ==========================================
// 7. TIKTOK DERIVATIVE WORKFLOW
// ==========================================
export async function createTikTokCutdownAction(ideaId: string, params: {
  targetDuration?: string; // e.g. "30-45s"
  reframeApplied?: boolean;
  hookSummary?: string;
  ctaRoute?: string;
}): Promise<{ success: boolean; error?: string; tiktokTaskId?: string }> {
  try {
    const member = await getCurrentMember();
    if (!member) return { success: false, error: "Chưa đăng nhập" };
    if (member.role !== "E" && member.role !== "Core") {
      return { success: false, error: "Chỉ Editor hoặc Core mới tạo task TikTok" };
    }

    const sql = getDb();
    const parentRows = await sql.query(`SELECT * FROM ideas WHERE id = $1 LIMIT 1`, [ideaId]);
    const parent = parentRows[0];
    if (!parent) return { success: false, error: "Không tìm thấy ý tưởng gốc" };
    if (parent.status !== "READY_TO_PUBLISH" && parent.active_gate !== "READY_TO_PUBLISH") {
      return { success: false, error: "Chỉ tạo TikTok khi video đã publish" };
    }

    const tiktokTaskId = crypto.randomUUID();
    const now = new Date().toISOString();
    await sql.query(
      `INSERT INTO ideas (
         id, title, description, platform_channel_id, submitted_by_email,
         status, active_gate, created_at, parent_task_id, derivative_type,
         source_video_url, tiktok_target_duration, tiktok_reframe_applied,
         tiktok_hook_summary, tiktok_cta_route
       ) VALUES (
         $1, $2, $3, $4, $5,
         'PRODUCTION', 'GATE_3_PRODUCTION', $6, $7, 'TIKTOK_CUTDOWN',
         $8, $9, $10,
         $11, $12
       )`,
      [
        tiktokTaskId,
        `${parent.title} (TikTok)`,
        `TikTok cut‑down derived from ${parent.title}`,
        parent.platform_channel_id,
        member.id,
        now,
        ideaId,
        parent.master_video_link || parent.video_final_link || "",
        params.targetDuration || "30-45s",
        params.reframeApplied ?? true,
        params.hookSummary || "",
        params.ctaRoute || "",
      ]
    );

    // Initialise TikTok checklist
    await sql.query(`UPDATE ideas SET tiktok_checklist = $1 WHERE id = $2`, [JSON.stringify(DEFAULT_TIKTOK_CHECKLIST), tiktokTaskId]);

    await recordAuditLog(ideaId, member.id, "Tạo TikTok derivative", { tiktokTaskId });
    await createNotification(member.id, "info", tiktokTaskId, `Task TikTok được tạo cho video "${parent.title}"`);
    const webhook = await getWebhookUrlForPlatformChannel(parent.platform_channel_id);
    await sendDiscordWebhook(`🎞️ TikTok cut‑down task "${parent.title}" đã được tạo bởi ${member.name}.`, undefined, webhook, "general");
    revalidatePath("/");
    return { success: true, tiktokTaskId };
  } catch (err: any) {
    return { success: false, error: err.message || "Lỗi khi tạo TikTok" };
  }
}
