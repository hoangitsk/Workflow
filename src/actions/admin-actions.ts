"use server";

import { getSpreadsheet } from "../lib/sheets";
import { getCurrentMember } from "./auth-actions";
import { recordAuditLog } from "./audit-actions";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

// -------------------------------------------------------------
// PLATFORMS
// -------------------------------------------------------------
export async function createPlatformAction(name: string, defaultDurationDays: number) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền tạo nền tảng");

  if (!name || !name.trim()) throw new Error("Tên nền tảng không được để trống");
  if (!defaultDurationDays || defaultDurationDays < 1) throw new Error("Số ngày mặc định phải từ 1 ngày trở lên");

  const doc = await getSpreadsheet();
  let sheet = doc.sheetsByTitle["Platforms"];
  if (!sheet) {
    sheet = await doc.addSheet({ title: "Platforms", headerValues: ["id", "name", "defaultDurationDays"] });
  }

  const id = `plat_${Date.now().toString(36)}`;
  await sheet.addRow({
    id,
    name: name.trim(),
    defaultDurationDays: defaultDurationDays.toString()
  });

  await recordAuditLog('', member.id, "Tạo Nền tảng mới", { name, defaultDurationDays });
  revalidatePath("/");
}

// -------------------------------------------------------------
// CHANNEL GROUPS & PLATFORM CHANNELS
// -------------------------------------------------------------
export async function createChannelGroupAction(name: string, color: string, selectedPlatformIds: string[]) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền tạo kênh");

  if (!name || !name.trim()) throw new Error("Tên kênh không được để trống");

  const doc = await getSpreadsheet();
  const cgSheet = doc.sheetsByTitle["ChannelGroups"] || doc.sheetsByTitle["Channels"];
  let pcSheet = doc.sheetsByTitle["PlatformChannels"];
  if (!cgSheet) throw new Error("Thiếu tab ChannelGroups");
  if (!pcSheet) {
    pcSheet = await doc.addSheet({ title: "PlatformChannels", headerValues: ["id", "channelGroupId", "platformId"] });
  }

  const channelGroupId = `cg_${Date.now().toString(36)}`;
  await cgSheet.addRow({
    id: channelGroupId,
    name: name.trim(),
    color: color || "#5B9EE8",
    archived: "FALSE"
  });

  // Automatically create PlatformChannels for selected platforms
  const platformsToAssign = (selectedPlatformIds && selectedPlatformIds.length > 0) 
    ? selectedPlatformIds 
    : ["plat_yt", "plat_tt"];

  for (const platId of platformsToAssign) {
    await pcSheet.addRow({
      id: `pc_${channelGroupId}_${platId}`,
      channelGroupId,
      platformId: platId
    });
  }

  await recordAuditLog('', member.id, "Tạo Kênh mới", { name, color, platforms: platformsToAssign });
  revalidatePath("/");
}

export async function archiveChannelGroupAction(channelGroupId: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền xoá kênh");

  const doc = await getSpreadsheet();
  const cgSheet = doc.sheetsByTitle["ChannelGroups"] || doc.sheetsByTitle["Channels"];
  const pcSheet = doc.sheetsByTitle["PlatformChannels"];
  const ideasSheet = doc.sheetsByTitle["Ideas"];
  if (!cgSheet || !ideasSheet) throw new Error("Thiếu bảng dữ liệu ChannelGroups hoặc Ideas");

  // Get all platformChannelIds belonging to this channelGroup
  let associatedPcIds: string[] = [];
  if (pcSheet) {
    const pcRows = await pcSheet.getRows();
    associatedPcIds = pcRows.filter(r => r.get('channelGroupId') === channelGroupId).map(r => r.get('id'));
  }

  const ideaRows = await ideasSheet.getRows();
  const ideaCount = ideaRows.filter(r => 
    r.get('channelId') === channelGroupId || associatedPcIds.includes(r.get('platformChannelId'))
  ).length;

  const cgRows = await cgSheet.getRows();
  const row = cgRows.find(r => r.get('id') === channelGroupId);
  if (!row) throw new Error("Không tìm thấy kênh");

  if (ideaCount === 0) {
    await row.delete();
    // Also delete platformChannels
    if (pcSheet) {
      const pcRows = await pcSheet.getRows();
      for (const pcRow of pcRows) {
        if (pcRow.get('channelGroupId') === channelGroupId) await pcRow.delete();
      }
    }
  } else {
    row.set('archived', "TRUE");
    await row.save();
  }

  await recordAuditLog('', member.id, "Lưu trữ / Xoá kênh", { channelGroupId, ideaCount });
  revalidatePath("/");
}

export async function restoreChannelGroupAction(channelGroupId: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền khôi phục kênh");

  const doc = await getSpreadsheet();
  const sheet = doc.sheetsByTitle["ChannelGroups"] || doc.sheetsByTitle["Channels"];
  if (!sheet) throw new Error("Thiếu tab ChannelGroups");

  const rows = await sheet.getRows();
  const row = rows.find(r => r.get('id') === channelGroupId);
  if (!row) throw new Error("Không tìm thấy kênh");

  row.set('archived', "FALSE");
  await row.save();

  await recordAuditLog('', member.id, "Khôi phục kênh", { channelGroupId });
  revalidatePath("/");
}

// -------------------------------------------------------------
// MEMBERS
// -------------------------------------------------------------
export async function createMemberAction(
  name: string, 
  role: string, 
  email: string, 
  password?: string,
  phone?: string, 
  facebook?: string, 
  primaryExpertise?: string, 
  secondaryExpertise?: string
) {
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

  const cleanEmail = email.toLowerCase().trim();
  const existing = rows.find(r => (r.get('id') || '').toLowerCase().trim() === cleanEmail);
  if (existing) {
    throw new Error(`Email ${cleanEmail} đã tồn tại trong danh sách thành viên`);
  }

  await sheet.addRow({
    id: cleanEmail,
    name: name.trim(),
    role: role || "P",
    password: password ? password.trim() : (phone ? phone.trim() : "123"),
    phone: phone || "",
    facebook: facebook || "",
    primaryExpertise: primaryExpertise || "",
    secondaryExpertise: secondaryExpertise || "",
    active: "TRUE"
  });

  await recordAuditLog('', member?.id || cleanEmail, "Thêm thành viên mới", { name, email: cleanEmail, role });
  revalidatePath("/");
}

// Bulk import members from CSV data (parsed client-side)
export async function bulkImportMembersAction(
  rows: { name: string; email: string; role: string; password?: string; phone?: string; facebook?: string; primaryExpertise?: string; secondaryExpertise?: string }[]
) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền import thành viên");

  if (!rows || rows.length === 0) throw new Error("Không có dữ liệu để import");
  if (rows.length > 50) throw new Error("Tối đa 50 thành viên mỗi lần import");

  const doc = await getSpreadsheet();
  const sheet = doc.sheetsByTitle["Members"];
  if (!sheet) throw new Error("Thiếu tab Members");

  const existingRows = await sheet.getRows();
  const existingEmails = new Set(existingRows.map(r => (r.get('id') || '').toLowerCase().trim()));

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const row of rows) {
    const cleanEmail = (row.email || '').toLowerCase().trim();
    const cleanName = (row.name || '').trim();
    
    if (!cleanEmail || !cleanName) {
      skipped++;
      continue;
    }

    if (existingEmails.has(cleanEmail)) {
      errors.push(`${cleanEmail} đã tồn tại`);
      skipped++;
      continue;
    }

    const validRoles = ["Core", "E", "Editor", "P", "Producer"];
    const role = validRoles.includes(row.role) ? row.role : "P";

    await sheet.addRow({
      id: cleanEmail,
      name: cleanName,
      role: role === "Editor" ? "E" : (role === "Producer" ? "P" : role),
      password: (row.password || '').trim() || "123",
      phone: row.phone || "",
      facebook: row.facebook || "",
      primaryExpertise: row.primaryExpertise || "",
      secondaryExpertise: row.secondaryExpertise || "",
      active: "TRUE"
    });
    
    existingEmails.add(cleanEmail);
    imported++;
  }

  await recordAuditLog('', member.id, `Import hàng loạt ${imported} thành viên`, { total: rows.length, imported, skipped, errors });
  revalidatePath("/");
  
  return { imported, skipped, errors };
}

export async function updateMemberProfileAction(
  memberId: string,
  name: string,
  phone?: string,
  facebook?: string,
  primaryExpertise?: string,
  secondaryExpertise?: string,
  role?: string,
  password?: string
) {
  const current = await getCurrentMember();
  if (!current) throw new Error("Chưa đăng nhập");
  if (current.role !== "Core" && current.id !== memberId) {
    throw new Error("Bạn không có quyền sửa thông tin của thành viên khác");
  }

  const doc = await getSpreadsheet();
  const sheet = doc.sheetsByTitle["Members"];
  if (!sheet) throw new Error("Thiếu tab Members");

  const rows = await sheet.getRows();
  const row = rows.find(r => r.get('id') === memberId);
  if (!row) throw new Error("Không tìm thấy thành viên");

  if (name) row.set('name', name);
  if (phone !== undefined) row.set('phone', phone);
  if (facebook !== undefined) row.set('facebook', facebook);
  if (primaryExpertise !== undefined) row.set('primaryExpertise', primaryExpertise);
  if (secondaryExpertise !== undefined) row.set('secondaryExpertise', secondaryExpertise);
  if (role && current.role === "Core") row.set('role', role);
  if (password && password.trim() !== "") row.set('password', password.trim());

  await row.save();
  await recordAuditLog('', current.id, "Cập nhật hồ sơ thành viên", { targetMember: memberId, name });
  revalidatePath("/");
}

export async function toggleMemberActiveAction(email: string, active: boolean) {
  const current = await getCurrentMember();
  if (!current) throw new Error("Chưa đăng nhập");
  if (current.role !== "Core") throw new Error("Chỉ Core mới có quyền thay đổi trạng thái hoạt động của thành viên");

  const doc = await getSpreadsheet();
  const sheet = doc.sheetsByTitle["Members"];
  if (!sheet) throw new Error("Thiếu tab Members");

  const rows = await sheet.getRows();
  const row = rows.find(r => r.get('id') === email);
  if (!row) throw new Error("Không tìm thấy thành viên");

  row.set('active', active ? "TRUE" : "FALSE");
  await row.save();

  await recordAuditLog('', current.id, active ? "Kích hoạt lại thành viên" : "Vô hiệu hoá thành viên", { targetMember: email });
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
      r.get('status') !== "COMPLETE" &&
      r.get('status') !== "CANCELLED"
    ).length;

    if (activeAssignedIdeas > 0) {
      throw new Error(`Không thể xoá — thành viên đang phụ trách ${activeAssignedIdeas} idea chưa hoàn thành. Hãy gán lại người khác trước hoặc chuyển sang 'Ngừng hoạt động'.`);
    }
  }

  const memberRows = await membersSheet.getRows();
  const row = memberRows.find(r => r.get('id') === memberEmailToRemove);
  if (row) {
    await row.delete();
  }

  await recordAuditLog('', member.id, "Xoá thành viên", { removedMember: memberEmailToRemove });
  revalidatePath("/");
}

// -------------------------------------------------------------
// SETTINGS
// -------------------------------------------------------------
export async function updateSettingsAction(discordWebhookUrl: string, externalCalendarUrl: string) {
  const current = await getCurrentMember();
  if (!current) throw new Error("Chưa đăng nhập");
  if (current.role !== "Core") throw new Error("Chỉ Core mới có quyền chỉnh sửa cấu hình hệ thống");

  const doc = await getSpreadsheet();
  let sheet = doc.sheetsByTitle["Settings"];
  if (!sheet) {
    sheet = await doc.addSheet({ title: "Settings", headerValues: ["key", "value"] });
  }

  const rows = await sheet.getRows();
  const setKey = async (key: string, val: string) => {
    let row = rows.find(r => r.get('key') === key);
    if (row) {
      row.set('value', val);
      await row.save();
    } else {
      await sheet.addRow({ key, value: val });
    }
  };

  if (discordWebhookUrl !== undefined) await setKey('discordWebhookUrl', discordWebhookUrl.trim());
  if (externalCalendarUrl !== undefined) await setKey('externalCalendarUrl', externalCalendarUrl.trim());

  await recordAuditLog('', current.id, "Cập nhật cấu hình hệ thống (Settings)");
  revalidatePath("/");
}

