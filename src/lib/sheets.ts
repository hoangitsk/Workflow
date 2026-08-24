import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import { Member, Platform, ChannelGroup, PlatformChannel, Idea, CommentItem, AuditLogItem, NotificationItem, ChecklistItem, AppSettings } from './types';

import { unstable_cache } from 'next/cache';

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || '1waF1GLS6iB9JJ3pftQOSl1d27tRNUNhM245LlK_tUB0';

export async function getSpreadsheet() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error("Missing Google Service Account credentials in .env.local");
  }

  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
  await doc.loadInfo(); 
  return doc;
}

const fetchAllData = async () => {
  const doc = await getSpreadsheet();

  let members: Member[] = [];
  let platforms: Platform[] = [];
  let channelGroups: ChannelGroup[] = [];
  let platformChannels: PlatformChannel[] = [];
  let ideas: Idea[] = [];
  let comments: CommentItem[] = [];
  let auditLogs: AuditLogItem[] = [];
  let notifications: NotificationItem[] = [];
  let checklists: ChecklistItem[] = [];
  let settings: AppSettings = { discordWebhookUrl: '', externalCalendarUrl: '' };

  // 1. Members
  const membersSheet = doc.sheetsByTitle["Members"];
  if (membersSheet) {
    const rows = await membersSheet.getRows();
    members = rows.map(r => ({
      id: (r.get('id') || '').trim(),
      name: r.get('name') || '',
      role: (r.get('role') || 'P') as any,
      username: r.get('username') || '',
      phone: r.get('phone') || '',
      facebook: r.get('facebook') || '',
      primaryExpertise: r.get('primaryExpertise') || '',
      secondaryExpertise: r.get('secondaryExpertise') || '',
      active: r.get('active') !== 'FALSE' && r.get('active') !== 'false'
    }));
  }

  // 2. Platforms
  const platformsSheet = doc.sheetsByTitle["Platforms"];
  if (platformsSheet) {
    const rows = await platformsSheet.getRows();
    platforms = rows.map(r => ({
      id: r.get('id'),
      name: r.get('name'),
      defaultDurationDays: parseInt(r.get('defaultDurationDays') || '2', 10)
    }));
  }

  // 3. ChannelGroups (with backward compatibility for old 'Channels' sheet if needed)
  const channelGroupsSheet = doc.sheetsByTitle["ChannelGroups"] || doc.sheetsByTitle["Channels"];
  if (channelGroupsSheet) {
    const rows = await channelGroupsSheet.getRows();
    channelGroups = rows.map(r => ({
      id: r.get('id'),
      name: r.get('name'),
      color: r.get('color') || '#5B9EE8',
      archived: r.get('archived') === 'TRUE' || r.get('archived') === 'true'
    }));
  }

  // 4. PlatformChannels
  const platformChannelsSheet = doc.sheetsByTitle["PlatformChannels"];
  if (platformChannelsSheet) {
    const rows = await platformChannelsSheet.getRows();
    platformChannels = rows.map(r => ({
      id: r.get('id'),
      channelGroupId: r.get('channelGroupId'),
      platformId: r.get('platformId')
    }));
  }

  // Fallback platformChannels if empty
  if (platformChannels.length === 0 && channelGroups.length > 0 && platforms.length > 0) {
    platformChannels = channelGroups.flatMap(cg => 
      platforms.map(p => ({
        id: `pc_${cg.id}_${p.id}`,
        channelGroupId: cg.id,
        platformId: p.id
      }))
    );
  }

  // 5. Ideas
  const ideasSheet = doc.sheetsByTitle["Ideas"];
  if (ideasSheet) {
    const rows = await ideasSheet.getRows();
    ideas = rows.map(r => {
      let platformChannelId = r.get('platformChannelId');
      // Backward compatibility if idea had channelId instead of platformChannelId
      if (!platformChannelId && r.get('channelId')) {
        const matchedPc = platformChannels.find(pc => pc.channelGroupId === r.get('channelId'));
        platformChannelId = matchedPc ? matchedPc.id : (platformChannels[0]?.id || 'pc_default');
      }

      return {
        id: r.get('id'),
        title: r.get('title') || '',
        description: r.get('description') || '',
        platformChannelId: platformChannelId || '',
        submittedByEmail: r.get('submittedByEmail') || '',
        status: (r.get('status') || 'PITCH') as any,
        durationDays: parseInt(r.get('durationDays') || '0', 10),
        assignedToEmail: r.get('assignedToEmail') || '',
        startDate: r.get('startDate') || '',
        endDate: r.get('endDate') || '',
        scriptLink: r.get('scriptLink') || '',
        videoLink: r.get('videoLink') || '',
        qaFeedback: r.get('qaFeedback') || '',
        publishedLink: r.get('publishedLink') || '',
        scheduledPostDate: r.get('scheduledPostDate') || '',
        createdAt: r.get('createdAt') || new Date().toISOString(),
        assignedAt: r.get('assignedAt') || '',
        videoSubmittedAt: r.get('videoSubmittedAt') || '',
        
        creditsIdeaByEmail: r.get('creditsIdeaByEmail') || r.get('submittedByEmail') || '',
        creditsScriptByEmail: r.get('creditsScriptByEmail') || '',
        creditsEditedScriptByEmail: r.get('creditsEditedScriptByEmail') || '',
        creditsProducedByEmail: r.get('creditsProducedByEmail') || '',
        creditsQaByEmail: r.get('creditsQaByEmail') || '',
        creditsApprovedByEmail: r.get('creditsApprovedByEmail') || '',
        cancelReason: r.get('cancelReason') || '',
        cancelledByEmail: r.get('cancelledByEmail') || '',
        cancelledAt: r.get('cancelledAt') || '',
        lastPitchWeek: r.get('lastPitchWeek') || '',
        
        internalNote: r.get('internalNote') || '',
        rating: r.get('rating') ? parseFloat(r.get('rating')) : undefined,
        tags: r.get('tags') || ''
      };
    }).reverse();
  }

  // 6. Comments
  const commentsSheet = doc.sheetsByTitle["Comments"];
  if (commentsSheet) {
    const rows = await commentsSheet.getRows();
    comments = rows.map(r => ({
      id: r.get('id'),
      ideaId: r.get('ideaId'),
      memberId: r.get('memberId'),
      content: r.get('content') || '',
      createdAt: r.get('createdAt') || new Date().toISOString()
    }));
  }

  // 7. AuditLogs
  const auditLogsSheet = doc.sheetsByTitle["AuditLogs"];
  if (auditLogsSheet) {
    const rows = await auditLogsSheet.getRows();
    auditLogs = rows.map(r => ({
      id: r.get('id'),
      ideaId: r.get('ideaId'),
      memberId: r.get('memberId'),
      action: r.get('action') || '',
      metadata: r.get('metadata') || '',
      timestamp: r.get('timestamp') || new Date().toISOString()
    })).reverse();
  }

  // 8. Notifications
  const notificationsSheet = doc.sheetsByTitle["Notifications"];
  if (notificationsSheet) {
    const rows = await notificationsSheet.getRows();
    notifications = rows.map(r => ({
      id: r.get('id'),
      memberId: r.get('memberId'),
      type: r.get('type') || 'info',
      relatedIdeaId: r.get('relatedIdeaId') || '',
      message: r.get('message') || '',
      read: r.get('read') === 'TRUE' || r.get('read') === 'true',
      createdAt: r.get('createdAt') || new Date().toISOString()
    })).reverse();
  }

  // 9. Checklists
  const checklistsSheet = doc.sheetsByTitle["Checklists"];
  if (checklistsSheet) {
    const rows = await checklistsSheet.getRows();
    checklists = rows.map(r => ({
      id: r.get('id'),
      name: r.get('name'),
      assignedToEmail: r.get('assignedToEmail') || '',
      dueDate: r.get('dueDate') || '',
      status: r.get('status') || 'Chưa bắt đầu',
      createdByEmail: r.get('createdByEmail') || ''
    }));
  }

  // 10. Settings
  const settingsSheet = doc.sheetsByTitle["Settings"];
  if (settingsSheet) {
    const rows = await settingsSheet.getRows();
    for (const r of rows) {
      const key = r.get('key');
      const val = r.get('value');
      if (key === 'discordWebhookUrl') settings.discordWebhookUrl = val || '';
      if (key === 'externalCalendarUrl') settings.externalCalendarUrl = val || '';
    }
  }

  return {
    members,
    platforms,
    channelGroups,
    platformChannels,
    ideas,
    comments,
    auditLogs,
    notifications,
    checklists,
    settings
  };
};

export const getAllData = unstable_cache(
  async () => {
    return await fetchAllData();
  },
  ['all-sheets-data'],
  { revalidate: 30, tags: ['sheets'] }
);

