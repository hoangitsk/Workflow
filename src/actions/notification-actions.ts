"use server";

import { getDb } from "../lib/db";
import { getCurrentMember } from "./auth-actions";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function sendDiscordWebhook(content: string, embeds?: any[]) {
  try {
    let webhookUrl = process.env.DISCORD_WEBHOOK_URL || "";

    if (!webhookUrl) {
      const sql = getDb();
      const rows = await sql.query(`SELECT value FROM settings WHERE key = 'discordWebhookUrl' LIMIT 1`);
      if (rows[0] && (rows[0] as any).value) {
        webhookUrl = (rows[0] as any).value.trim();
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
    const sql = getDb();
    await sql.query(
      `INSERT INTO notifications (id, member_id, type, related_idea_id, message, read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        crypto.randomUUID(),
        memberId.trim(),
        type || 'info',
        relatedIdeaId || '',
        message.trim(),
        false,
        new Date().toISOString()
      ]
    );
  } catch (err) {
    console.error("Lỗi tạo Notification:", err);
  }
}

export async function markNotificationAsReadAction(notificationId: string) {
  const current = await getCurrentMember();
  if (!current) throw new Error("Chưa đăng nhập");

  const sql = getDb();
  await sql.query(
    `UPDATE notifications SET read = TRUE WHERE id = $1 AND member_id = $2`,
    [notificationId, current.id]
  );
  revalidatePath("/");
}

export async function markAllNotificationsAsReadAction() {
  const current = await getCurrentMember();
  if (!current) throw new Error("Chưa đăng nhập");

  const sql = getDb();
  await sql.query(
    `UPDATE notifications SET read = TRUE WHERE member_id = $1`,
    [current.id]
  );
  revalidatePath("/");
}

