import { getAllData } from "../lib/db";
import { getCurrentMember } from "../actions/auth-actions";
import ClientApp from "./components/ClientApp";

export const dynamic = "force-dynamic";

export default async function Page() {
  const currentMember = await getCurrentMember();

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
    settings: { discordWebhookUrl: '', externalCalendarUrl: '' },
    pitchingBatches: []
  };

  try {
    initialData = await getAllData() as any;
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
      initialPitchingBatches={initialData.pitchingBatches || []}
      currentMemberId={currentMember?.id || null}
    />
  );
}

