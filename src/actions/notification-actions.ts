"use server";

import { getSpreadsheet } from "../lib/sheets";
import { getCurrentMember } from "./auth-actions";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function sendDiscordWebhook(content: string, embeds?: any[]) {
  try {
    const doc = await getSpreadsheet();
    const settingsSheet = doc.sheetsByTitle["Settings"];
    let webhookUrl = process.env.DISCORD_WEBHOOK_URL || "";

    if (settingsSheet) {
      const rows = await settingsSheet.getRows();
      const row = rows.find(r => r.get('key') === 'discordWebhookUrl');
      if (row && row.get('value')) {
        webhookUrl = row.get('value').trim();
      }
    }

    if (!webhookUrl) return;

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        embeds: embeds || []
      })
    });
  } catch (err) {
    console.error("Lỗi gửi Discord Webhook:", err);
  }
}

export async function createNotification(
  memberId: string, 
  type: string, 
  relatedIdeaId: string, 
  message: string
) {
  try {
    const doc = await getSpreadsheet();
    const sheet = doc.sheetsByTitle["Notifications"];
    if (!sheet) return;

    await sheet.addRow({
      id: crypto.randomUUID(),
      memberId: memberId.trim(),
      type: type || 'info',
      relatedIdeaId: relatedIdeaId || '',
      message: message.trim(),
      read: 'FALSE',
      createdAt: new Date().toISOString()
    });
  } catch (err) {
    console.error("Lỗi tạo Notification:", err);
  }
}

export async function markNotificationAsReadAction(notificationId: string) {
  const current = await getCurrentMember();
  if (!current) throw new Error("Chưa đăng nhập");

  const doc = await getSpreadsheet();
  const sheet = doc.sheetsByTitle["Notifications"];
  if (!sheet) return;

  const rows = await sheet.getRows();
  const row = rows.find(r => r.get('id') === notificationId && r.get('memberId') === current.id);
  if (row) {
    row.set('read', 'TRUE');
    await row.save();
    revalidatePath("/");
  }
}

export async function markAllNotificationsAsReadAction() {
  const current = await getCurrentMember();
  if (!current) throw new Error("Chưa đăng nhập");

  const doc = await getSpreadsheet();
  const sheet = doc.sheetsByTitle["Notifications"];
  if (!sheet) return;

  const rows = await sheet.getRows();
  for (const row of rows) {
    if (row.get('memberId') === current.id && (row.get('read') === 'FALSE' || row.get('read') === 'false')) {
      row.set('read', 'TRUE');
      await row.save();
    }
  }
  revalidatePath("/");
}
