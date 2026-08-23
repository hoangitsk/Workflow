"use server";

import { getSpreadsheet } from "../lib/sheets";
import { getCurrentMember } from "./auth-actions";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

async function getIdeaRow(ideaId: string) {
  const doc = await getSpreadsheet();
  const sheet = doc.sheetsByTitle["Ideas"];
  if (!sheet) throw new Error("Thiếu tab Ideas");
  const rows = await sheet.getRows();
  return { sheet, row: rows.find(r => r.get('id') === ideaId) };
}

export async function submitIdeaAction(title: string, channelId: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  const doc = await getSpreadsheet();
  const sheet = doc.sheetsByTitle["Ideas"];
  if (!sheet) throw new Error("Thiếu tab Ideas");

  await sheet.addRow({
    id: crypto.randomUUID(),
    title,
    channelId,
    submittedByEmail: member.id,
    status: "PITCH",
    createdAt: new Date().toISOString(),
    creditsIdeaByEmail: member.id,
  });
  
  revalidatePath("/");
}

export async function approveIdeaAction(ideaId: string, platform: string, durationDays: number, producerEmail: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới được duyệt ý tưởng");

  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + durationDays - 1);

  const { row } = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");

  row.set('status', "ASSIGNMENT");
  row.set('platform', platform);
  row.set('durationDays', durationDays);
  row.set('assignedToEmail', producerEmail);
  row.set('startDate', today.toISOString());
  row.set('endDate', endDate.toISOString());
  row.set('assignedAt', today.toISOString());
  row.set('creditsApprovedByEmail', member.id);

  await row.save();
  revalidatePath("/");
}

export async function submitScriptAction(ideaId: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  const { row } = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");
  if (row.get('assignedToEmail') !== member.id || member.role !== "P") {
    throw new Error("Chỉ Producer được giao mới có quyền nộp kịch bản");
  }

  row.set('status', "SCRIPT");
  row.set('creditsScriptByEmail', member.id);
  await row.save();
  revalidatePath("/");
}

export async function startProductionAction(ideaId: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "E" && member.role !== "Core") {
    throw new Error("Chỉ Editor hoặc Core mới được xác nhận kịch bản xong");
  }

  const { row } = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");

  row.set('status', "PRODUCTION");
  row.set('creditsEditedScriptByEmail', member.id);
  await row.save();
  revalidatePath("/");
}

export async function submitVideoAction(ideaId: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  const { row } = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");
  if (row.get('assignedToEmail') !== member.id || member.role !== "P") {
    throw new Error("Chỉ Producer được giao mới có quyền nộp video");
  }

  row.set('status', "QA");
  row.set('videoSubmittedAt', new Date().toISOString());
  row.set('creditsProducedByEmail', member.id);
  await row.save();
  revalidatePath("/");
}

export async function qaPassAction(ideaId: string, publishedLink: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "E" && member.role !== "Core") {
    throw new Error("Chỉ Editor hoặc Core mới có quyền QA");
  }

  if (!publishedLink || !publishedLink.trim()) {
    throw new Error("Bắt buộc phải nhập link sản phẩm đã đăng");
  }

  const { row } = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");

  row.set('status', "COMPLETE");
  row.set('qaFeedback', "");
  row.set('publishedLink', publishedLink.trim());
  row.set('creditsQaByEmail', member.id);
  await row.save();
  revalidatePath("/");
}

export async function qaFailAction(ideaId: string, qaFeedback: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "E" && member.role !== "Core") {
    throw new Error("Chỉ Editor hoặc Core mới có quyền QA");
  }

  if (!qaFeedback || !qaFeedback.trim()) {
    throw new Error("Bắt buộc phải nhập lý do chưa đạt");
  }

  const { row } = await getIdeaRow(ideaId);
  if (!row) throw new Error("Không tìm thấy ý tưởng");

  row.set('status', "PRODUCTION");
  row.set('qaFeedback', qaFeedback.trim());
  await row.save();
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

  await row.delete();
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
  revalidatePath("/");
}
