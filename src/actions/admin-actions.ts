"use server";

import { getSpreadsheet } from "../lib/sheets";
import { getCurrentMember } from "./auth-actions";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

// Channels
export async function createChannelAction(name: string, color: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền tạo kênh");

  const doc = await getSpreadsheet();
  const sheet = doc.sheetsByTitle["Channels"];
  if (!sheet) throw new Error("Thiếu tab Channels");

  await sheet.addRow({
    id: crypto.randomUUID(),
    name,
    color,
    archived: "FALSE"
  });

  revalidatePath("/");
}

export async function archiveChannelAction(channelId: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền xoá kênh");

  const doc = await getSpreadsheet();
  const channelsSheet = doc.sheetsByTitle["Channels"];
  const ideasSheet = doc.sheetsByTitle["Ideas"];
  if (!channelsSheet || !ideasSheet) throw new Error("Thiếu tab Channels hoặc Ideas");

  const ideaRows = await ideasSheet.getRows();
  const ideaCount = ideaRows.filter(r => r.get('channelId') === channelId).length;

  const channelRows = await channelsSheet.getRows();
  const row = channelRows.find(r => r.get('id') === channelId);
  if (!row) throw new Error("Không tìm thấy kênh");

  if (ideaCount === 0) {
    await row.delete();
  } else {
    row.set('archived', "TRUE");
    await row.save();
  }

  revalidatePath("/");
}

export async function restoreChannelAction(channelId: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền khôi phục kênh");

  const doc = await getSpreadsheet();
  const sheet = doc.sheetsByTitle["Channels"];
  if (!sheet) throw new Error("Thiếu tab Channels");

  const rows = await sheet.getRows();
  const row = rows.find(r => r.get('id') === channelId);
  if (!row) throw new Error("Không tìm thấy kênh");

  row.set('archived', "FALSE");
  await row.save();

  revalidatePath("/");
}

// Members
export async function createMemberAction(name: string, role: string, email: string, phone?: string, facebook?: string, primaryExpertise?: string, secondaryExpertise?: string) {
  const doc = await getSpreadsheet();
  const sheet = doc.sheetsByTitle["Members"];
  if (!sheet) throw new Error("Thiếu tab Members");

  const rows = await sheet.getRows();
  const totalMembers = rows.length;
  
  const member = await getCurrentMember();
  if (totalMembers > 0) {
    if (!member) throw new Error("Chưa đăng nhập");
    if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền tạo thành viên");
  }

  await sheet.addRow({
    id: email.toLowerCase().trim(), // ID is the email!
    name,
    role,
    phone: phone || "",
    facebook: facebook || "",
    primaryExpertise: primaryExpertise || "",
    secondaryExpertise: secondaryExpertise || ""
  });

  revalidatePath("/");
}

export async function updateMemberProfileAction(email: string, phone: string, facebook: string, primaryExpertise: string, secondaryExpertise: string) {
  const current = await getCurrentMember();
  if (!current) throw new Error("Chưa đăng nhập");
  if (current.role !== "Core") throw new Error("Chỉ Core mới có quyền sửa hồ sơ thành viên");

  const doc = await getSpreadsheet();
  const sheet = doc.sheetsByTitle["Members"];
  if (!sheet) throw new Error("Thiếu tab Members");

  const rows = await sheet.getRows();
  const row = rows.find(r => r.get('id') === email);
  if (!row) throw new Error("Không tìm thấy thành viên");

  row.set('phone', phone);
  row.set('facebook', facebook);
  row.set('primaryExpertise', primaryExpertise);
  row.set('secondaryExpertise', secondaryExpertise);
  await row.save();
  revalidatePath("/");
}

export async function removeMemberAction(memberEmailToRemove: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền xoá thành viên");

  const doc = await getSpreadsheet();
  const ideasSheet = doc.sheetsByTitle["Ideas"];
  const membersSheet = doc.sheetsByTitle["Members"];
  
  if (ideasSheet) {
    const ideaRows = await ideasSheet.getRows();
    const activeAssignedIdeas = ideaRows.filter(r => 
      r.get('assignedToEmail') === memberEmailToRemove && 
      r.get('status') !== "COMPLETE"
    ).length;

    if (activeAssignedIdeas > 0) {
      throw new Error("Không thể xoá — thành viên đang phụ trách idea chưa hoàn thành");
    }
  }

  const memberRows = await membersSheet.getRows();
  const row = memberRows.find(r => r.get('id') === memberEmailToRemove);
  if (row) {
    await row.delete();
  }

  revalidatePath("/");
}
