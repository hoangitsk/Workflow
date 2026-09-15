// src/actions/production-actions.ts

"use server";

import { getDb } from "../lib/db";
import { getCurrentMember } from "./auth-actions";
import { recordAuditLog } from "./audit-actions";
import { sendDiscordWebhook, getWebhookUrlForPlatformChannel } from "./notification-actions";
import { revalidatePath } from "next/cache";
import { DEFAULT_QC_CHECKLIST } from "../lib/types";

// Utility to fetch idea row
async function getIdeaRow(ideaId: string) {
  const sql = getDb();
  const rows = await sql.query(`SELECT * FROM ideas WHERE id = $1 LIMIT 1`, [ideaId]);
  return rows[0] as any;
}

/**
 * Submit Production assets and checklist for a given idea.
 * This is Gate 3 – Production.
 */
export async function submitProductionAction(
  ideaId: string,
  masterVideoLink: string,
  productionChecklist = DEFAULT_QC_CHECKLIST,
  assetFolderLink?: string
) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  const idea = await getIdeaRow(ideaId);
  if (!idea) throw new Error("Không tìm thấy ý tưởng");
  if (idea.active_gate !== "GATE_3_PRODUCTION" || idea.status !== "PRODUCTION") {
    throw new Error("Idea không ở trạng thái Gate 3 để nộp production");
  }

  if (!isValidUrl(masterVideoLink)) {
    throw new Error("Link video master không hợp lệ");
  }

  const sql = getDb();
  const now = new Date().toISOString();
  await sql.query(
    `UPDATE ideas SET
       masterVideoLink = $1,
       assetFolderLink = $2,
       productionChecklist = $3,
       updated_at = $4
     WHERE id = $5`,
    [
      masterVideoLink,
      assetFolderLink ?? null,
      JSON.stringify(productionChecklist),
      now,
      ideaId,
    ]
  );

  await recordAuditLog(ideaId, member.id, "Nộp production", { masterVideoLink, assetFolderLink });
  const webhook = await getWebhookUrlForPlatformChannel(idea.platform_channel_id);
  const msg = `🎬 **${member.name}** đã nộp Production cho ý tưởng *${idea.title}*`;
  await sendDiscordWebhook(msg, undefined, webhook, "general", true);

  revalidatePath("/ideas/");
  return { success: true };
}

/**
 * Approve Gate 3 – move to QC gate.
 */
export async function approveGate3ProductionAction(
  ideaId: string,
  deadlineQc?: string
) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core" && member.role !== "E") {
    throw new Error("Chỉ Core hoặc Editor mới duyệt Production");
  }

  const idea = await getIdeaRow(ideaId);
  if (!idea) throw new Error("Không tìm thấy ý tưởng");
  if (idea.active_gate !== "GATE_3_PRODUCTION" || idea.status !== "PRODUCTION") {
    throw new Error("Idea không ở Gate 3 để duyệt production");
  }

  const sql = getDb();
  const now = new Date().toISOString();
  await sql.query(
    `UPDATE ideas SET
       status = 'QA',
       active_gate = 'GATE_4_QC',
       deadline_qc = $1,
       qc_started_at = $2,
       updated_at = $2
     WHERE id = $3`,
    [deadlineQc?.trim() || null, now, ideaId]
  );

  await recordAuditLog(ideaId, member.id, "Duyệt Production – chuyển sang QC", {});
  const webhook = await getWebhookUrlForPlatformChannel(idea.platform_channel_id);
  const msg = `✅ **${member.name}** đã duyệt Production và chuyển ý tưởng *${idea.title}* sang QC`;
  await sendDiscordWebhook(msg, undefined, webhook, "general", true);

  revalidatePath("/ideas/");
  return { success: true };
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}
