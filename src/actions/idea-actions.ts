"use server";

import { getDb } from "../lib/db";
import { getCurrentMember } from "./auth-actions";
import { recordAuditLog } from "./audit-actions";
import { createNotification, sendDiscordWebhook } from "./notification-actions";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

function isValidUrl(string: string) {
  try {
    new URL(string);
    return true;
  } catch (err) {
    return false;
  }
}

async function getIdeaRow(ideaId: string) {
  const sql = getDb();
  const rows = await sql.query(`SELECT * FROM ideas WHERE id = $1 LIMIT 1`, [ideaId]);
  return rows[0] as any;
}

export async function submitIdeaAction(title: string, description: string, platformChannelId: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  if (!title || !title.trim()) {
    throw new Error("Tên ý tưởng không được để trống");
  }

  if (!description || !description.trim()) {
    throw new Error("Mô tả ý tưởng là bắt buộc (nói về gì, góc quay/tone dự kiến, tham khảo nếu có)");
  }

  if (!platformChannelId || !platformChannelId.trim()) {
    throw new Error("Vui lòng chọn Kênh & Nền tảng cho ý tưởng");
  }

  const sql = getDb();
  const ideaId = crypto.randomUUID();
  const now = new Date().toISOString();

  await sql.query(
    `INSERT INTO ideas (
      id, title, description, platform_channel_id, submitted_by_email,
      status, created_at, credits_idea_by_email, last_pitch_week
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      ideaId,
      title.trim(),
      description.trim(),
      platformChannelId.trim(),
      member.id,
      "PITCH",
      now,
      member.id,
      now.slice(0, 10)
    ]
  );

  // Audit log
  await recordAuditLog(ideaId, member.id, "Nộp ý tưởng mới", { title: title.trim(), description: description.trim() });

  // Discord notification to #core
  await sendDiscordWebhook(`💡 **${member.name}** vừa nộp ý tưởng mới: **"${title.trim()}"**\n> ${description.trim().slice(0, 150)}`);

  revalidatePath("/");
  return { success: true, id: ideaId };
}

export async function approveIdeaAction(ideaId: string, durationDays: number, producerEmail: string, platformChannelId?: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền duyệt ý tưởng vào top sản xuất");

  if (!producerEmail || !producerEmail.trim()) {
    throw new Error("Bắt buộc phải chọn 1 Producer cụ thể phụ trách");
  }

  if (!durationDays || durationDays < 1) {
    throw new Error("Số ngày sản xuất phải từ 1 ngày trở lên");
  }

  const row = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");

  if (row.status !== "PITCH" && row.status !== "ARCHIVED_IDEA") {
    throw new Error("Chỉ có thể duyệt ý tưởng đang ở trạng thái PITCH hoặc Đã lưu trữ");
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
       platform_channel_id = COALESCE($1, platform_channel_id),
       duration_days = $2,
       assigned_to_email = $3,
       start_date = $4,
       end_date = $5,
       assigned_at = $6,
       credits_approved_by_email = $7
     WHERE id = $8`,
    [
      platformChannelId ? platformChannelId.trim() : null,
      durationDays,
      producerEmail.trim(),
      todayIso,
      endIso,
      today.toISOString(),
      member.id,
      ideaId
    ]
  );

  // Audit log
  await recordAuditLog(ideaId, member.id, "Duyệt ý tưởng PITCH -> ASSIGNMENT", {
    durationDays,
    assignedToEmail: producerEmail,
    startDate: todayIso,
    endDate: endIso
  });

  // Notify assigned producer
  await createNotification(
    producerEmail,
    'assigned',
    ideaId,
    `Bạn đã được giao sản xuất ý tưởng "${row.title}" (Hạn: ${endIso})`
  );

  await sendDiscordWebhook(`📋 Ý tưởng **"${row.title}"** đã được Core duyệt và giao cho **${producerEmail}** (Sản xuất: ${durationDays} ngày, hạn: ${endIso})`);

  revalidatePath("/");
}

export async function submitScriptAction(ideaId: string, scriptLink?: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  const row = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");
  
  if (row.assigned_to_email !== member.id || member.role !== "P") {
    throw new Error("Chỉ Producer được giao mới có quyền nộp kịch bản");
  }

  if (row.status !== "ASSIGNMENT") {
    throw new Error("Trạng thái hiện tại không hợp lệ để nộp kịch bản");
  }

  if (scriptLink && !isValidUrl(scriptLink.trim())) {
    throw new Error("Link kịch bản không hợp lệ. Vui lòng nhập URL hợp lệ bắt đầu bằng http:// hoặc https://");
  }

  const sql = getDb();
  await sql.query(
    `UPDATE ideas SET
       status = 'SCRIPT',
       script_link = COALESCE($1, script_link),
       credits_script_by_email = $2
     WHERE id = $3`,
    [scriptLink ? scriptLink.trim() : null, member.id, ideaId]
  );

  await recordAuditLog(ideaId, member.id, "Nộp kịch bản ASSIGNMENT -> SCRIPT", { scriptLink });
  await sendDiscordWebhook(`📝 Producer **${member.name}** đã nộp kịch bản cho **"${row.title}"**. Chờ Editor sửa & duyệt.`);

  // In-app notification for Editor and Core
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

  if (row.status !== "SCRIPT") {
    throw new Error("Chỉ ý tưởng ở trạng thái SCRIPT mới được chuyển sang PRODUCTION");
  }

  const sql = getDb();
  await sql.query(
    `UPDATE ideas SET status = 'PRODUCTION', credits_edited_script_by_email = $1 WHERE id = $2`,
    [member.id, ideaId]
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

  await sendDiscordWebhook(`🎬 Kịch bản **"${row.title}"** đã được **${member.name}** duyệt — chính thức bước vào giai đoạn SẢN XUẤT.`);
  revalidatePath("/");
}

export async function submitVideoAction(ideaId: string, videoLink?: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  const row = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");
  if (row.assigned_to_email !== member.id || member.role !== "P") {
    throw new Error("Chỉ Producer được giao mới có quyền nộp video");
  }

  if (row.status !== "PRODUCTION") {
    throw new Error("Chỉ ý tưởng ở trạng thái PRODUCTION mới được nộp video");
  }

  if (videoLink && !isValidUrl(videoLink.trim())) {
    throw new Error("Link video không hợp lệ. Vui lòng nhập URL hợp lệ bắt đầu bằng http:// hoặc https://");
  }

  const sql = getDb();
  const now = new Date().toISOString();
  await sql.query(
    `UPDATE ideas SET
       status = 'QA',
       video_link = COALESCE($1, video_link),
       video_submitted_at = $2,
       credits_produced_by_email = $3
     WHERE id = $4`,
    [videoLink ? videoLink.trim() : null, now, member.id, ideaId]
  );

  await recordAuditLog(ideaId, member.id, "Nộp video PRODUCTION -> QA", { videoLink });
  await sendDiscordWebhook(`🎥 Producer **${member.name}** đã nộp video cho **"${row.title}"**. Chờ Ban đào tạo QA kiểm duyệt!`);
  revalidatePath("/");
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

  if (row.status !== "QA") {
    throw new Error("Chỉ ý tưởng đang ở QA mới có thể đánh giá Đạt");
  }

  const sql = getDb();
  await sql.query(
    `UPDATE ideas SET 
       status = 'COMPLETE',
       qa_feedback = '',
       published_link = $1,
       credits_qa_by_email = $2
     WHERE id = $3`,
    [publishedLink.trim(), member.id, ideaId]
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

  await sendDiscordWebhook(`🎉 **HOÀN THÀNH SẢN PHẨM:** Ý tưởng **"${row.title}"** đã được duyệt QA và đăng tải thành công!\n🔗 Minh chứng: ${publishedLink.trim()}`);
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

  if (row.status !== "QA") {
    throw new Error("Chỉ ý tưởng đang ở QA mới có thể đánh giá");
  }

  const sql = getDb();
  await sql.query(
    `UPDATE ideas SET status = 'PRODUCTION', qa_feedback = $1 WHERE id = $2`,
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

  await sendDiscordWebhook(`⚠️ Video **"${row.title}"** chưa đạt QA bởi **${member.name}**.\n> Ghi chú sửa: ${qaFeedback.trim()}`);
  revalidatePath("/");
}

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
  internalNote: string = ""
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
      `UPDATE ideas SET title = $1, description = $2, platform_channel_id = $3, tags = $4, internal_note = $5 WHERE id = $6`,
      [title.trim(), description.trim(), platformChannelId.trim(), tags.trim(), internalNote.trim(), ideaId]
    );
  } else {
    await sql.query(
      `UPDATE ideas SET title = $1, description = $2, platform_channel_id = $3, tags = $4 WHERE id = $5`,
      [title.trim(), description.trim(), platformChannelId.trim(), tags.trim(), ideaId]
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
  await sql.query(`UPDATE ideas SET end_date = $1 WHERE id = $2`, [newEndDate, ideaId]);

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
    `UPDATE ideas SET status = 'PITCH', last_pitch_week = $1 WHERE id = $2`,
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
       cancelled_at = $3
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
      status, created_at, credits_idea_by_email, last_pitch_week, tags
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      newIdeaId,
      sourceRow.title + " (Copy)",
      sourceRow.description || '',
      sourceRow.platform_channel_id || '',
      member.id,
      "PITCH",
      now,
      member.id,
      now.slice(0, 10),
      sourceRow.tags || ''
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

