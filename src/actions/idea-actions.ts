"use server";

import { ensureSchema, getDb } from "../lib/db";
import { getCurrentMember } from "./auth-actions";
import { recordAuditLog } from "./audit-actions";
import { createNotification, sendDiscordWebhook, getWebhookUrlForPlatformChannel } from "./notification-actions";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { isHttpUrl } from "../lib/workflow-validation";
import { 
  ScriptData, 
  ChecklistItem, 
  DEFAULT_PRODUCTION_CHECKLIST, 
  DEFAULT_QC_CHECKLIST, 
  DEFAULT_TIKTOK_CHECKLIST 
} from "../lib/types";

// ==========================================
// UTILITY HELPERS
// ==========================================

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch (err) {
    return false;
  }
}

function parseJsonSafe<T>(val: any, fallback: T): T {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') return val as T;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return fallback;
    try {
      return JSON.parse(trimmed) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

async function getIdeaRow(ideaId: string) {
  const sql = getDb();
  const rows = await sql.query(`SELECT * FROM ideas WHERE id = $1 LIMIT 1`, [ideaId]);
  return rows[0] as any;
}

// ==========================================
// 1. GATE 1: IDEA PITCHING & APPROVAL
// ==========================================

export async function submitIdeaAction(
  title: string, 
  description: string, 
  platformChannelId: string,
  logline?: string,
  referenceLinks?: string,
  angle?: string,
  keyMessage?: string,
  contentPillar?: string,
  pitchingBatchId?: string
) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  if (!title || !title.trim()) {
    throw new Error("Tên ý tưởng không được để trống");
  }

  if (!description || !description.trim()) {
    throw new Error("Mô tả ý tưởng là bắt buộc");
  }

  if (!platformChannelId || !platformChannelId.trim()) {
    throw new Error("Vui lòng chọn Kênh & Nền tảng cho ý tưởng");
  }

  const sql = getDb();
  const selectedChannels = await sql.query(
    'SELECT pc.channel_group_id, p.name FROM platform_channels pc JOIN channel_groups c ON c.id=pc.channel_group_id JOIN platforms p ON p.id=pc.platform_id WHERE pc.id=$1 AND c.archived=false', [platformChannelId.trim()]
  );
  if (!selectedChannels.length) throw new Error("Kênh không tồn tại hoặc đã lưu trữ. Vui lòng chọn lại.");
  if (title.length > 250 || description.length > 30000) throw new Error("Tên tối đa 250 ký tự, nội dung tối đa 30.000 ký tự.");
  if (referenceLinks?.trim()) {
    let references;
    try { references = JSON.parse(referenceLinks); } catch { references = [{url: referenceLinks.trim()}]; }
    if (!Array.isArray(references) || references.some((r: {url?:string}) => !r || typeof r.url !== "string" || !isHttpUrl(r.url))) throw new Error("Mỗi reference cần là một đường dẫn http/https hợp lệ.");
  }
  if (pitchingBatchId) {
    const batches=await sql.query('SELECT status, deadline, channel_group_id FROM pitching_batches WHERE id=$1',[pitchingBatchId]);
    const batch=batches[0];
    if(!batch || batch.status!=="OPEN") throw new Error("Đợt pitching đã đóng hoặc không còn tồn tại.");
    const deadline=String(batch.deadline || "");
    const cutoff=/^\d{4}-\d{2}-\d{2}$/.test(deadline) ? new Date(deadline + "T23:59:59+07:00") : new Date(deadline);
    if(!Number.isNaN(cutoff.getTime()) && cutoff.getTime()<Date.now()) throw new Error("Đợt pitching đã hết hạn. Chọn đợt khác hoặc liên hệ Editor/Core.");
    if(batch.channel_group_id && batch.channel_group_id!==selectedChannels[0].channel_group_id) throw new Error("Đợt pitching không thuộc kênh đã chọn.");
  }
  const platformName=String(selectedChannels[0].name).toLowerCase();
  const platformType=platformName.includes("tiktok") ? "TIKTOK_CUTDOWN" : platformName.includes("facebook") ? "FACEBOOK_REELS" : "YOUTUBE_MASTER";
  const ideaId = crypto.randomUUID();
  const now = new Date().toISOString();

  await sql.query(
    `INSERT INTO ideas (
      id, title, description, platform_channel_id, submitted_by_email,
      status, active_gate, created_at, credits_idea_by_email, last_pitch_week,
      logline, reference_links, angle, key_message, content_pillar,
      script_status, script_locked, platform_type,
      copyright_footage, copyright_music, copyright_mascot,
      production_checklist, qc_checklist, pitching_batch_id
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10,
      $11, $12, $13, $14, $15,
      $16, $17, $18,
      $19, $20, $21,
      $22, $23, $24
    )`,
    [
      ideaId,
      title.trim(),
      description.trim(),
      platformChannelId.trim(),
      member.id,
      "PITCH",
      "GATE_1_IDEA",
      now,
      member.id,
      now.slice(0, 10),
      logline?.trim() || null,
      referenceLinks?.trim() || null,
      angle?.trim() || null,
      keyMessage?.trim() || null,
      contentPillar?.trim() || null,
      "DRAFT",
      false,
      platformType,
      "PENDING",
      "PENDING",
      "OFFICIAL",
      JSON.stringify(DEFAULT_PRODUCTION_CHECKLIST),
      JSON.stringify(DEFAULT_QC_CHECKLIST),
      pitchingBatchId || null
    ]
  );

  // Audit log
  await recordAuditLog(ideaId, member.id, "Nộp ý tưởng mới", { title: title.trim(), description: description.trim() });

  // Discord notification to channel thread / idea webhook and general task webhook
  const channelWebhook = await getWebhookUrlForPlatformChannel(platformChannelId);
  let discordMsg = `💡 **${member.name}** vừa nộp ý tưởng Pitching mới: **"${title.trim()}"**`;
  if (contentPillar) discordMsg += `\n> 🎯 **Tuyến bài:** ${contentPillar}`;
  if (logline) discordMsg += `\n> 📝 **Logline:** ${logline}`;
  if (description) discordMsg += `\n> 📄 **Mô tả:** ${description.trim().slice(0, 200)}${description.length > 200 ? '...' : ''}`;

  await sendDiscordWebhook(
    discordMsg,
    undefined,
    channelWebhook,
    'idea',
    true
  );

  revalidatePath("/");
  return { success: true, id: ideaId };
}

export async function approveGate1IdeaAction(
  ideaId: string, 
  assigneeEmail: string, 
  deadlineScript?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const member = await getCurrentMember();
    if (!member) return { success: false, error: "Chưa đăng nhập" };
    if (member.role !== "Core" && member.role !== "E") {
      return { success: false, error: "Chỉ Editor hoặc Core mới có quyền duyệt ý tưởng Cổng 1" };
    }

    if (!assigneeEmail || !assigneeEmail.trim()) {
      return { success: false, error: "Bắt buộc phải chọn Producer phụ trách viết kịch bản" };
    }

    const row = await getIdeaRow(ideaId);
    if (!row) return { success: false, error: "Không tìm thấy ý tưởng" };

    if (row.status !== "PITCH" && row.status !== "ARCHIVED_IDEA" && row.active_gate !== "GATE_1_IDEA") {
      return { success: false, error: "Chỉ có thể duyệt ý tưởng đang ở Cổng 1 (PITCH)" };
    }

    const sql = getDb();
    await ensureSchema(sql);
    const now = new Date().toISOString();
    const deadlineVal = deadlineScript?.trim() || null;

    await sql.query(
      `UPDATE ideas SET 
         status = 'ASSIGNMENT',
         active_gate = 'GATE_2_SCRIPT',
         assigned_to_email = $1,
         deadline_script = $2,
         end_date = COALESCE($2, end_date),
         gate1_approved_at = $3,
         gate1_approved_by_email = $4,
         credits_approved_by_email = $4,
         assigned_at = $3,
         script_status = 'DRAFT',
         script_locked = FALSE,
         production_checklist = COALESCE(production_checklist, $5),
         qc_checklist = COALESCE(qc_checklist, $6)
       WHERE id = $7`,
      [
        assigneeEmail.trim(),
        deadlineVal,
        now,
        member.id,
        JSON.stringify(DEFAULT_PRODUCTION_CHECKLIST),
        JSON.stringify(DEFAULT_QC_CHECKLIST),
        ideaId
      ]
    );

    await recordAuditLog(ideaId, member.id, "Cổng 1: Duyệt Ý tưởng -> Giao viết Kịch bản", {
      assigneeEmail: assigneeEmail.trim(),
      deadlineScript: deadlineVal
    });

    await createNotification(
      assigneeEmail.trim(),
      'assigned',
      ideaId,
      `Ý tưởng "${row.title}" đã được duyệt Cổng 1! Bạn được giao viết kịch bản (Hạn: ${deadlineVal || 'Theo lịch'}).`
    );

    const channelWebhook = await getWebhookUrlForPlatformChannel(row.platform_channel_id);
    await sendDiscordWebhook(
      `📋 Ý tưởng **"${row.title}"** đã được duyệt Cổng 1 bởi **${member.name}** và giao cho **${assigneeEmail.trim()}** (Hạn nộp script: ${deadlineVal || 'Chưa set'})`,
      undefined,
      channelWebhook,
      'general'
    );

    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Có lỗi xảy ra khi duyệt ý tưởng Cổng 1" };
  }
}

export async function approveIdeaAction(
  ideaId: string, 
  arg2: any, 
  arg3: any, 
  platformChannelId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const member = await getCurrentMember();
    if (!member) {
      return { success: false, error: "Chưa đăng nhập hoặc phiên làm việc đã hết hạn. Vui lòng tải lại trang và đăng nhập lại." };
    }
    if (member.role !== "Core" && member.role !== "E") {
      return { success: false, error: "Chỉ Core hoặc Editor mới có quyền duyệt ý tưởng vào sản xuất." };
    }

    // Tự động nhận diện thông minh dù truyền (email, days) hay (days, email)
    let producerEmail = "";
    let durationDays = 2;

    if (typeof arg2 === "number" || (typeof arg2 === "string" && /^\d+$/.test(arg2.trim()) && !arg2.includes("@"))) {
      durationDays = typeof arg2 === "number" ? arg2 : parseInt(arg2, 10);
      producerEmail = String(arg3 ?? "").trim();
    } else {
      producerEmail = String(arg2 ?? "").trim();
      durationDays = typeof arg3 === "number" ? arg3 : parseInt(String(arg3 || "2"), 10);
    }

    if (isNaN(durationDays) || durationDays < 1) {
      durationDays = 2;
    }

    if (!producerEmail) {
      return { success: false, error: "Bắt buộc phải chọn 1 Producer cụ thể phụ trách." };
    }

    const row = await getIdeaRow(ideaId);
    if (!row) {
      return { success: false, error: "Không tìm thấy ý tưởng trong hệ thống." };
    }

    if (row.status !== "PITCH" && row.status !== "ARCHIVED_IDEA") {
      return { success: false, error: `Chỉ có thể duyệt ý tưởng đang ở trạng thái PITCH hoặc Đã lưu trữ (hiện tại: ${row.status}).` };
    }

    const today = new Date();
    const endDate = new Date();
    endDate.setDate(today.getDate() + durationDays - 1);

    const todayIso = today.toISOString().slice(0, 10);
    const endIso = endDate.toISOString().slice(0, 10);

    const sql = getDb();
    await sql.query(
      `UPDATE ideas SET 
         status = 'ASSIGNMENT',
         active_gate = 'GATE_2_SCRIPT',
         platform_channel_id = COALESCE($1, platform_channel_id),
         duration_days = $2,
         assigned_to_email = $3,
         start_date = $4,
         end_date = $5,
         deadline_script = $5,
         assigned_at = $6,
         gate1_approved_at = $6,
         gate1_approved_by_email = $7,
         credits_approved_by_email = $7,
         script_status = 'DRAFT',
         script_locked = FALSE,
         production_checklist = COALESCE(production_checklist, $8),
         qc_checklist = COALESCE(qc_checklist, $9)
       WHERE id = $10`,
      [
        platformChannelId ? platformChannelId.trim() : null,
        durationDays,
        producerEmail,
        todayIso,
        endIso,
        today.toISOString(),
        member.id,
        JSON.stringify(DEFAULT_PRODUCTION_CHECKLIST),
        JSON.stringify(DEFAULT_QC_CHECKLIST),
        ideaId
      ]
    );

    await recordAuditLog(ideaId, member.id, "Duyệt ý tưởng PITCH -> ASSIGNMENT", {
      durationDays,
      assignedToEmail: producerEmail,
      startDate: todayIso,
      endDate: endIso
    });

    await createNotification(
      producerEmail,
      'assigned',
      ideaId,
      `Bạn đã được giao sản xuất ý tưởng "${row.title}" (Hạn: ${endIso})`
    );

    try {
      const channelWebhook = await getWebhookUrlForPlatformChannel(platformChannelId || row.platform_channel_id);
      await sendDiscordWebhook(
        `📋 Ý tưởng **"${row.title}"** đã được duyệt và giao cho **${producerEmail}** (Sản xuất: ${durationDays} ngày, hạn: ${endIso})`,
        undefined,
        channelWebhook,
        'general'
      );
    } catch (dErr) {
      console.error("Lỗi gửi Discord webhook khi duyệt ý tưởng:", dErr);
    }

    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    console.error("Lỗi approveIdeaAction:", err);
    return { success: false, error: err.message || "Có lỗi xảy ra khi duyệt ý tưởng" };
  }
}

// ==========================================
// 2. GATE 2: STANDARDIZED SCRIPT MATRIX & APPROVAL
// ==========================================

export async function submitScriptMatrixAction(
  ideaId: string, 
  scriptData: ScriptData
): Promise<{ success: boolean; error?: string }> {
  try {
    const member = await getCurrentMember();
    if (!member) return { success: false, error: "Chưa đăng nhập" };

    const row = await getIdeaRow(ideaId);
    if (!row) return { success: false, error: "Không tìm thấy ý tưởng" };

    const isAssigned = row.assigned_to_email === member.id;
    const isEditorOrCore = member.role === "E" || member.role === "Core";
    if (!isAssigned && !isEditorOrCore) {
      return { success: false, error: "Chỉ Producer được giao hoặc Editor/Core mới có quyền nộp kịch bản" };
    }

    if (row.script_locked === true) {
      return { 
        success: false, 
        error: "Kịch bản đã được duyệt và đang bị khóa. Producer không thể tự ý chỉnh sửa trừ khi Editor gửi yêu cầu Revision." 
      };
    }

    if (row.status === "CANCELLED") {
      return { success: false, error: "Ý tưởng đã bị huỷ, không thể nộp kịch bản" };
    }

    // Validate Hook 3Ws (What - When - Why) (R3)
    if (!scriptData || !scriptData.hook3Ws || !scriptData.hook3Ws.what?.trim() || !scriptData.hook3Ws.when?.trim() || !scriptData.hook3Ws.why?.trim()) {
      return { 
        success: false, 
        error: "Kịch bản bắt buộc phải điền đầy đủ Hook 3Ws (What - When - Why)." 
      };
    }

    // Validate Copyright commitment (R3)
    if (!scriptData.copyrightCommitment) {
      return { 
        success: false, 
        error: "Bắt buộc phải tích xác nhận cam kết bản quyền (Footage, BGM/SFX, Mascot) trước khi nộp kịch bản." 
      };
    }

    const sql = getDb();
    await sql.query(
      `UPDATE ideas SET 
         status = 'SCRIPT',
         active_gate = 'GATE_2_SCRIPT',
         script_status = 'SUBMITTED',
         script_data = $1,
         copyright_commitment = $2,
         credits_script_by_email = $3,
         deadline_script = COALESCE($4, deadline_script),
         channel_tier = COALESCE($5, channel_tier)
       WHERE id = $6`,
      [
        JSON.stringify(scriptData),
        true,
        member.id,
        scriptData.submissionDeadline || null,
        scriptData.channelTier || null,
        ideaId
      ]
    );

    await recordAuditLog(ideaId, member.id, "Cổng 2: Nộp kịch bản ma trận 4 cột chuẩn", {
      episodeName: scriptData.episodeName,
      channelTier: scriptData.channelTier,
      segmentsCount: scriptData.segments?.length || 0
    });

    const channelWebhook = await getWebhookUrlForPlatformChannel(row.platform_channel_id);
    await sendDiscordWebhook(
      `📝 Producer **${member.name}** đã nộp kịch bản ma trận 4 cột cho **"${row.title}"**. Chờ Editor sửa & duyệt.`,
      undefined,
      channelWebhook,
      'general'
    );

    const editorCoreRows = await sql.query(`SELECT id FROM members WHERE role IN ('E', 'Core') AND active = TRUE`);
    for (const m of (editorCoreRows as any[])) {
      await createNotification(
        m.id,
        'info',
        ideaId,
        `Kịch bản ma trận 4 cột "${row.title}" đã được nộp bởi ${member.name}. Cần kiểm duyệt.`
      );
    }

    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Có lỗi xảy ra khi nộp kịch bản" };
  }
}

export async function approveGate2ScriptAction(
  ideaId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const member = await getCurrentMember();
    if (!member) return { success: false, error: "Chưa đăng nhập" };
    if (member.role !== "E" && member.role !== "Core") {
      return { success: false, error: "Chỉ Editor hoặc Core mới có quyền duyệt kịch bản Cổng 2" };
    }

    const row = await getIdeaRow(ideaId);
    if (!row) return { success: false, error: "Không tìm thấy ý tưởng" };

    if (row.status !== "SCRIPT" && row.active_gate !== "GATE_2_SCRIPT") {
      return { success: false, error: "Chỉ ý tưởng đang ở Cổng 2 (SCRIPT) mới có thể duyệt kịch bản" };
    }

    if (row.script_status !== "SUBMITTED" && !row.script_data && !row.script_link) {
      return { success: false, error: "Kịch bản chưa được nộp để duyệt" };
    }

    const sql = getDb();
    const now = new Date().toISOString();

    await sql.query(
      `UPDATE ideas SET 
         status = 'PRODUCTION',
         active_gate = 'GATE_3_PRODUCTION',
         script_status = 'APPROVED',
         script_locked = TRUE,
         gate2_approved_at = $1,
         gate2_approved_by_email = $2,
         credits_edited_script_by_email = $2,
         production_checklist = COALESCE(production_checklist, $3)
       WHERE id = $4`,
      [
        now,
        member.id,
        JSON.stringify(DEFAULT_PRODUCTION_CHECKLIST),
        ideaId
      ]
    );

    await recordAuditLog(ideaId, member.id, "Cổng 2: Phê duyệt & Khóa kịch bản -> Chuyển sang Cổng 3 (Production)", {
      approvedBy: member.id,
      timestamp: now
    });

    if (row.assigned_to_email) {
      await createNotification(
        row.assigned_to_email,
        'production_started',
        ideaId,
        `Kịch bản "${row.title}" đã được duyệt hoàn chỉnh và KHÓA! Bắt đầu quay dựng sản xuất (Cổng 3).`
      );
    }

    const channelWebhook = await getWebhookUrlForPlatformChannel(row.platform_channel_id);
    await sendDiscordWebhook(
      `🎬 Kịch bản **"${row.title}"** đã được **${member.name}** phê duyệt và KHÓA — chính thức bước vào CỔNG 3: SẢN XUẤT.`,
      undefined,
      channelWebhook,
      'general'
    );

    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Có lỗi xảy ra khi duyệt kịch bản" };
  }
}

export async function requestScriptRevisionAction(
  ideaId: string, 
  notes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const member = await getCurrentMember();
    if (!member) return { success: false, error: "Chưa đăng nhập" };
    if (member.role !== "E" && member.role !== "Core") {
      return { success: false, error: "Chỉ Editor hoặc Core mới có quyền yêu cầu chỉnh sửa kịch bản" };
    }

    if (!notes || !notes.trim()) {
      return { success: false, error: "Bắt buộc phải nhập nội dung ghi chú yêu cầu chỉnh sửa kịch bản" };
    }

    const row = await getIdeaRow(ideaId);
    if (!row) return { success: false, error: "Không tìm thấy ý tưởng" };

    const sql = getDb();
    await sql.query(
      `UPDATE ideas SET 
         status = 'SCRIPT',
         active_gate = 'GATE_2_SCRIPT',
         script_status = 'REVISION_REQUESTED',
         script_locked = FALSE,
         script_revision_notes = $1
       WHERE id = $2`,
      [notes.trim(), ideaId]
    );

    await recordAuditLog(ideaId, member.id, "Cổng 2: Yêu cầu chỉnh sửa kịch bản (Revision)", {
      revisionNotes: notes.trim()
    });

    if (row.assigned_to_email) {
      await createNotification(
        row.assigned_to_email,
        'info',
        ideaId,
        `⚠️ Kịch bản "${row.title}" cần chỉnh sửa: "${notes.trim()}". Kịch bản đã được mở khóa để bạn cập nhật.`
      );
    }

    const channelWebhook = await getWebhookUrlForPlatformChannel(row.platform_channel_id);
    await sendDiscordWebhook(
      `⚠️ Editor **${member.name}** yêu cầu chỉnh sửa kịch bản **"${row.title}"**:\n> ${notes.trim()}`,
      undefined,
      channelWebhook,
      'general'
    );

    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Có lỗi xảy ra khi yêu cầu sửa kịch bản" };
  }
}

export async function submitScriptAction(ideaId: string, scriptLink?: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  const row = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");
  
  if (row.assigned_to_email !== member.id && member.role !== "P" && member.role !== "Core") {
    throw new Error("Chỉ Producer được giao mới có quyền nộp kịch bản");
  }

  if (row.script_locked === true) {
    throw new Error("Kịch bản đã được duyệt và đang bị khóa.");
  }

  // The former link-only path is retained for compatibility, but it may not
  // bypass the required YNDA matrix. Use submitScriptMatrixAction to create it.
  const matrix = parseJsonSafe<ScriptData | null>(row.script_data, null);
  if (!matrix?.hook3Ws?.what?.trim() || !matrix.hook3Ws.when?.trim() || !matrix.hook3Ws.why?.trim() || !matrix.copyrightCommitment || matrix.segments?.length !== 4) {
    throw new Error("Hãy nộp Script bằng ma trận 4 cột, đủ Hook 3Ws và cam kết bản quyền trước khi gửi duyệt.");
  }

  if (scriptLink && !isValidUrl(scriptLink.trim())) {
    throw new Error("Link kịch bản không hợp lệ. Vui lòng nhập URL hợp lệ bắt đầu bằng http:// hoặc https://");
  }

  const sql = getDb();
  await sql.query(
    `UPDATE ideas SET
       status = 'SCRIPT',
       active_gate = 'GATE_2_SCRIPT',
       script_status = 'SUBMITTED',
       script_link = COALESCE($1, script_link),
       script_doc_link = COALESCE($1, script_doc_link),
       credits_script_by_email = $2
     WHERE id = $3`,
    [scriptLink ? scriptLink.trim() : null, member.id, ideaId]
  );

  await recordAuditLog(ideaId, member.id, "Nộp kịch bản ASSIGNMENT -> SCRIPT", { scriptLink });
  
  const channelWebhook = await getWebhookUrlForPlatformChannel(row.platform_channel_id);
  await sendDiscordWebhook(
    `📝 Producer **${member.name}** đã nộp kịch bản cho **"${row.title}"**. Chờ Editor sửa & duyệt.`,
    undefined,
    channelWebhook,
    'general'
  );

  const editorCoreRows = await sql.query(`SELECT id FROM members WHERE role IN ('E', 'Core')`);
  for (const m of (editorCoreRows as any[])) {
    await createNotification(
      m.id,
      'info',
      ideaId,
      `Kịch bản "${row.title}" đã được nộp bởi ${member.name}. Cần được kiểm duyệt.`
    );
  }

  revalidatePath("/");
}

export async function startProductionAction(ideaId: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "E" && member.role !== "Core") {
    throw new Error("Chỉ Editor hoặc Core mới được xác nhận kịch bản và bắt đầu sản xuất");
  }

  const row = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");

  if (row.status !== "SCRIPT" || row.active_gate !== "GATE_2_SCRIPT" || row.script_status !== "SUBMITTED") {
    throw new Error("Chỉ ý tưởng ở trạng thái SCRIPT mới được chuyển sang PRODUCTION");
  }
  const matrix = parseJsonSafe<ScriptData | null>(row.script_data, null);
  if (!matrix?.copyrightCommitment || matrix.segments?.length !== 4) {
    throw new Error("Không thể duyệt Script thiếu ma trận 4 cột và cam kết bản quyền.");
  }

  const sql = getDb();
  const now = new Date().toISOString();
  await sql.query(
    `UPDATE ideas SET 
       status = 'PRODUCTION', 
       active_gate = 'GATE_3_PRODUCTION',
       script_status = 'APPROVED',
       script_locked = TRUE,
       gate2_approved_at = $1,
       gate2_approved_by_email = $2,
       credits_edited_script_by_email = $2,
       production_checklist = COALESCE(production_checklist, $3)
     WHERE id = $4`,
    [now, member.id, JSON.stringify(DEFAULT_PRODUCTION_CHECKLIST), ideaId]
  );

  await recordAuditLog(ideaId, member.id, "Bắt đầu sản xuất SCRIPT -> PRODUCTION", { editor: member.id });

  if (row.assigned_to_email) {
    await createNotification(
      row.assigned_to_email,
      'production_started',
      ideaId,
      `Kịch bản "${row.title}" đã được duyệt! Bắt đầu quay & dựng video ngay nhé.`
    );
  }

  const channelWebhook = await getWebhookUrlForPlatformChannel(row.platform_channel_id);
  await sendDiscordWebhook(
    `🎬 Kịch bản **"${row.title}"** đã được **${member.name}** duyệt — chính thức bước vào giai đoạn SẢN XUẤT.`,
    undefined,
    channelWebhook,
    'general'
  );
  revalidatePath("/");
}

// ==========================================
// 3. CHECKLIST MANAGEMENT ACTION (R4 & R5)
// ==========================================

export async function updateChecklistAction(
  ideaId: string, 
  checklistType: "production" | "qc" | "tiktok", 
  items: ChecklistItem[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const member = await getCurrentMember();
    if (!member) return { success: false, error: "Chưa đăng nhập" };

    const row = await getIdeaRow(ideaId);
    if (!row) return { success: false, error: "Không tìm thấy ý tưởng" };

    if (!["production", "qc", "tiktok"].includes(checklistType)) {
      return { success: false, error: "Loại checklist không hợp lệ" };
    }

    // Role check: Producer CANNOT alter Editor QC Checklist!
    if (checklistType === "qc" && member.role !== "E" && member.role !== "Core") {
      return { success: false, error: "Chỉ Editor hoặc Core mới có quyền tích kiểm QC Checklist" };
    }

    const isAssigned = row.assigned_to_email === member.id;
    const isEditorOrCore = member.role === "E" || member.role === "Core";
    if (!isAssigned && !isEditorOrCore) {
      return { success: false, error: "Bạn không có quyền cập nhật checklist của task này" };
    }

    const sql = getDb();
    const columnName = checklistType === "production" 
      ? "production_checklist" 
      : checklistType === "qc" 
      ? "qc_checklist" 
      : "tiktok_checklist";

    await sql.query(
      `UPDATE ideas SET ${columnName} = $1 WHERE id = $2`,
      [JSON.stringify(items), ideaId]
    );

    const checkedCount = items.filter(i => i.checked).length;
    await recordAuditLog(ideaId, member.id, `Cập nhật checklist ${checklistType} (${checkedCount}/${items.length})`, {
      checklistType,
      checkedCount,
      totalCount: items.length
    });

    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Có lỗi xảy ra khi cập nhật checklist" };
  }
}

// ==========================================
// 4. GATE 3: VIDEO SUBMISSION & PRODUCTION CHECKLIST
// ==========================================

export async function submitVideoWithChecklistAction(
  ideaId: string, 
  payload: { videoDraftLink: string; sourceProjectLink: string; assetFolderLink?: string }
): Promise<{ success: boolean; error?: string }> {
  try {
    const member = await getCurrentMember();
    if (!member) return { success: false, error: "Chưa đăng nhập" };

    const row = await getIdeaRow(ideaId);
    if (!row) return { success: false, error: "Không tìm thấy ý tưởng" };

    const isAssigned = row.assigned_to_email === member.id;
    const isCore = member.role === "Core";
    if (!isAssigned && !isCore && member.role !== "P") {
      return { success: false, error: "Chỉ Producer được giao mới có quyền bàn giao video" };
    }

    if (row.status !== "PRODUCTION" && row.active_gate !== "GATE_3_PRODUCTION") {
      return { success: false, error: "Chỉ có thể nộp video khi task đang ở Cổng 3 (PRODUCTION)" };
    }

    // Asset links validation (R2 Cổng 3)
    if (!payload.videoDraftLink || !payload.videoDraftLink.trim() || !isValidUrl(payload.videoDraftLink.trim())) {
      return { 
        success: false, 
        error: "Bắt buộc phải điền link video bàn giao (videoDraftLink) hợp lệ (bắt đầu bằng http:// hoặc https://)." 
      };
    }

    if (!payload.sourceProjectLink || !payload.sourceProjectLink.trim() || !isValidUrl(payload.sourceProjectLink.trim())) {
      return { 
        success: false, 
        error: "Bắt buộc phải điền link source project (sourceProjectLink) hợp lệ để Editor tiếp quản chỉnh sửa." 
      };
    }

    // Production checklist validation (all 7 items must be checked) (R2 & R4)
    const prodChecklist = parseJsonSafe<ChecklistItem[]>(row.production_checklist, []);
    if (!Array.isArray(prodChecklist) || prodChecklist.length < 7) {
      return {
        success: false,
        error: "Chưa hoàn thành Production Checklist (yêu cầu đủ 7 tiêu chí). Vui lòng kiểm tra và tích đủ tất cả các mục trước khi nộp."
      };
    }

    const uncheckedItems = prodChecklist.filter(i => !i.checked);
    if (uncheckedItems.length > 0) {
      return {
        success: false,
        error: `Chưa hoàn thành 100% Production Checklist (còn ${uncheckedItems.length}/7 tiêu chí chưa hoàn thành). Vui lòng tích đủ 7 mục trước khi nộp.`
      };
    }

    const sql = getDb();
    const now = new Date().toISOString();

    await sql.query(
      `UPDATE ideas SET 
         status = 'QA',
         active_gate = 'GATE_4_QC',
         video_draft_link = $1,
         video_link = $1,
         source_project_link = $2,
         asset_folder_link = COALESCE($3, asset_folder_link),
         video_submitted_at = $4,
         credits_produced_by_email = $5,
         qc_checklist = COALESCE(qc_checklist, $6)
       WHERE id = $7`,
      [
        payload.videoDraftLink.trim(),
        payload.sourceProjectLink.trim(),
        payload.assetFolderLink?.trim() || null,
        now,
        member.id,
        JSON.stringify(DEFAULT_QC_CHECKLIST),
        ideaId
      ]
    );

    await recordAuditLog(ideaId, member.id, "Cổng 3: Bàn giao Video & Source -> Chuyển sang Cổng 4 (QC)", {
      videoDraftLink: payload.videoDraftLink.trim(),
      sourceProjectLink: payload.sourceProjectLink.trim(),
      assetFolderLink: payload.assetFolderLink?.trim() || null
    });

    const editorCoreRows = await sql.query(`SELECT id FROM members WHERE role IN ('E', 'Core') AND active = TRUE`);
    for (const m of (editorCoreRows as any[])) {
      await createNotification(
        m.id,
        'info',
        ideaId,
        `🎥 Producer ${member.name} đã bàn giao video và source cho "${row.title}". Cần Editor QC & hoàn thiện.`
      );
    }

    const channelWebhook = await getWebhookUrlForPlatformChannel(row.platform_channel_id);
    await sendDiscordWebhook(
      `🎥 Producer **${member.name}** đã nộp video draft và source project cho **"${row.title}"**.\n🔗 Draft: ${payload.videoDraftLink.trim()}\n📦 Source: ${payload.sourceProjectLink.trim()}\nChờ Editor QC!`,
      undefined,
      channelWebhook,
      'general'
    );

    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Có lỗi xảy ra khi bàn giao video" };
  }
}

export async function submitVideoAction(ideaId: string, videoLink?: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  const row = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");
  if (row.assigned_to_email !== member.id && member.role !== "P" && member.role !== "Core") {
    throw new Error("Chỉ Producer được giao mới có quyền nộp video");
  }

  if (row.status !== "PRODUCTION" || row.active_gate !== "GATE_3_PRODUCTION") {
    throw new Error("Chỉ ý tưởng ở trạng thái PRODUCTION mới được nộp video");
  }

  const productionChecklist = parseJsonSafe<ChecklistItem[]>(row.production_checklist, []);
  if (!row.source_project_link || productionChecklist.length < 7 || productionChecklist.some(item => !item.checked)) {
    throw new Error("Cổng 3 yêu cầu link source project và Production Checklist hoàn tất. Hãy bàn giao qua SOP console.");
  }

  if (videoLink && !isValidUrl(videoLink.trim())) {
    throw new Error("Link video không hợp lệ. Vui lòng nhập URL hợp lệ bắt đầu bằng http:// hoặc https://");
  }

  const sql = getDb();
  const now = new Date().toISOString();
  await sql.query(
    `UPDATE ideas SET
       status = 'QA',
       active_gate = 'GATE_4_QC',
       video_link = COALESCE($1, video_link),
       video_draft_link = COALESCE($1, video_draft_link),
       video_submitted_at = $2,
       credits_produced_by_email = $3
     WHERE id = $4`,
    [videoLink ? videoLink.trim() : null, now, member.id, ideaId]
  );

  await recordAuditLog(ideaId, member.id, "Nộp video PRODUCTION -> QA", { videoLink });
  const channelWebhook = await getWebhookUrlForPlatformChannel(row.platform_channel_id);
  await sendDiscordWebhook(
    `🎥 Producer **${member.name}** đã nộp video cho **"${row.title}"**. Chờ Ban đào tạo QA kiểm duyệt!`,
    undefined,
    channelWebhook,
    'general'
  );
  revalidatePath("/");
}

// ==========================================
// 5. GATE 4: EDITOR QC VERIFICATION
// ==========================================

export async function approveGate4QcAction(
  ideaId: string, 
  videoFinalLink: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const member = await getCurrentMember();
    if (!member) return { success: false, error: "Chưa đăng nhập" };
    if (member.role !== "E" && member.role !== "Core") {
      return { success: false, error: "Chỉ Editor hoặc Core mới có quyền đánh giá và duyệt QC Cổng 4" };
    }

    const row = await getIdeaRow(ideaId);
    if (!row) return { success: false, error: "Không tìm thấy ý tưởng" };

    if (row.status !== "QA" && row.active_gate !== "GATE_4_QC") {
      return { success: false, error: "Chỉ có thể QC video khi task đang ở Cổng 4 (QA/QC)" };
    }

    if (!videoFinalLink || !videoFinalLink.trim() || !isValidUrl(videoFinalLink.trim())) {
      return { 
        success: false, 
        error: "Bắt buộc phải nhập link video hoàn thiện (videoFinalLink) hợp lệ sau khi Editor đã QC/tinh chỉnh." 
      };
    }

    // QC checklist validation (all 8 items must be checked) (R2 & R4)
    const qcChecklist = parseJsonSafe<ChecklistItem[]>(row.qc_checklist, []);
    if (!Array.isArray(qcChecklist) || qcChecklist.length < 8) {
      return {
        success: false,
        error: "Chưa hoàn thành Editor QC Checklist (yêu cầu đủ 8 tiêu chí). Video chưa đạt tiêu chuẩn QC để chuyển Core duyệt."
      };
    }

    const uncheckedItems = qcChecklist.filter(i => !i.checked);
    if (uncheckedItems.length > 0) {
      return {
        success: false,
        error: `Chưa hoàn thành 100% QC Checklist (còn ${uncheckedItems.length}/8 tiêu chí chưa đạt). Video chưa đạt tiêu chuẩn QC để chuyển Core duyệt.`
      };
    }

    const sql = getDb();
    const now = new Date().toISOString();

    await sql.query(
      `UPDATE ideas SET 
         status = 'CORE_REVIEW',
         active_gate = 'GATE_5_CORE',
         video_final_link = $1,
         published_link = $1,
         gate4_approved_at = $2,
         gate4_approved_by_email = $3,
         credits_qa_by_email = $3
       WHERE id = $4`,
      [
        videoFinalLink.trim(),
        now,
        member.id,
        ideaId
      ]
    );

    await recordAuditLog(ideaId, member.id, "Cổng 4: Editor QC Đạt 100% -> Chuyển sang Cổng 5 (Core Duyệt)", {
      videoFinalLink: videoFinalLink.trim(),
      approvedBy: member.id,
      timestamp: now
    });

    const coreRows = await sql.query(`SELECT id FROM members WHERE role = 'Core' AND active = TRUE`);
    for (const c of (coreRows as any[])) {
      await createNotification(
        c.id,
        'info',
        ideaId,
        `✨ Editor ${member.name} đã hoàn thành QC cho "${row.title}". Video sẵn sàng để Core duyệt chốt!`
      );
    }

    const channelWebhook = await getWebhookUrlForPlatformChannel(row.platform_channel_id);
    await sendDiscordWebhook(
      `✨ **QC HOÀN THÀNH:** Video **"${row.title}"** đã đạt 8/8 tiêu chí QC bởi Editor **${member.name}**.\n🔗 Final: ${videoFinalLink.trim()}\nĐang chờ Core duyệt chốt!`,
      undefined,
      channelWebhook,
      'general'
    );

    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Có lỗi xảy ra khi duyệt QC" };
  }
}

// ==========================================
// 6. GATE 5: CORE FINAL APPROVAL
// ==========================================

export async function approveGate5CoreAction(
  ideaId: string, 
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const member = await getCurrentMember();
    if (!member) return { success: false, error: "Chưa đăng nhập" };
    if (member.role !== "Core") {
      return { success: false, error: "Chỉ Core mới có thẩm quyền phê duyệt chốt Cổng 5." };
    }

    const row = await getIdeaRow(ideaId);
    if (!row) return { success: false, error: "Không tìm thấy ý tưởng" };

    if (row.active_gate !== "GATE_5_CORE" || row.status !== "CORE_REVIEW" || !row.gate4_approved_at) {
      return { success: false, error: "Video chưa qua Cổng 4 (QC của Editor), không thể trình duyệt Core." };
    }
    if (!row.video_final_link?.trim()) return { success: false, error: "Chưa có link bản final đã qua QC để Core duyệt." };

    const sql = getDb();
    await ensureSchema(sql);
    const now = new Date().toISOString();

    await sql.query(
      `UPDATE ideas SET
         status = 'COMPLETE',
         active_gate = 'PUBLISHED',
         gate5_approved_at = $1,
         gate5_approved_by_email = $2,
         gate5_approved_final_url = video_final_link,
         core_approval_notes = $3,
         credits_approved_by_email = $2
       WHERE id = $4`,
      [
        now,
        member.id,
        notes?.trim() || null,
        ideaId
      ]
    );

    await recordAuditLog(ideaId, member.id, "Cổng 5: Core duyệt chốt video -> COMPLETE", {
      coreNotes: notes?.trim() || null,
      approvedBy: member.id,
      timestamp: now
    });

    if (row.assigned_to_email) {
      await createNotification(
        row.assigned_to_email,
        'qa_pass',
        ideaId,
        `🎉 Core ${member.name} đã phê duyệt chốt video "${row.title}"! Công việc đã hoàn thành.`
      );
    }

    const channelWebhook = await getWebhookUrlForPlatformChannel(row.platform_channel_id);
    await sendDiscordWebhook(
      `👑 **CORE PHÊ DUYỆT CHỐT:** Video **"${row.title}"** đã được Core **${member.name}** thông qua!\n${notes ? `> Ghi chú: ${notes.trim()}\n` : ''}Trạng thái: HOÀN THÀNH.`,
      undefined,
      channelWebhook,
      'general'
    );

    revalidatePath("/");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Có lỗi xảy ra khi Core duyệt video" };
  }
}

export async function qaPassAction(ideaId: string, publishedLink: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "E" && member.role !== "Core") {
    throw new Error("Chỉ Editor hoặc Core mới có quyền đánh giá QA");
  }

  if (!publishedLink || !publishedLink.trim() || !isValidUrl(publishedLink.trim())) {
    throw new Error("Bắt buộc phải nhập link sản phẩm đã đăng thật (publishedLink) và phải là một URL hợp lệ");
  }

  const row = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");
  if (row.active_gate !== "READY_TO_PUBLISH" || !row.gate5_approved_at) {
    throw new Error("Publish bị khóa cho đến khi Core duyệt chốt ở Cổng 5.");
  }

  const sql = getDb();
  const now = new Date().toISOString();
  await sql.query(
    `UPDATE ideas SET 
       status = 'COMPLETE',
       active_gate = 'PUBLISHED',
       qa_feedback = '',
       published_link = $1,
       gate4_approved_at = COALESCE(gate4_approved_at, $2),
       gate5_approved_at = COALESCE(gate5_approved_at, $2),
       credits_qa_by_email = $3
     WHERE id = $4`,
    [publishedLink.trim(), now, member.id, ideaId]
  );

  await recordAuditLog(ideaId, member.id, "QA Đạt QA -> COMPLETE", { publishedLink: publishedLink.trim() });

  if (row.assigned_to_email) {
    await createNotification(
      row.assigned_to_email,
      'qa_pass',
      ideaId,
      `🎉 Video "${row.title}" đã ĐẠT kiểm duyệt QA và hoàn thành xuất sắc!`
    );
  }

  const channelWebhook = await getWebhookUrlForPlatformChannel(row.platform_channel_id);
  await sendDiscordWebhook(
    `🎉 **HOÀN THÀNH SẢN PHẨM:** Ý tưởng **"${row.title}"** đã được duyệt QA và đăng tải thành công!\n🔗 Minh chứng: ${publishedLink.trim()}`,
    undefined,
    channelWebhook,
    'general'
  );
  revalidatePath("/");
}

export async function qaFailAction(ideaId: string, qaFeedback: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "E" && member.role !== "Core") {
    throw new Error("Chỉ Editor hoặc Core mới có quyền đánh giá QA");
  }

  if (!qaFeedback || !qaFeedback.trim()) {
    throw new Error("Bắt buộc phải nhập lý do chi tiết khi đánh giá Chưa đạt");
  }

  const row = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");

  const sql = getDb();
  await sql.query(
    `UPDATE ideas SET status = 'PRODUCTION', active_gate = 'GATE_3_PRODUCTION', qa_feedback = $1 WHERE id = $2`,
    [qaFeedback.trim(), ideaId]
  );

  await recordAuditLog(ideaId, member.id, "QA Chưa đạt QA -> PRODUCTION", { qaFeedback: qaFeedback.trim() });

  if (row.assigned_to_email) {
    await createNotification(
      row.assigned_to_email,
      'qa_fail',
      ideaId,
      `⚠️ Video "${row.title}" chưa đạt QA: "${qaFeedback.trim()}". Vui lòng sửa lại trong PRODUCTION.`
    );
  }

  const channelWebhook = await getWebhookUrlForPlatformChannel(row.platform_channel_id);
  await sendDiscordWebhook(
    `⚠️ Video **"${row.title}"** chưa đạt QA bởi **${member.name}**.\n> Ghi chú sửa: ${qaFeedback.trim()}`,
    undefined,
    channelWebhook,
    'general'
  );
  revalidatePath("/");
}

// ==========================================
// 8. POST-PUBLISH ANALYTICS & FEEDBACK LOOP ACTION (R2 & R6)
// ==========================================

export async function savePostPublishMetricsAction(
  ideaId: string, 
  metrics: { 
    views: number; 
    retention: string; 
    ctr: string; 
    comments: number; 
    insights: string; 
    createFeedbackIdea?: boolean;
  }
): Promise<{ success: boolean; feedbackIdeaId?: string; error?: string }> {
  try {
    const member = await getCurrentMember();
    if (!member) return { success: false, error: "Chưa đăng nhập" };
    if (member.role !== "Core" && member.role !== "E") {
      return { success: false, error: "Chỉ Editor hoặc Core mới có quyền ghi nhận chỉ số Analytics" };
    }

    const row = await getIdeaRow(ideaId);
    if (!row) return { success: false, error: "Không tìm thấy ý tưởng" };

    if (row.status !== "COMPLETE" && row.active_gate !== "PUBLISHED") {
      return { success: false, error: "Chỉ có thể nhập Analytics cho video đã xuất bản hoàn thành" };
    }

    const sql = getDb();
    await sql.query(
      `UPDATE ideas SET 
         metrics_views = $1,
         metrics_retention = $2,
         metrics_ctr = $3,
         metrics_comments = $4,
         metrics_insights = $5
       WHERE id = $6`,
      [
        Number(metrics.views) || 0,
        metrics.retention?.trim() || '',
        metrics.ctr?.trim() || '',
        Number(metrics.comments) || 0,
        metrics.insights?.trim() || '',
        ideaId
      ]
    );

    await recordAuditLog(ideaId, member.id, "Lưu chỉ số Analytics sau xuất bản", {
      views: metrics.views,
      retention: metrics.retention,
      ctr: metrics.ctr,
      comments: metrics.comments,
      hasInsights: Boolean(metrics.insights)
    });

    let feedbackIdeaId: string | undefined = undefined;

    // Feedback Loop: Push insight feedback back to Step 1 (PITCH)
    if (metrics.createFeedbackIdea && metrics.insights && metrics.insights.trim()) {
      feedbackIdeaId = crypto.randomUUID();
      const now = new Date().toISOString();

      await sql.query(
        `INSERT INTO ideas (
           id, title, description, platform_channel_id, submitted_by_email,
           status, active_gate, created_at, credits_idea_by_email, last_pitch_week,
           logline, key_message, content_pillar, tags,
           production_checklist, qc_checklist
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
        [
          feedbackIdeaId,
          `[Feedback Loop] Cải tiến từ "${row.title}"`,
          `Bài học & Insight từ video đã đăng "${row.title}":\n${metrics.insights.trim()}`,
          row.platform_channel_id || '',
          member.id,
          'PITCH',
          'GATE_1_IDEA',
          now,
          member.id,
          now.slice(0, 10),
          `Insight: ${metrics.insights.trim().slice(0, 120)}`,
          `Hiệu suất: ${metrics.views} views | Giữ chân: ${metrics.retention} | CTR: ${metrics.ctr}`,
          row.content_pillar || 'Feedback Loop',
          'feedback-loop,analytics',
          JSON.stringify(DEFAULT_PRODUCTION_CHECKLIST),
          JSON.stringify(DEFAULT_QC_CHECKLIST)
        ]
      );

      await recordAuditLog(feedbackIdeaId, member.id, "Tạo ý tưởng mới từ Vòng lặp phản hồi Analytics", {
        sourceIdeaId: ideaId,
        sourceTitle: row.title
      });

      const channelWebhook = await getWebhookUrlForPlatformChannel(row.platform_channel_id);
      await sendDiscordWebhook(
        `🔄 **VÒNG LẶP PHẢN HỒI ANALYTICS:** Đã tạo ý tưởng Pitching mới từ insight của **"${row.title}"**:\n> "${metrics.insights.trim()}"`,
        undefined,
        channelWebhook,
        'idea'
      );
    }

    revalidatePath("/");
    return { success: true, feedbackIdeaId };
  } catch (err: any) {
    return { success: false, error: err.message || "Có lỗi xảy ra khi lưu chỉ số Analytics" };
  }
}

// ==========================================
// 9. TIKTOK DERIVATIVE CUTDOWN ACTION (R5)
// ==========================================

export async function createTikTokDerivativeAction(
  masterIdeaId: string, 
  data: { 
    title: string; 
    hookSummary: string; 
    ctaRoute: string; 
    targetDuration: string; 
    assigneeEmail?: string;
  }
): Promise<{ success: boolean; derivativeId?: string; error?: string }> {
  try {
    const member = await getCurrentMember();
    if (!member) return { success: false, error: "Chưa đăng nhập" };

    const master = await getIdeaRow(masterIdeaId);
    if (!master) return { success: false, error: "Không tìm thấy video YouTube Master" };

    const isApprovedMaster = 
      master.active_gate === "GATE_5_CORE" || 
      master.active_gate === "READY_TO_PUBLISH" || 
      master.active_gate === "PUBLISHED" || 
      master.status === "COMPLETE" || 
      Boolean(master.gate4_approved_at);

    if (!isApprovedMaster) {
      return { 
        success: false, 
        error: "Chỉ có thể tạo task phái sinh TikTok từ video Master đã qua duyệt QC hoặc hoàn thành." 
      };
    }

    if (!data.title || !data.title.trim()) {
      return { success: false, error: "Tên video TikTok Cutdown không được để trống" };
    }

    if (!data.hookSummary || !data.hookSummary.trim()) {
      return { success: false, error: "Tóm tắt Hook 0-3s không được để trống" };
    }

    if (!data.ctaRoute || !data.ctaRoute.trim()) {
      return { success: false, error: "Mục tiêu CTA điều hướng YouTube không được để trống" };
    }

    const sql = getDb();
    const derivativeId = crypto.randomUUID();
    const now = new Date().toISOString();
    const sourceVideoUrl = master.published_link || master.video_final_link || master.video_draft_link || master.video_link || '';
    const assignedTo = data.assigneeEmail?.trim() || master.assigned_to_email || member.id;

    await sql.query(
      `INSERT INTO ideas (
         id, title, description, platform_channel_id, submitted_by_email,
         status, active_gate, created_at, assigned_at, assigned_to_email,
         credits_idea_by_email, platform_type, derivative_type, parent_task_id,
         source_video_url, tiktok_target_duration, tiktok_reframe_applied,
         tiktok_hook_summary, tiktok_cta_route, tiktok_checklist,
         production_checklist, qc_checklist, script_status, script_locked
       ) VALUES (
         $1, $2, $3, $4, $5,
         $6, $7, $8, $9, $10,
         $11, $12, $13, $14,
         $15, $16, $17,
         $18, $19, $20,
         $21, $22, $23, $24
       )`,
      [
        derivativeId,
        data.title.trim(),
        `Video TikTok Cutdown (9:16) phái sinh từ YouTube Master "${master.title}". Luận điểm đắt giá: ${data.hookSummary.trim()}`,
        master.platform_channel_id || '',
        member.id,
        'ASSIGNMENT',
        'GATE_2_SCRIPT',
        now,
        now,
        assignedTo,
        member.id,
        'TIKTOK_CUTDOWN',
        'TIKTOK_CUTDOWN',
        masterIdeaId,
        sourceVideoUrl,
        data.targetDuration?.trim() || '30-45s',
        true,
        data.hookSummary.trim(),
        data.ctaRoute.trim(),
        JSON.stringify(DEFAULT_TIKTOK_CHECKLIST),
        JSON.stringify(DEFAULT_PRODUCTION_CHECKLIST),
        JSON.stringify(DEFAULT_QC_CHECKLIST),
        'DRAFT',
        false
      ]
    );

    await recordAuditLog(masterIdeaId, member.id, "Tách nhánh phái sinh TikTok Cutdown", {
      derivativeId,
      derivativeTitle: data.title.trim()
    });

    await recordAuditLog(derivativeId, member.id, "Khởi tạo task phái sinh TikTok Cutdown từ Master", {
      parentTaskId: masterIdeaId,
      masterTitle: master.title
    });

    if (assignedTo) {
      await createNotification(
        assignedTo,
        'assigned',
        derivativeId,
        `Bạn được giao sản xuất video TikTok Cutdown 9:16 "${data.title.trim()}" (phái sinh từ "${master.title}").`
      );
    }

    const channelWebhook = await getWebhookUrlForPlatformChannel(master.platform_channel_id);
    await sendDiscordWebhook(
      `📱 **TÁCH NHÁNH TIKTOK CUTDOWN (9:16):** Đã tạo task **"${data.title.trim()}"** từ Master **"${master.title}"** (Thời lượng: ${data.targetDuration || '30-45s'}).`,
      undefined,
      channelWebhook,
      'general'
    );

    revalidatePath("/");
    return { success: true, derivativeId };
  } catch (err: any) {
    return { success: false, error: err.message || "Có lỗi xảy ra khi tạo task phái sinh TikTok" };
  }
}

// ==========================================
// 10. TASK MANAGEMENT ACTIONS (PRESERVED)
// ==========================================

export async function reassignIdeaAction(ideaId: string, newAssigneeEmail: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền chuyển giao ý tưởng");

  if (!newAssigneeEmail || !newAssigneeEmail.trim()) {
    throw new Error("Bắt buộc phải chọn 1 người phụ trách mới");
  }

  const row = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");

  const oldAssignee = row.assigned_to_email;
  const sql = getDb();
  await sql.query(`UPDATE ideas SET assigned_to_email = $1 WHERE id = $2`, [newAssigneeEmail.trim(), ideaId]);

  await recordAuditLog(ideaId, member.id, "Chuyển giao ý tưởng", { from: oldAssignee, to: newAssigneeEmail });

  await createNotification(
    newAssigneeEmail,
    'assigned',
    ideaId,
    `Bạn đã được gán phụ trách ý tưởng "${row.title}" thay cho ${oldAssignee}`
  );

  await sendDiscordWebhook(`🔄 Ý tưởng **"${row.title}"** đã được chuyển giao cho **${newAssigneeEmail}** (Người cũ: ${oldAssignee || "Không có"})`);
  revalidatePath("/");
}

export async function updateIdeaDetailsAction(
  ideaId: string, 
  title: string, 
  description: string, 
  platformChannelId: string, 
  tags: string = "",
  internalNote: string = "",
  logline: string = "",
  referenceLinks: string = "",
  angle: string = "",
  keyMessage: string = "",
  contentPillar: string = ""
) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  const row = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");

  const canEdit = member.role === "Core" || member.role === "E" || (row.status === "PITCH" && row.submitted_by_email === member.id);
  if (!canEdit) throw new Error("Bạn không có quyền sửa thông tin ý tưởng này");

  const sql = getDb();
  if (member.role === "Core") {
    await sql.query(
      `UPDATE ideas SET title = $1, description = $2, platform_channel_id = $3, tags = $4, internal_note = $5, logline = $6, reference_links = $7, angle = $8, key_message = $9, content_pillar = $10 WHERE id = $11`,
      [title.trim(), description.trim(), platformChannelId.trim(), tags.trim(), internalNote.trim(), logline.trim(), referenceLinks.trim(), angle.trim(), keyMessage.trim(), contentPillar.trim(), ideaId]
    );
  } else {
    await sql.query(
      `UPDATE ideas SET title = $1, description = $2, platform_channel_id = $3, tags = $4, logline = $5, reference_links = $6, angle = $7, key_message = $8, content_pillar = $9 WHERE id = $10`,
      [title.trim(), description.trim(), platformChannelId.trim(), tags.trim(), logline.trim(), referenceLinks.trim(), angle.trim(), keyMessage.trim(), contentPillar.trim(), ideaId]
    );
  }

  await recordAuditLog(ideaId, member.id, "Cập nhật thông tin ý tưởng", { title, platformChannelId, tags });
  revalidatePath("/");
}

export async function extendDeadlineAction(ideaId: string, newEndDate: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền gia hạn deadline");

  const row = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");

  const oldEndDate = row.end_date;
  const sql = getDb();
  await sql.query(`UPDATE ideas SET end_date = $1, deadline_production = $1 WHERE id = $2`, [newEndDate, ideaId]);

  await recordAuditLog(ideaId, member.id, "Gia hạn deadline", { oldEndDate, newEndDate });

  if (row.assigned_to_email) {
    await createNotification(
      row.assigned_to_email,
      'info',
      ideaId,
      `⏰ Deadline của ý tưởng "${row.title}" đã được dời sang ${newEndDate}`
    );
  }

  await sendDiscordWebhook(`⏰ Deadline ý tưởng **"${row.title}"** được dời sang **${newEndDate}** bởi ${member.name}`);
  revalidatePath("/");
}

export async function updateScheduledPostDateAction(ideaId: string, scheduledPostDate: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền lên lịch ngày đăng bài");

  const row = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");

  const sql = getDb();
  await sql.query(`UPDATE ideas SET scheduled_post_date = $1 WHERE id = $2`, [scheduledPostDate || '', ideaId]);

  await recordAuditLog(ideaId, member.id, "Cập nhật lịch đăng bài", { scheduledPostDate });
  revalidatePath("/");
}

export async function archiveUnselectedIdeasAction() {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền thực hiện lưu trữ ý tưởng");

  const sql = getDb();
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const res = await sql.query(
    `UPDATE ideas SET status = 'ARCHIVED_IDEA'
     WHERE status = 'PITCH' AND CAST(COALESCE(created_at, '2026-01-01') AS TIMESTAMPTZ) < $1
     RETURNING id`,
    [twoWeeksAgo.toISOString()]
  );

  const archivedCount = res.length;
  for (const r of (res as any[])) {
    await recordAuditLog(r.id, member.id, "Tự động lưu trữ ý tưởng sau 2 tuần PITCH");
  }

  revalidatePath("/");
  return { archivedCount };
}

export async function restoreArchivedIdeaAction(ideaId: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền khôi phục ý tưởng lưu trữ");

  const row = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");

  const sql = getDb();
  const nowStr = new Date().toISOString().slice(0, 10);
  await sql.query(
    `UPDATE ideas SET status = 'PITCH', active_gate = 'GATE_1_IDEA', last_pitch_week = $1 WHERE id = $2`,
    [nowStr, ideaId]
  );

  await recordAuditLog(ideaId, member.id, "Khôi phục ý tưởng lưu trữ vào PITCH");
  revalidatePath("/");
}

export async function deleteIdeaAction(ideaId: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  const row = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");

  const canDelete = member.role === "Core" || member.role === "E" || (row.status === "PITCH" && row.submitted_by_email === member.id);
  if (!canDelete) {
    throw new Error("Bạn không có quyền xoá ý tưởng này");
  }

  const sql = getDb();
  await sql.query(`DELETE FROM ideas WHERE id = $1`, [ideaId]);
  await recordAuditLog(ideaId, member.id, "Xoá ý tưởng khỏi hệ thống", { title: row.title });
  revalidatePath("/");
}

export async function cancelIdeaAction(ideaId: string, reason: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  const row = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");

  if (row.status === "COMPLETE") {
    throw new Error("Không thể huỷ ý tưởng đã hoàn thành");
  }

  const canCancel = member.role === "Core" || member.role === "E" || (row.status === "PITCH" && row.submitted_by_email === member.id);
  if (!canCancel) {
    throw new Error("Bạn không có quyền huỷ ý tưởng này");
  }

  const sql = getDb();
  const now = new Date().toISOString();
  await sql.query(
    `UPDATE ideas SET 
       status = 'CANCELLED',
       cancel_reason = $1,
       cancelled_by_email = $2,
       cancelled_at = $3,
       scheduled_post_date = ''
     WHERE id = $4`,
    [reason || "", member.id, now, ideaId]
  );

  await recordAuditLog(ideaId, member.id, "Huỷ ý tưởng", { reason });
  revalidatePath("/");
}

export async function updateIdeaNoteAction(ideaId: string, internalNote: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền sửa ghi chú nội bộ");

  const row = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");

  const sql = getDb();
  await sql.query(`UPDATE ideas SET internal_note = $1 WHERE id = $2`, [internalNote.trim(), ideaId]);

  await recordAuditLog(ideaId, member.id, "Cập nhật ghi chú nội bộ");
  revalidatePath("/");
}

export async function rateIdeaAction(ideaId: string, rating: number) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền đánh giá sản phẩm");

  if (rating < 1 || rating > 5) throw new Error("Điểm đánh giá phải từ 1 đến 5 sao");

  const row = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");
  if (row.status !== "COMPLETE") throw new Error("Chỉ có thể đánh giá ý tưởng đã hoàn thành");

  const sql = getDb();
  await sql.query(`UPDATE ideas SET rating = $1 WHERE id = $2`, [rating, ideaId]);

  await recordAuditLog(ideaId, member.id, `Đánh giá sản phẩm ${rating} sao`);
  revalidatePath("/");
}

export async function cloneIdeaAction(ideaId: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  const sourceRow = await getIdeaRow(ideaId);
  if (!sourceRow) throw new Error("Không tìm thấy ý tưởng gốc");

  const newIdeaId = crypto.randomUUID();
  const now = new Date().toISOString();

  const sql = getDb();
  await sql.query(
    `INSERT INTO ideas (
      id, title, description, platform_channel_id, submitted_by_email,
      status, active_gate, created_at, credits_idea_by_email, last_pitch_week, tags,
      logline, reference_links, angle, key_message, content_pillar,
      production_checklist, qc_checklist
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9, $10, $11,
      $12, $13, $14, $15, $16,
      $17, $18
    )`,
    [
      newIdeaId,
      sourceRow.title + " (Copy)",
      sourceRow.description || '',
      sourceRow.platform_channel_id || '',
      member.id,
      "PITCH",
      "GATE_1_IDEA",
      now,
      member.id,
      now.slice(0, 10),
      sourceRow.tags || '',
      sourceRow.logline || '',
      sourceRow.reference_links || '',
      sourceRow.angle || '',
      sourceRow.key_message || '',
      sourceRow.content_pillar || '',
      JSON.stringify(DEFAULT_PRODUCTION_CHECKLIST),
      JSON.stringify(DEFAULT_QC_CHECKLIST)
    ]
  );

  await recordAuditLog(newIdeaId, member.id, "Nhân bản ý tưởng từ " + sourceRow.title, { sourceId: ideaId });
  revalidatePath("/");
  return { success: true, id: newIdeaId };
}

export async function triggerDailyCronAction() {
  const sql = getDb();
  const rows = await sql.query(`SELECT * FROM ideas`);
  let updated = false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(today.getDate() - 14);

  for (const row of (rows as any[])) {
    const status = row.status;
    const pitchWeek = row.last_pitch_week;
    const assignedTo = row.assigned_to_email;
    const ideaId = row.id;
    const endDateStr = row.end_date;
    
    // Auto-archive old PITCH
    if (status === 'PITCH') {
      const pitchDateStr = pitchWeek || row.created_at;
      if (pitchDateStr) {
        const pitchDate = new Date(pitchDateStr);
        if (pitchDate < twoWeeksAgo) {
          await sql.query(`UPDATE ideas SET status = 'ARCHIVED_IDEA' WHERE id = $1`, [ideaId]);
          updated = true;
          await recordAuditLog(ideaId, "SYSTEM", "Tự động lưu trữ ý tưởng PITCH quá hạn (14 ngày)", {});
        }
      }
    }

    // Overdue notifications
    if ((status === 'ASSIGNMENT' || status === 'SCRIPT' || status === 'PRODUCTION' || status === 'QA') && endDateStr) {
      const endDate = new Date(endDateStr);
      if (endDate < today && assignedTo) {
        await createNotification(
          assignedTo, 
          'warning', 
          ideaId, 
          `Nhiệm vụ của bạn đang trễ hạn!`
        );
      }
    }
  }

  if (updated) {
    revalidatePath("/");
  }
  return { success: true };
}


export async function updateIdeaPlatformChannelAction(ideaId: string, platformChannelId: string) {
  const { getCurrentMember } = await import("./auth-actions");
  const member = await getCurrentMember();
  if (!member || member.role !== "Core") throw new Error("Unauthorized");
  const { getDb } = await import("../lib/db");
  const sql = getDb();
  await sql.query("UPDATE ideas SET platform_channel_id = $1 WHERE id = $2", [platformChannelId, ideaId]);
  const { revalidatePath } = await import("next/cache");
  revalidatePath("/");
}
