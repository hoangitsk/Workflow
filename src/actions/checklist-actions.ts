"use server";

import { getSpreadsheet } from "../lib/sheets";
import { getCurrentMember } from "./auth-actions";
import { revalidatePath, revalidateTag } from "next/cache";
import crypto from "crypto";

export async function createChecklistAction(name: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  const doc = await getSpreadsheet();
  const sheet = doc.sheetsByTitle["Checklists"];
  if (!sheet) throw new Error("Thiếu tab Checklists");

  await sheet.addRow({
    id: crypto.randomUUID(),
    name,
    status: "Chưa bắt đầu",
    createdByEmail: member.id,
  });

  revalidateTag('sheets');
  revalidatePath("/");
}

export async function updateChecklistStatusAction(id: string, newStatus: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  const doc = await getSpreadsheet();
  const sheet = doc.sheetsByTitle["Checklists"];
  if (!sheet) throw new Error("Thiếu tab Checklists");

  const rows = await sheet.getRows();
  const row = rows.find(r => r.get('id') === id);
  if (!row) throw new Error("Không tìm thấy việc");

  row.set('status', newStatus);
  await row.save();
  revalidateTag('sheets');
  revalidatePath("/");
}

export async function updateChecklistDetailsAction(id: string, assignedToEmail?: string, dueDate?: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  const doc = await getSpreadsheet();
  const sheet = doc.sheetsByTitle["Checklists"];
  if (!sheet) throw new Error("Thiếu tab Checklists");

  const rows = await sheet.getRows();
  const row = rows.find(r => r.get('id') === id);
  if (!row) throw new Error("Không tìm thấy việc");

  if (assignedToEmail !== undefined) row.set('assignedToEmail', assignedToEmail);
  if (dueDate !== undefined) row.set('dueDate', dueDate);

  await row.save();
  revalidateTag('sheets');
  revalidatePath("/");
}

export async function deleteChecklistAction(id: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  const doc = await getSpreadsheet();
  const sheet = doc.sheetsByTitle["Checklists"];
  if (!sheet) throw new Error("Thiếu tab Checklists");

  const rows = await sheet.getRows();
  const row = rows.find(r => r.get('id') === id);
  if (!row) throw new Error("Không tìm thấy việc");

  if (member.role !== "Core" && row.get('createdByEmail') !== member.id) {
    throw new Error("Chỉ Core hoặc người tạo mới được xoá");
  }

  await row.delete();
  revalidateTag('sheets');
  revalidatePath("/");
}
