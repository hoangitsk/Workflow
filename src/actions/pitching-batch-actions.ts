"use server";

import { getDb } from "../lib/db";
import { getCurrentMember } from "./auth-actions";
import { recordAuditLog } from "./audit-actions";
import { createNotification } from "./notification-actions";
import { sendDiscordWebhook } from "../lib/discord";
import { revalidatePath } from "next/cache";

export async function createPitchingBatchAction(
  title: string,
  description: string,
  deadline: string,
  channelGroupId?: string
) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền tạo đợt Call Pitching");

  if (!title || !title.trim()) throw new Error("Tiêu đề đợt pitching không được để trống");
  if (!deadline || !deadline.trim()) throw new Error("Vui lòng chọn hạn chót nộp ý tưởng");

  const sql = getDb();
  const batchId = `batch_${Date.now().toString(36)}`;
  const now = new Date().toISOString();

  await sql.query(
    `INSERT INTO pitching_batches (id, title, description, deadline, channel_group_id, created_by_email, created_at, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      batchId,
      title.trim(),
      description.trim(),
      deadline.trim(),
      channelGroupId?.trim() || null,
      member.id,
      now,
      'OPEN'
    ]
  );

  // Send notifications to all active members
  const membersRows = await sql.query(`SELECT id FROM members WHERE active = true`);
  for (const m of (membersRows as any[])) {
    await createNotification(
      m.id,
      'pitch_batch',
      batchId,
      `📢 ĐỢT CALL PITCHING MỚI: "${title.trim()}" (Hạn nộp: ${deadline.trim()})`
    );
  }

  // Audit log
  await recordAuditLog('', member.id, "Tạo đợt Call Pitching mới", { title: title.trim(), deadline });

  // Discord notification to team channel
  await sendDiscordWebhook(
    `📢 **ĐỢT CALL PITCHING MỚI: "${title.trim()}"**\n> ⏰ Hạn nộp ý tưởng: **${deadline.trim()}**${description ? `\n> 📝 Yêu cầu: ${description.trim()}` : ''}`
  );

  revalidatePath("/");
  return { success: true, id: batchId };
}

export async function closePitchingBatchAction(batchId: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền đóng đợt Call Pitching");

  const sql = getDb();
  await sql.query(`UPDATE pitching_batches SET status = 'CLOSED' WHERE id = $1`, [batchId]);

  await recordAuditLog('', member.id, "Đóng đợt Call Pitching", { batchId });
  revalidatePath("/");
}
