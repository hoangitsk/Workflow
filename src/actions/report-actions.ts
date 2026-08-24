"use server";

import { getAllData } from "../lib/sheets";
import { getCurrentMember } from "./auth-actions";
import { sendDiscordWebhook } from "./notification-actions";
import { recordAuditLog } from "./audit-actions";

export async function sendWeeklyReportToDiscordAction() {
  const current = await getCurrentMember();
  if (!current) throw new Error("Chưa đăng nhập");

  const data = await getAllData();
  const { ideas, channelGroups, platforms, members } = data;

  const now = new Date();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(now.getDate() - 7);

  // Ideas completed in the last 7 days
  const completedIdeas = ideas.filter(i => {
    if (i.status !== "COMPLETE") return false;
    const date = new Date(i.endDate || i.createdAt);
    return date >= oneWeekAgo;
  });

  // Ideas overdue
  const overdueIdeas = ideas.filter(i => {
    if (i.status !== "PRODUCTION" || !i.endDate) return false;
    const end = new Date(i.endDate + "T23:59:59");
    return end < now;
  });

  // Ideas with QA feedback
  const qaIssues = ideas.filter(i => i.qaFeedback && i.qaFeedback.trim() !== "");

  // Leaderboard of completed ideas
  const memberCounts: Record<string, number> = {};
  completedIdeas.forEach(i => {
    if (i.assignedToEmail) {
      memberCounts[i.assignedToEmail] = (memberCounts[i.assignedToEmail] || 0) + 1;
    }
  });

  const topProducers = Object.entries(memberCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([email, count]) => {
      const m = members.find(mem => mem.id === email);
      return `• **${m?.name || email}**: ${count} sản phẩm`;
    })
    .join("\n");

  const message = `📊 **BÁO CÁO TUẦN TỰ ĐỘNG — YNDA WORKFLOW**
━━━━━━━━━━━━━━━━━━━━
🎯 **Tổng sản phẩm hoàn thành tuần qua:** ${completedIdeas.length}
⚠️ **Sản phẩm đang trễ hạn:** ${overdueIdeas.length}
🔍 **Số ca cần sửa lại qua QA:** ${qaIssues.length}

🏆 **Năng suất tuần:**
${topProducers || "• Chưa có dữ liệu hoàn thành tuần này"}

━━━━━━━━━━━━━━━━━━━━
*Báo cáo được gửi tự động bởi ${current.name} (Core)*`;

  await sendDiscordWebhook(message);
  await recordAuditLog('', current.id, "Gửi báo cáo tuần vào Discord");
  return { success: true };
}
