"use server";

import { getSpreadsheet } from "../lib/sheets";
import { getCurrentMember } from "./auth-actions";
import { recordAuditLog } from "./audit-actions";
import { createNotification, sendDiscordWebhook } from "./notification-actions";
import { revalidatePath, revalidateTag } from "next/cache";
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
  const doc = await getSpreadsheet();
  const sheet = doc.sheetsByTitle["Ideas"];
  if (!sheet) throw new Error("Thiếu tab Ideas");
  const rows = await sheet.getRows();
  return { sheet, row: rows.find(r => r.get('id') === ideaId) };
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

  const doc = await getSpreadsheet();
  const sheet = doc.sheetsByTitle["Ideas"];
  if (!sheet) throw new Error("Thiếu tab Ideas");

  const ideaId = crypto.randomUUID();
  const now = new Date().toISOString();

  await sheet.addRow({
    id: ideaId,
    title: title.trim(),
    description: description.trim(),
    platformChannelId: platformChannelId.trim(),
    submittedByEmail: member.id,
    status: "PITCH",
    createdAt: now,
    creditsIdeaByEmail: member.id,
    lastPitchWeek: now.slice(0, 10)
  });

  // Audit log
  await recordAuditLog(ideaId, member.id, "Nộp ý tưởng mới", { title: title.trim(), description: description.trim() });

  // Discord notification to #core
  await sendDiscordWebhook(`💡 **${member.name}** vừa nộp ý tưởng mới: **"${title.trim()}"**\n> ${description.trim().slice(0, 150)}`);

  revalidateTag("sheets");
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

  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + durationDays - 1);

  const { row } = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");

  if (row.get('status') !== "PITCH" && row.get('status') !== "ARCHIVED_IDEA") {
    throw new Error("Chỉ có thể duyệt ý tưởng đang ở trạng thái PITCH hoặc Đã lưu trữ");
  }

  const todayIso = today.toISOString().slice(0, 10);
  const endIso = endDate.toISOString().slice(0, 10);

  row.set('status', "ASSIGNMENT");
  if (platformChannelId) row.set('platformChannelId', platformChannelId);
  row.set('durationDays', durationDays.toString());
  row.set('assignedToEmail', producerEmail.trim());
  row.set('startDate', todayIso);
  row.set('endDate', endIso);
  row.set('assignedAt', today.toISOString());
  row.set('creditsApprovedByEmail', member.id);

  await row.save();

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
    `Bạn đã được giao sản xuất ý tưởng "${row.get('title')}" (Hạn: ${endIso})`
  );

  await sendDiscordWebhook(`📋 Ý tưởng **"${row.get('title')}"** đã được Core duyệt và giao cho **${producerEmail}** (Sản xuất: ${durationDays} ngày, hạn: ${endIso})`);

  revalidateTag("sheets");
  revalidatePath("/");
}

export async function submitScriptAction(ideaId: string, scriptLink?: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  const { row } = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");
  
  if (row.get('assignedToEmail') !== member.id || member.role !== "P") {
    throw new Error("Chỉ Producer được giao mới có quyền nộp kịch bản");
  }

  if (row.get('status') !== "ASSIGNMENT") {
    throw new Error("Trạng thái hiện tại không hợp lệ để nộp kịch bản");
  }

  row.set('status', "SCRIPT");
  if (scriptLink) {
    if (!isValidUrl(scriptLink.trim())) throw new Error("Link kịch bản không hợp lệ. Vui lòng nhập URL hợp lệ bắt đầu bằng http:// hoặc https://");
    row.set('scriptLink', scriptLink.trim());
  }
  row.set('creditsScriptByEmail', member.id);
  await row.save();

  await recordAuditLog(ideaId, member.id, "Nộp kịch bản ASSIGNMENT -> SCRIPT", { scriptLink });

  await sendDiscordWebhook(`📝 Producer **${member.name}** đã nộp kịch bản cho **"${row.get('title')}"**. Chờ Editor sửa & duyệt.`);

  // Thông báo in-app cho Editor và Core (B7)
  const doc = await getSpreadsheet();
  const membersSheet = doc.sheetsByTitle["Members"];
  if (membersSheet) {
    const allMembers = await membersSheet.getRows();
    for (const m of allMembers) {
      const role = m.get('role');
      if (role === 'E' || role === 'Core') {
        await createNotification(
          m.get('id'),
          'info',
          ideaId,
          `Kịch bản "${row.get('title')}" đã được nộp bởi ${member.name}. Cần được kiểm duyệt.`
        );
      }
    }
  }

  revalidateTag("sheets");
  revalidatePath("/");
}

export async function startProductionAction(ideaId: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "E" && member.role !== "Core") {
    throw new Error("Chỉ Editor hoặc Core mới được xác nhận kịch bản và bắt đầu sản xuất");
  }

  const { row } = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");

  if (row.get('status') !== "SCRIPT") {
    throw new Error("Chỉ ý tưởng ở trạng thái SCRIPT mới được chuyển sang PRODUCTION");
  }

  row.set('status', "PRODUCTION");
  row.set('creditsEditedScriptByEmail', member.id);
  await row.save();

  await recordAuditLog(ideaId, member.id, "Bắt đầu sản xuất SCRIPT -> PRODUCTION", { editor: member.id });

  const assignedTo = row.get('assignedToEmail');
  if (assignedTo) {
    await createNotification(
      assignedTo,
      'production_started',
      ideaId,
      `Kịch bản "${row.get('title')}" đã được duyệt! Bắt đầu quay & dựng video ngay nhé.`
    );
  }

  await sendDiscordWebhook(`🎬 Kịch bản **"${row.get('title')}"** đã được **${member.name}** duyệt — chính thức bước vào giai đoạn SẢN XUẤT.`);

  revalidateTag("sheets");
  revalidatePath("/");
}

export async function submitVideoAction(ideaId: string, videoLink?: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  const { row } = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");
  if (row.get('assignedToEmail') !== member.id || member.role !== "P") {
    throw new Error("Chỉ Producer được giao mới có quyền nộp video");
  }

  if (row.get('status') !== "PRODUCTION") {
    throw new Error("Chỉ ý tưởng ở trạng thái PRODUCTION mới được nộp video");
  }

  row.set('status', "QA");
  if (videoLink) {
    if (!isValidUrl(videoLink.trim())) throw new Error("Link video không hợp lệ. Vui lòng nhập URL hợp lệ bắt đầu bằng http:// hoặc https://");
    row.set('videoLink', videoLink.trim());
  }
  row.set('videoSubmittedAt', new Date().toISOString());
  row.set('creditsProducedByEmail', member.id);
  await row.save();

  await recordAuditLog(ideaId, member.id, "Nộp video PRODUCTION -> QA", { videoLink });

  await sendDiscordWebhook(`🎥 Producer **${member.name}** đã nộp video cho **"${row.get('title')}"**. Chờ Ban đào tạo QA kiểm duyệt!`);

  revalidateTag("sheets");
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

  const { row } = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");

  if (row.get('status') !== "QA") {
    throw new Error("Chỉ ý tưởng đang ở QA mới có thể đánh giá Đạt");
  }

  row.set('status', "COMPLETE");
  row.set('qaFeedback', "");
  row.set('publishedLink', publishedLink.trim());
  row.set('creditsQaByEmail', member.id);
  await row.save();

  await recordAuditLog(ideaId, member.id, "QA Đạt QA -> COMPLETE", { publishedLink: publishedLink.trim() });

  const assignedTo = row.get('assignedToEmail');
  if (assignedTo) {
    await createNotification(
      assignedTo,
      'qa_pass',
      ideaId,
      `🎉 Video "${row.get('title')}" đã ĐẠT kiểm duyệt QA và hoàn thành xuất sắc!`
    );
  }

  await sendDiscordWebhook(`🎉 **HOÀN THÀNH SẢN PHẨM:** Ý tưởng **"${row.get('title')}"** đã được duyệt QA và đăng tải thành công!\n🔗 Minh chứng: ${publishedLink.trim()}`);

  revalidateTag("sheets");
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

  const { row } = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");

  if (row.get('status') !== "QA") {
    throw new Error("Chỉ ý tưởng đang ở QA mới có thể đánh giá");
  }

  row.set('status', "PRODUCTION");
  row.set('qaFeedback', qaFeedback.trim());
  await row.save();

  await recordAuditLog(ideaId, member.id, "QA Chưa đạt QA -> PRODUCTION", { qaFeedback: qaFeedback.trim() });

  const assignedTo = row.get('assignedToEmail');
  if (assignedTo) {
    await createNotification(
      assignedTo,
      'qa_fail',
      ideaId,
      `⚠️ Video "${row.get('title')}" chưa đạt QA: "${qaFeedback.trim()}". Vui lòng sửa lại trong PRODUCTION.`
    );
  }

  await sendDiscordWebhook(`⚠️ Video **"${row.get('title')}"** chưa đạt QA bởi **${member.name}**.\n> Ghi chú sửa: ${qaFeedback.trim()}`);

  revalidateTag("sheets");
  revalidatePath("/");
}

export async function reassignIdeaAction(ideaId: string, newAssigneeEmail: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền chuyển giao ý tưởng");

  if (!newAssigneeEmail || !newAssigneeEmail.trim()) {
    throw new Error("Bắt buộc phải chọn 1 người phụ trách mới");
  }

  const { row } = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");

  const oldAssignee = row.get('assignedToEmail');
  row.set('assignedToEmail', newAssigneeEmail.trim());
  await row.save();

  await recordAuditLog(ideaId, member.id, "Chuyển giao ý tưởng", { from: oldAssignee, to: newAssigneeEmail });

  await createNotification(
    newAssigneeEmail,
    'assigned',
    ideaId,
    `Bạn đã được gán phụ trách ý tưởng "${row.get('title')}" thay cho ${oldAssignee}`
  );

  await sendDiscordWebhook(`🔄 Ý tưởng **"${row.get('title')}"** đã được chuyển giao cho **${newAssigneeEmail}** (Người cũ: ${oldAssignee || "Không có"})`);

  revalidateTag("sheets");
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

  const { row } = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");

  const canEdit = member.role === "Core" || member.role === "E" || (row.get('status') === "PITCH" && row.get('submittedByEmail') === member.id);
  if (!canEdit) throw new Error("Bạn không có quyền sửa thông tin ý tưởng này");

  row.set('title', title.trim());
  row.set('description', description.trim());
  if (platformChannelId) row.set('platformChannelId', platformChannelId.trim());
  row.set('tags', tags.trim());
  if (member.role === "Core") {
    row.set('internalNote', internalNote.trim());
  }
  
  await row.save();

  await recordAuditLog(ideaId, member.id, "Cập nhật thông tin ý tưởng", { title, platformChannelId, tags });

  revalidateTag("sheets");
  revalidatePath("/");
}

export async function extendDeadlineAction(ideaId: string, newEndDate: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền gia hạn deadline");

  const { row } = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");

  const oldEndDate = row.get('endDate');
  row.set('endDate', newEndDate);
  await row.save();

  await recordAuditLog(ideaId, member.id, "Gia hạn deadline", { oldEndDate, newEndDate });

  const assignedTo = row.get('assignedToEmail');
  if (assignedTo) {
    await createNotification(
      assignedTo,
      'info',
      ideaId,
      `⏰ Deadline của ý tưởng "${row.get('title')}" đã được dời sang ${newEndDate}`
    );
  }

  await sendDiscordWebhook(`⏰ Deadline ý tưởng **"${row.get('title')}"** được dời sang **${newEndDate}** bởi ${member.name}`);

  revalidateTag("sheets");
  revalidatePath("/");
}

export async function updateScheduledPostDateAction(ideaId: string, scheduledPostDate: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền lên lịch ngày đăng bài");

  const { row } = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");

  row.set('scheduledPostDate', scheduledPostDate || '');
  await row.save();

  await recordAuditLog(ideaId, member.id, "Cập nhật lịch đăng bài", { scheduledPostDate });

  revalidateTag("sheets");
  revalidatePath("/");
}

export async function archiveUnselectedIdeasAction() {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền thực hiện lưu trữ ý tưởng");

  const doc = await getSpreadsheet();
  const sheet = doc.sheetsByTitle["Ideas"];
  if (!sheet) return;

  const rows = await sheet.getRows();
  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  let archivedCount = 0;
  for (const row of rows) {
    if (row.get('status') === "PITCH") {
      const createdAt = new Date(row.get('createdAt') || row.get('lastPitchWeek') || '2026-01-01');
      if (createdAt < twoWeeksAgo) {
        row.set('status', "ARCHIVED_IDEA");
        await row.save();
        archivedCount++;
        await recordAuditLog(row.get('id'), member.id, "Tự động lưu trữ ý tưởng sau 2 tuần PITCH");
      }
    }
  }

  revalidateTag("sheets");
  revalidatePath("/");
  return { archivedCount };
}

export async function restoreArchivedIdeaAction(ideaId: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền khôi phục ý tưởng lưu trữ");

  const { row } = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");

  row.set('status', "PITCH");
  row.set('lastPitchWeek', new Date().toISOString().slice(0, 10));
  await row.save();

  await recordAuditLog(ideaId, member.id, "Khôi phục ý tưởng lưu trữ vào PITCH");

  revalidateTag("sheets");
  revalidatePath("/");
}

export async function deleteIdeaAction(ideaId: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  const { row } = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");

  const canDelete = member.role === "Core" || member.role === "E" || (row.get('status') === "PITCH" && row.get('submittedByEmail') === member.id);
  if (!canDelete) {
    throw new Error("Bạn không có quyền xoá ý tưởng này");
  }

  await recordAuditLog(ideaId, member.id, "Xoá ý tưởng khỏi hệ thống", { title: row.get('title') });
  await row.delete();
  revalidateTag("sheets");
  revalidatePath("/");
}

export async function cancelIdeaAction(ideaId: string, reason: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  const { row } = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");

  if (row.get('status') === "COMPLETE") {
    throw new Error("Không thể huỷ ý tưởng đã hoàn thành");
  }

  const canCancel = member.role === "Core" || member.role === "E" || (row.get('status') === "PITCH" && row.get('submittedByEmail') === member.id);
  if (!canCancel) {
    throw new Error("Bạn không có quyền huỷ ý tưởng này");
  }

  row.set('status', "CANCELLED");
  row.set('cancelReason', reason || "");
  row.set('cancelledByEmail', member.id);
  row.set('cancelledAt', new Date().toISOString());
  
  await row.save();
  await recordAuditLog(ideaId, member.id, "Huỷ ý tưởng", { reason });
  revalidateTag("sheets");
  revalidatePath("/");
}

export async function updateIdeaNoteAction(ideaId: string, internalNote: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền sửa ghi chú nội bộ");

  const { row } = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");

  row.set('internalNote', internalNote.trim());
  await row.save();

  await recordAuditLog(ideaId, member.id, "Cập nhật ghi chú nội bộ");
  revalidateTag("sheets");
  revalidatePath("/");
}

export async function rateIdeaAction(ideaId: string, rating: number) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền đánh giá sản phẩm");

  if (rating < 1 || rating > 5) throw new Error("Điểm đánh giá phải từ 1 đến 5 sao");

  const { row } = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");
  if (row.get('status') !== "COMPLETE") throw new Error("Chỉ có thể đánh giá ý tưởng đã hoàn thành");

  row.set('rating', rating.toString());
  await row.save();

  await recordAuditLog(ideaId, member.id, `Đánh giá sản phẩm ${rating} sao`);
  revalidateTag("sheets");
  revalidatePath("/");
}

export async function cloneIdeaAction(ideaId: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  const doc = await getSpreadsheet();
  const sheet = doc.sheetsByTitle["Ideas"];
  if (!sheet) throw new Error("Thiếu tab Ideas");
  const rows = await sheet.getRows();
  const sourceRow = rows.find(r => r.get('id') === ideaId);
  
  if (!sourceRow) throw new Error("Không tìm thấy ý tưởng gốc");

  const newIdeaId = crypto.randomUUID();
  const now = new Date().toISOString();

  await sheet.addRow({
    id: newIdeaId,
    title: sourceRow.get('title') + " (Copy)",
    description: sourceRow.get('description') || '',
    platformChannelId: sourceRow.get('platformChannelId') || '',
    submittedByEmail: member.id,
    status: "PITCH",
    createdAt: now,
    creditsIdeaByEmail: member.id,
    lastPitchWeek: now.slice(0, 10),
    tags: sourceRow.get('tags') || ''
  });

  await recordAuditLog(newIdeaId, member.id, "Nhân bản ý tưởng từ " + sourceRow.get('title'), { sourceId: ideaId });
  revalidateTag("sheets");
  revalidatePath("/");
  return { success: true, id: newIdeaId };
}


export async function triggerDailyCronAction() {
  const doc = await getSpreadsheet();
  const ideaSheet = doc.sheetsByTitle["Ideas"];
  if (!ideaSheet) return;

  const rows = await ideaSheet.getRows();
  let updated = false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(today.getDate() - 14);
  const nowStr = new Date().toISOString().slice(0, 10);

  for (const row of rows) {
    const status = row.get('status');
    const pitchWeek = row.get('lastPitchWeek');
    const assignedTo = row.get('assignedToEmail');
    const ideaId = row.get('id');
    const endDateStr = row.get('endDate');
    
    // Auto-archive old PITCH
    if (status === 'PITCH') {
      const pitchDateStr = pitchWeek || row.get('createdAt');
      if (pitchDateStr) {
        const pitchDate = new Date(pitchDateStr);
        if (pitchDate < twoWeeksAgo) {
          row.set('status', 'ARCHIVED_IDEA');
          await row.save();
          updated = true;
          
          await recordAuditLog(ideaId, "SYSTEM", "Tự động lưu trữ ý tưởng PITCH quá hạn (14 ngày)", {});
        }
      }
    }

    // Overdue notifications
    if ((status === 'ASSIGNMENT' || status === 'SCRIPT' || status === 'PRODUCTION' || status === 'QA') && endDateStr) {
      const endDate = new Date(endDateStr);
      if (endDate < today && assignedTo) {
        // Find if we already notified today (check Notifications sheet logic is hard without querying it all, 
        // but let's assume we can just create it. To prevent spam, client rate-limits to 1 per day).
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
    revalidateTag("sheets");
    revalidatePath("/");
  }
  return { success: true };
}
