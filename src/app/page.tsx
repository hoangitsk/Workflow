import { getAllData } from "../lib/db";
import { getCurrentMember } from "../actions/auth-actions";
import ClientApp from "./components/ClientApp";

export const dynamic = "force-dynamic";

export default async function Page() {
  let currentMember = null;
  try {
    currentMember = await getCurrentMember();
  } catch (err) {
    console.error("Lỗi lấy thông tin tài khoản hiện tại:", err);
  }

  let initialData = {
    members: [],
    platforms: [],
    channelGroups: [],
    platformChannels: [],
    ideas: [],
    comments: [],
    auditLogs: [],
    notifications: [],
    checklists: [],
    settings: { discordWebhookUrl: '', discordIdeaWebhookUrl: '', externalCalendarUrl: '' },
    pitchingBatches: []
  };

  try {
    const data = await getAllData();
    if (data) {
      initialData = {
        members: Array.isArray(data.members) ? data.members : [],
        platforms: Array.isArray(data.platforms) ? data.platforms : [],
        channelGroups: Array.isArray(data.channelGroups) ? data.channelGroups : [],
        platformChannels: Array.isArray(data.platformChannels) ? data.platformChannels : [],
        ideas: Array.isArray(data.ideas) ? data.ideas : [],
        comments: Array.isArray(data.comments) ? data.comments : [],
        auditLogs: Array.isArray(data.auditLogs) ? data.auditLogs : [],
        notifications: Array.isArray(data.notifications) ? data.notifications : [],
        checklists: Array.isArray(data.checklists) ? data.checklists : [],
        settings: data.settings || { discordWebhookUrl: '', discordIdeaWebhookUrl: '', externalCalendarUrl: '' },
        pitchingBatches: Array.isArray(data.pitchingBatches) ? data.pitchingBatches : []
      };
    }
  } catch (err) {
    console.error("Lỗi nạp dữ liệu Postgres:", err);
  }

  return (
    <ClientApp 
      initialMembers={initialData.members}
      initialPlatforms={initialData.platforms}
      initialChannelGroups={initialData.channelGroups}
      initialPlatformChannels={initialData.platformChannels}
      initialIdeas={initialData.ideas}
      initialComments={initialData.comments}
      initialAuditLogs={initialData.auditLogs}
      initialNotifications={initialData.notifications}
      initialChecklists={initialData.checklists}
      initialSettings={initialData.settings}
      initialPitchingBatches={initialData.pitchingBatches}
      currentMemberId={currentMember?.id || null}
    />
  );
}

