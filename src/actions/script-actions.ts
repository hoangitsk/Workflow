// src/actions/script-actions.ts

"use server";

import { getDb } from "../lib/db";
import { getCurrentMember } from "./auth-actions";
import { recordAuditLog } from "./audit-actions";
import { sendDiscordWebhook, getWebhookUrlForPlatformChannel } from "./notification-actions";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { ScriptData, DEFAULT_PRODUCTION_CHECKLIST, DEFAULT_QC_CHECKLIST } from "../lib/types";

// Utility to fetch idea row
async function getIdeaRow(ideaId: string) {
  const sql = getDb();
  const rows = await sql.query(`SELECT * FROM ideas WHERE id = $1 LIMIT 1`, [ideaId]);
  return rows[0] as any;
}

/**
 * Submit the 4‑column script data for a given idea.
 * This is Gate 2 – Script.
 */
export async function submitScriptAction(
  ideaId: string,
  script: ScriptData,
  productionChecklist = DEFAULT_PRODUCTION_CHECKLIST,
  qcChecklist = DEFAULT_QC_CHECKLIST
) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  // Validate that the idea is in the correct gate
  const idea = await getIdeaRow(ideaId);
  if (!idea) throw new Error("Không tìm thấy ý tưởng");
  if (idea.active_gate !== "GATE_2_SCRIPT" || idea.status !== "ASSIGNMENT") {
    throw new Error("Ý tưởng không ở trạng thái Gate 2 để nộp script");
  }

  const sql = getDb();
  const now = new Date().toISOString();
  await sql.query(
    `UPDATE ideas SET
       script_data = $1,
       script_status = 'DRAFT',
       production_checklist = $2,
       qc_checklist = $3,
       updated_at = $4
     WHERE id = $5`,
    [
      JSON.stringify(script),
      JSON.stringify(productionChecklist),
      JSON.stringify(qcChecklist),
      now,
      ideaId,
    ]
  );

  await recordAuditLog(ideaId, member.id, "Nộp script", { script });
  const webhook = await getWebhookUrlForPlatformChannel(idea.platform_channel_id);
  const msg = `🖊️ **${member.name}** đã nộp Script cho ý tưởng *${idea.title}*`;
  await sendDiscordWebhook(msg, undefined, webhook, "general", true);

  revalidatePath("/ideas/");
  return { success: true };
}

/**
 * Approve Gate 2 – move idea to Production gate.
 */
export async function approveGate2ScriptAction(
  ideaId: string,
  deadlineProduction?: string
) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core" && member.role !== "E") {
    throw new Error("Chỉ Core hoặc Editor mới duyệt script");
  }

  const idea = await getIdeaRow(ideaId);
  if (!idea) throw new Error("Không tìm thấy ý tưởng");
  if (idea.active_gate !== "GATE_2_SCRIPT" || idea.status !== "ASSIGNMENT") {
    throw new Error("Idea không ở Gate 2 để duyệt script");
  }

  const sql = getDb();
  const now = new Date().toISOString();
  await sql.query(
    `UPDATE ideas SET
       status = 'PRODUCTION',
       active_gate = 'GATE_3_PRODUCTION',
       deadline_production = $1,
       production_started_at = $2,
       updated_at = $2
     WHERE id = $3`,
    [deadlineProduction?.trim() || null, now, ideaId]
  );

  await recordAuditLog(ideaId, member.id, "Duyệt Script – chuyển sang Production", {});
  const webhook = await getWebhookUrlForPlatformChannel(idea.platform_channel_id);
  const msg = `🚀 **${member.name}** đã duyệt Script và chuyển ý tưởng *${idea.title}* sang Production`;
  await sendDiscordWebhook(msg, undefined, webhook, "general", true);

  revalidatePath("/ideas/");
  return { success: true };
}
