"use server";

import { getSpreadsheet } from "../lib/sheets";
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

  const doc = await getSpreadsheet();
  const commentsSheet = doc.sheetsByTitle["Comments"];
  const ideasSheet = doc.sheetsByTitle["Ideas"];
  if (!commentsSheet || !ideasSheet) throw new Error("Thiếu bảng dữ liệu Comments hoặc Ideas");

  const ideaRows = await ideasSheet.getRows();
  const ideaRow = ideaRows.find(r => r.get('id') === ideaId);
  if (!ideaRow) throw new Error("Không tìm thấy ý tưởng");

  const commentId = crypto.randomUUID();
  await commentsSheet.addRow({
    id: commentId,
    ideaId,
    memberId: member.id,
    content: content.trim(),
    createdAt: new Date().toISOString()
  });

  // Record audit log
  await recordAuditLog(ideaId, member.id, "Thêm bình luận", { commentPreview: content.trim().slice(0, 80) });

  // Notify relevant users (assignedTo, submittedBy)
  const assignedTo = ideaRow.get('assignedToEmail');
  const submittedBy = ideaRow.get('submittedByEmail');
  const ideaTitle = ideaRow.get('title') || 'Ý tưởng';

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
