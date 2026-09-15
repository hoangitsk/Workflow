// src/actions/core-actions.ts

"use server";

import { getDb } from "../lib/db";
import { getCurrentMember } from "./auth-actions";
import { recordAuditLog } from "./audit-actions";
import { sendDiscordWebhook, getWebhookUrlForPlatformChannel } from "./notification-actions";
import { revalidatePath } from "next/cache";

// Utility to fetch idea row
async function getIdeaRow(ideaId: string) {
  const sql = getDb();
  const rows = await sql.query(`SELECT * FROM ideas WHERE id = $1 LIMIT 1`, [ideaId]);
  return rows[0] as any;
}

/**
 * Approve Gate 5 – final Core review and mark as ready to publish.
 */
export async function approveCoreAction(
  ideaId: string,
  targetPublishDate?: string,
  publishMetadata?: { title?: string; thumbnail?: string; caption?: string; hashtags?: string }
) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") {
    throw new Error("Chỉ Core mới có quyền duyệt cuối cùng");
  }

  const idea = await getIdeaRow(ideaId);
  if (!idea) throw new Error("Không tìm thấy ý tưởng");
  if (idea.active_gate !== "GATE_5_CORE" || idea.status !== "CORE_REVIEW") {
    throw new Error("Idea không ở Gate 5 để duyệt Core");
  }

  const sql = getDb();
  const now = new Date().toISOString();
  await sql.query(
    `UPDATE ideas SET
       status = 'READY_TO_PUBLISH',
       active_gate = 'READY_TO_PUBLISH',
       deadline_core = $1,
       target_publish_date = $2,
       published_title = $3,
       published_thumbnail = $4,
       published_caption = $5,
       published_hashtags = $6,
       updated_at = $7
     WHERE id = $8`,
    [
      targetPublishDate?.trim() || null,
      targetPublishDate?.trim() || null,
      publishMetadata?.title || null,
      publishMetadata?.thumbnail || null,
      publishMetadata?.caption || null,
      publishMetadata?.hashtags || null,
      now,
      ideaId,
    ]
  );

  await recordAuditLog(ideaId, member.id, "Duyệt Core – sẵn sàng publish", {});
  const webhook = await getWebhookUrlForPlatformChannel(idea.platform_channel_id);
  const msg = `🏆 **${member.name}** đã duyệt Core và đưa ý tưởng *${idea.title}* vào trạng thái Ready to Publish`;
  await sendDiscordWebhook(msg, undefined, webhook, "general", true);

  revalidatePath("/ideas/");
  return { success: true };
}
