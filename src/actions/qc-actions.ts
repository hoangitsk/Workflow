// src/actions/qc-actions.ts

"use server";

import { getDb } from "../lib/db";
import { getCurrentMember } from "./auth-actions";
import { recordAuditLog } from "./audit-actions";
import { sendDiscordWebhook, getWebhookUrlForPlatformChannel } from "./notification-actions";
import { revalidatePath } from "next/cache";
import { ChecklistItem, DEFAULT_QC_CHECKLIST } from "../lib/types";

// Utility to fetch idea row
async function getIdeaRow(ideaId: string) {
  const sql = getDb();
  const rows = await sql.query(`SELECT * FROM ideas WHERE id = $1 LIMIT 1`, [ideaId]);
  return rows[0] as any;
}

/**
 * Submit QC checklist for a given idea.
 * This is Gate 4 – QC.
 */
export async function submitQcAction(
  ideaId: string,
  qcChecklist = DEFAULT_QC_CHECKLIST
) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  const idea = await getIdeaRow(ideaId);
  if (!idea) throw new Error("Không tìm thấy ý tưởng");
  if (idea.active_gate !== "GATE_4_QC" || idea.status !== "QA") {
    throw new Error("Idea không ở trạng thái Gate 4 để nộp QC");
  }

  const sql = getDb();
  const now = new Date().toISOString();
  await sql.query(
    `UPDATE ideas SET
       qcChecklist = $1,
       updated_at = $2
     WHERE id = $3`,
    [JSON.stringify(qcChecklist), now, ideaId]
  );

  await recordAuditLog(ideaId, member.id, "Nộp QC checklist", {});
  const webhook = await getWebhookUrlForPlatformChannel(idea.platform_channel_id);
  const msg = `✅ **${member.name}** đã nộp QC checklist cho ý tưởng *${idea.title}*`;
  await sendDiscordWebhook(msg, undefined, webhook, "general", true);

  revalidatePath("/ideas/");
  return { success: true };
}

/**
 * Approve Gate 4 – move to Core gate.
 */
export async function approveGate4QcAction(
  ideaId: string,
  deadlineCore?: string
) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core" && member.role !== "E") {
    throw new Error("Chỉ Core hoặc Editor mới duyệt QC");
  }

  const idea = await getIdeaRow(ideaId);
  if (!idea) throw new Error("Không tìm thấy ý tưởng");
  if (idea.active_gate !== "GATE_4_QC" || idea.status !== "QA") {
    throw new Error("Idea không ở Gate 4 để duyệt QC");
  }

  const sql = getDb();
  const now = new Date().toISOString();
  await sql.query(
    `UPDATE ideas SET
       status = 'CORE_REVIEW',
       active_gate = 'GATE_5_CORE',
       deadline_core = $1,
       core_started_at = $2,
       updated_at = $2
     WHERE id = $3`,
    [deadlineCore?.trim() || null, now, ideaId]
  );

  await recordAuditLog(ideaId, member.id, "Duyệt QC – chuyển sang Core", {});
  const webhook = await getWebhookUrlForPlatformChannel(idea.platform_channel_id);
  const msg = `🚀 **${member.name}** đã duyệt QC và chuyển ý tưởng *${idea.title}* sang Core Review`;
  await sendDiscordWebhook(msg, undefined, webhook, "general", true);

  revalidatePath("/ideas/");
  return { success: true };
}
