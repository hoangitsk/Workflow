"use server";

import { getDb } from "../lib/db";
import { getCurrentMember } from "./auth-actions";
import { createNotification, sendDiscordWebhook } from "./notification-actions";
import { recordAuditLog } from "./audit-actions";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function addCommentAction(ideaId: string, content: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  if (!content || !content.trim()) {
    throw new Error("Nội dung bình luận không được để trống");
  }

  const sql = getDb();
  const ideaRows = await sql.query(`SELECT * FROM ideas WHERE id = $1 LIMIT 1`, [ideaId]);
  const ideaRow = ideaRows[0] as any;
  if (!ideaRow) throw new Error("Không tìm thấy ý tưởng");

  const commentId = crypto.randomUUID();
  const now = new Date().toISOString();

  await sql.query(
    `INSERT INTO comments (id, idea_id, member_id, content, created_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [commentId, ideaId, member.id, content.trim(), now]
  );

  // Record audit log
  await recordAuditLog(ideaId, member.id, "Thêm bình luận", { commentPreview: content.trim().slice(0, 80) });

  // Notify relevant users (assignedTo, submittedBy)
  const assignedTo = ideaRow.assigned_to_email;
  const submittedBy = ideaRow.submitted_by_email;
  const ideaTitle = ideaRow.title || 'Ý tưởng';

  const notifyTargets = new Set<string>();
  if (assignedTo && assignedTo !== member.id) notifyTargets.add(assignedTo);
  if (submittedBy && submittedBy !== member.id) notifyTargets.add(submittedBy);

  for (const target of notifyTargets) {
    await createNotification(
      target,
      'comment',
      ideaId,
      `${member.name} đã bình luận trên ý tưởng "${ideaTitle}": ${content.trim().slice(0, 60)}...`
    );
  }

  // Optional Discord notification
  await sendDiscordWebhook(`💬 **${member.name}** bình luận trên ý tưởng **${ideaTitle}**:\n> ${content.trim()}`);

  revalidatePath("/");
  return { success: true, id: commentId };
}

