"use server";

import { getDb } from "../lib/db";
import { getCurrentMember } from "./auth-actions";
import { recordAuditLog } from "./audit-actions";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// -------------------------------------------------------------
// PLATFORMS
// -------------------------------------------------------------
export async function createPlatformAction(name: string, defaultDurationDays: number) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền tạo nền tảng");

  if (!name || !name.trim()) throw new Error("Tên nền tảng không được để trống");
  if (!defaultDurationDays || defaultDurationDays < 1) throw new Error("Số ngày mặc định phải từ 1 ngày trở lên");

  const sql = getDb();
  const id = `plat_${Date.now().toString(36)}`;
  await sql.query(
    `INSERT INTO platforms (id, name, default_duration_days)
     VALUES ($1, $2, $3)`,
    [id, name.trim(), defaultDurationDays]
  );

  await recordAuditLog('', member.id, "Tạo Nền tảng mới", { name, defaultDurationDays });
  revalidatePath("/");
}

export async function deletePlatformAction(platformId: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền xoá nền tảng");

  const sql = getDb();

  // Check if any platform_channels exist for this platform
  const pcRows = await sql.query(`SELECT id FROM platform_channels WHERE platform_id = $1`, [platformId]);
  if (pcRows.length > 0) {
    const pcIds = pcRows.map((r: any) => r.id);
    const ideaCountRes = await sql.query(`SELECT COUNT(*) as count FROM ideas WHERE platform_channel_id = ANY($1)`, [pcIds]);
    const ideaCount = parseInt(ideaCountRes[0]?.count || '0', 10);
    if (ideaCount > 0) {
      throw new Error(`Không thể xoá nền tảng này vì có ${ideaCount} ý tưởng đang sử dụng.`);
    }
    await sql.query(`DELETE FROM platform_channels WHERE platform_id = $1`, [platformId]);
  }

  await sql.query(`DELETE FROM platforms WHERE id = $1`, [platformId]);
  await recordAuditLog('', member.id, "Xoá Nền tảng", { platformId });
  revalidatePath("/");
}

// -------------------------------------------------------------
// CHANNEL GROUPS & PLATFORM CHANNELS
// -------------------------------------------------------------
export async function createChannelGroupAction(
  name: string, 
  color: string, 
  selectedPlatformIds: string[], 
  description?: string, 
  referenceVideoLink?: string, 
  videoFormat?: string,
  discordWebhookUrl?: string
) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền tạo kênh");

  if (!name || !name.trim()) throw new Error("Tên kênh không được để trống");

  const sql = getDb();
  const channelGroupId = `cg_${Date.now().toString(36)}`;

  await sql.query(
    `INSERT INTO channel_groups (id, name, color, archived, description, reference_video_link, video_format, discord_webhook_url)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [
      channelGroupId, 
      name.trim(), 
      color || "#5B9EE8", 
      false, 
      description?.trim() || null, 
      referenceVideoLink?.trim() || null, 
      videoFormat?.trim() || null,
      discordWebhookUrl?.trim() || null
    ]
  );

  // Automatically create PlatformChannels for selected platforms
  const platformsToAssign = (selectedPlatformIds && selectedPlatformIds.length > 0) 
    ? selectedPlatformIds 
    : ["plat_yt", "plat_tt"];

  for (const platId of platformsToAssign) {
    await sql.query(
      `INSERT INTO platform_channels (id, channel_group_id, platform_id)
       VALUES ($1, $2, $3)
       ON CONFLICT (id) DO NOTHING`,
      [`pc_${channelGroupId}_${platId}`, channelGroupId, platId]
    );
  }

  await recordAuditLog('', member.id, "Tạo Kênh mới", { name, color, platforms: platformsToAssign });
  revalidatePath("/");
}

export async function updateChannelGroupAction(
  channelGroupId: string, 
  name: string, 
  color: string, 
  description?: string, 
  referenceVideoLink?: string, 
  videoFormat?: string,
  discordWebhookUrl?: string
) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền chỉnh sửa kênh");

  if (!name || !name.trim()) throw new Error("Tên kênh không được để trống");

  const sql = getDb();
  await sql.query(
    `UPDATE channel_groups 
     SET name = $1, color = $2, description = $3, reference_video_link = $4, video_format = $5, discord_webhook_url = $6 
     WHERE id = $7`,
    [
      name.trim(), 
      color || "#5B9EE8", 
      description?.trim() || null, 
      referenceVideoLink?.trim() || null, 
      videoFormat?.trim() || null, 
      discordWebhookUrl?.trim() || null,
      channelGroupId
    ]
  );

  await recordAuditLog('', member.id, "Cập nhật thông tin kênh", { channelGroupId, name });
  revalidatePath("/");
}

export async function archiveChannelGroupAction(channelGroupId: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền xoá kênh");

  const sql = getDb();
  
  // Check if there are ideas linked to this channel group
  const pcRows = await sql.query(
    `SELECT id FROM platform_channels WHERE channel_group_id = $1`,
    [channelGroupId]
  );
  const pcIds = pcRows.map((r: any) => r.id);

  let ideaCount = 0;
  if (pcIds.length > 0) {
    const countRes = await sql.query(
      `SELECT COUNT(*) as count FROM ideas WHERE platform_channel_id = ANY($1)`,
      [pcIds]
    );
    ideaCount = parseInt(countRes[0]?.count || '0', 10);
  }

  if (ideaCount === 0) {
    await sql.query(`DELETE FROM platform_channels WHERE channel_group_id = $1`, [channelGroupId]);
    await sql.query(`DELETE FROM channel_groups WHERE id = $1`, [channelGroupId]);
  } else {
    await sql.query(`UPDATE channel_groups SET archived = TRUE WHERE id = $1`, [channelGroupId]);
  }

  await recordAuditLog('', member.id, "Lưu trữ / Xoá kênh", { channelGroupId, ideaCount });
  revalidatePath("/");
}

export async function restoreChannelGroupAction(channelGroupId: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền khôi phục kênh");

  const sql = getDb();
  await sql.query(`UPDATE channel_groups SET archived = FALSE WHERE id = $1`, [channelGroupId]);

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
  const cleanEmail = email.toLowerCase().trim();
  const sql = getDb();

  const totalMembersRes = await sql.query(`SELECT COUNT(*) as count FROM members`);
  const totalMembers = parseInt(totalMembersRes[0]?.count || '0', 10);

  const member = await getCurrentMember();
  if (totalMembers > 0) {
    if (!member) throw new Error("Chưa đăng nhập");
    if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền tạo thành viên");
  }

  const existingRes = await sql.query(`SELECT id FROM members WHERE id = $1`, [cleanEmail]);
  if (existingRes.length > 0) {
    throw new Error(`Email ${cleanEmail} đã tồn tại trong danh sách thành viên`);
  }

  const rawPassword = (password && password.trim() !== "") 
    ? password.trim() 
    : ((phone && phone.trim() !== "") ? phone.trim() : "123456");
  const hashedPassword = await bcrypt.hash(rawPassword, 10);

  await sql.query(
    `INSERT INTO members (id, name, role, password, phone, facebook, primary_expertise, secondary_expertise, active)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      cleanEmail,
      name.trim(),
      role || "P",
      hashedPassword,
      phone || "",
      facebook || "",
      primaryExpertise || "",
      secondaryExpertise || "",
      true
    ]
  );

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

  const sql = getDb();
  const existingRows = await sql.query(`SELECT id FROM members`);
  const existingEmails = new Set(existingRows.map((r: any) => (r.id || '').toLowerCase().trim()));

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
    const mappedRole = role === "Editor" ? "E" : (role === "Producer" ? "P" : role);

    const rawPass = (row.password && row.password.trim() !== '') 
      ? row.password.trim() 
      : ((row.phone && row.phone.trim() !== '') ? row.phone.trim() : "123456");
    const hashedPass = await bcrypt.hash(rawPass, 10);

    await sql.query(
      `INSERT INTO members (id, name, role, password, phone, facebook, primary_expertise, secondary_expertise, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        cleanEmail,
        cleanName,
        mappedRole,
        hashedPass,
        row.phone || "",
        row.facebook || "",
        row.primaryExpertise || "",
        row.secondaryExpertise || "",
        true
      ]
    );
    
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

  const sql = getDb();
  const existingRows = await sql.query(`SELECT * FROM members WHERE id = $1 LIMIT 1`, [memberId]);
  const row = existingRows[0] as any;
  if (!row) throw new Error("Không tìm thấy thành viên");

  const updatedName = name || row.name;
  const updatedPhone = phone !== undefined ? phone : row.phone;
  const updatedFb = facebook !== undefined ? facebook : row.facebook;
  const updatedPrimary = primaryExpertise !== undefined ? primaryExpertise : row.primary_expertise;
  const updatedSecondary = secondaryExpertise !== undefined ? secondaryExpertise : row.secondary_expertise;
  const updatedRole = (role && current.role === "Core") ? role : row.role;
  
  let updatedPassword = row.password;
  if (password && password.trim() !== "") {
    updatedPassword = await bcrypt.hash(password.trim(), 10);
  }

  await sql.query(
    `UPDATE members SET 
       name = $1, phone = $2, facebook = $3, primary_expertise = $4,
       secondary_expertise = $5, role = $6, password = $7
     WHERE id = $8`,
    [
      updatedName, updatedPhone, updatedFb, updatedPrimary,
      updatedSecondary, updatedRole, updatedPassword, memberId
    ]
  );

  await recordAuditLog('', current.id, "Cập nhật hồ sơ thành viên", { targetMember: memberId, name });
  revalidatePath("/");
}

export async function toggleMemberActiveAction(email: string, active: boolean) {
  const current = await getCurrentMember();
  if (!current) throw new Error("Chưa đăng nhập");
  if (current.role !== "Core") throw new Error("Chỉ Core mới có quyền thay đổi trạng thái hoạt động của thành viên");

  const sql = getDb();
  await sql.query(`UPDATE members SET active = $1 WHERE id = $2`, [active, email]);

  await recordAuditLog('', current.id, active ? "Kích hoạt lại thành viên" : "Vô hiệu hoá thành viên", { targetMember: email });
  revalidatePath("/");
}

export async function removeMemberAction(memberEmailToRemove: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");
  if (member.role !== "Core") throw new Error("Chỉ Core mới có quyền xoá thành viên");

  const sql = getDb();
  
  const activeAssignedRes = await sql.query(
    `SELECT COUNT(*) as count FROM ideas 
     WHERE assigned_to_email = $1 AND status NOT IN ('COMPLETE', 'CANCELLED')`,
    [memberEmailToRemove]
  );
  const activeAssignedIdeas = parseInt(activeAssignedRes[0]?.count || '0', 10);

  if (activeAssignedIdeas > 0) {
    throw new Error(`Không thể xoá — thành viên đang phụ trách ${activeAssignedIdeas} idea chưa hoàn thành. Hãy gán lại người khác trước hoặc chuyển sang 'Ngừng hoạt động'.`);
  }

  await sql.query(`DELETE FROM members WHERE id = $1`, [memberEmailToRemove]);

  await recordAuditLog('', member.id, "Xoá thành viên", { removedMember: memberEmailToRemove });
  revalidatePath("/");
}

// -------------------------------------------------------------
// SETTINGS
// -------------------------------------------------------------
export async function updateSettingsAction(discordWebhookUrl: string, externalCalendarUrl: string, discordIdeaWebhookUrl?: string) {
  const current = await getCurrentMember();
  if (!current) throw new Error("Chưa đăng nhập");
  if (current.role !== "Core") throw new Error("Chỉ Core mới có quyền chỉnh sửa cấu hình hệ thống");

  const sql = getDb();

  if (discordWebhookUrl !== undefined) {
    await sql.query(
      `INSERT INTO settings (key, value) VALUES ('discordWebhookUrl', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [discordWebhookUrl.trim()]
    );
  }

  if (discordIdeaWebhookUrl !== undefined) {
    await sql.query(
      `INSERT INTO settings (key, value) VALUES ('discordIdeaWebhookUrl', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [discordIdeaWebhookUrl.trim()]
    );
  }

  if (externalCalendarUrl !== undefined) {
    await sql.query(
      `INSERT INTO settings (key, value) VALUES ('externalCalendarUrl', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [externalCalendarUrl.trim()]
    );
  }

  await recordAuditLog('', current.id, "Cập nhật cấu hình hệ thống (Settings)");
  revalidatePath("/");
}


