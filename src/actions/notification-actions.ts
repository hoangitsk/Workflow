"use server";

import { getDb } from "../lib/db";
import { getCurrentMember } from "./auth-actions";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

function resolveWebhookWithThread(targetInput: string, fallbackBaseWebhook: string): string {
  const input = (targetInput || '').trim();
  if (!input) return fallbackBaseWebhook;

  // Case 1: Already a full webhook URL
  if (input.startsWith('http://') || input.startsWith('https://')) {
    if (input.includes('/api/webhooks/')) {
      return input;
    }

    // Case 2: Discord Channel / Thread URL: https://discord.com/channels/GUILD_ID/CHANNEL_ID/THREAD_ID
    const parts = input.split('?')[0].split('/').filter(Boolean);
    const lastPart = parts[parts.length - 1];
    if (/^\d{17,21}$/.test(lastPart)) {
      const separator = fallbackBaseWebhook.includes('?') ? '&' : '?';
      return `${fallbackBaseWebhook}${separator}thread_id=${lastPart}`;
    }
  }

  // Case 3: Pure numeric thread ID
  if (/^\d{17,21}$/.test(input)) {
    const separator = fallbackBaseWebhook.includes('?') ? '&' : '?';
    return `${fallbackBaseWebhook}${separator}thread_id=${input}`;
  }

  return fallbackBaseWebhook;
}

export async function getWebhookUrlForPlatformChannel(platformChannelId?: string): Promise<string | undefined> {
  if (!platformChannelId) return undefined;
  try {
    const sql = getDb();
    const rows = await sql.query(
      `SELECT cg.discord_webhook_url 
       FROM platform_channels pc 
       JOIN channel_groups cg ON pc.channel_group_id = cg.id 
       WHERE pc.id = $1 LIMIT 1`,
      [platformChannelId]
    );
    return (rows[0] as any)?.discord_webhook_url?.trim() || undefined;
  } catch (err) {
    return undefined;
  }
}

export async function getChannelGroupWebhookUrl(channelGroupId?: string): Promise<string | undefined> {
  if (!channelGroupId) return undefined;
  try {
    const sql = getDb();
    const rows = await sql.query(`SELECT discord_webhook_url FROM channel_groups WHERE id = $1 LIMIT 1`, [channelGroupId]);
    return (rows[0] as any)?.discord_webhook_url?.trim() || undefined;
  } catch (err) {
    return undefined;
  }
}

export async function sendDiscordWebhook(
  content: string, 
  embeds?: any[],
  customTargetWebhookOrThread?: string,
  category: 'general' | 'idea' = 'general'
) {
  try {
    const sql = getDb();
    let baseWebhookUrl = "";

    if (category === 'idea') {
      const ideaRows = await sql.query(`SELECT value FROM settings WHERE key = 'discordIdeaWebhookUrl' LIMIT 1`);
      if (ideaRows[0] && (ideaRows[0] as any).value) {
        baseWebhookUrl = (ideaRows[0] as any).value.trim();
      }
    }

    if (!baseWebhookUrl) {
      baseWebhookUrl = process.env.DISCORD_WEBHOOK_URL || "";
      if (!baseWebhookUrl) {
        const rows = await sql.query(`SELECT value FROM settings WHERE key = 'discordWebhookUrl' LIMIT 1`);
        if (rows[0] && (rows[0] as any).value) {
          baseWebhookUrl = (rows[0] as any).value.trim();
        }
      }
    }

    if (!baseWebhookUrl) return;

    const finalWebhookUrl = resolveWebhookWithThread(customTargetWebhookOrThread || '', baseWebhookUrl);

    await fetch(finalWebhookUrl, {
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

