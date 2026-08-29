import { neon } from '@neondatabase/serverless';
import { 
  Member, Platform, ChannelGroup, PlatformChannel, Idea, 
  CommentItem, AuditLogItem, NotificationItem, ChecklistItem, AppSettings 
} from './types';

function getDatabaseUrl(): string {
  const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Missing POSTGRES_URL or DATABASE_URL environment variable.");
  }
  return url;
}

export function getDb() {
  return neon(getDatabaseUrl());
}

export async function getAllData(): Promise<{
  members: Member[];
  platforms: Platform[];
  channelGroups: ChannelGroup[];
  platformChannels: PlatformChannel[];
  ideas: Idea[];
  comments: CommentItem[];
  auditLogs: AuditLogItem[];
  notifications: NotificationItem[];
  checklists: ChecklistItem[];
  settings: AppSettings;
  pitchingBatches: PitchingBatch[];
}> {
  const sql = getDb();

  const [
    membersRows,
    platformsRows,
    channelGroupsRows,
    platformChannelsRows,
    ideasRows,
    commentsRows,
    auditLogsRows,
    notificationsRows,
    checklistsRows,
    settingsRows,
    pitchingBatchesRows
  ] = await Promise.all([
    sql.query(`SELECT * FROM members ORDER BY name ASC`),
    sql.query(`SELECT * FROM platforms ORDER BY name ASC`),
    sql.query(`SELECT * FROM channel_groups ORDER BY name ASC`),
    sql.query(`SELECT * FROM platform_channels`),
    sql.query(`SELECT * FROM ideas ORDER BY created_at DESC`),
    sql.query(`SELECT * FROM comments ORDER BY created_at ASC`),
    sql.query(`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 500`),
    sql.query(`SELECT * FROM notifications ORDER BY created_at DESC LIMIT 500`),
    sql.query(`SELECT * FROM checklists ORDER BY id ASC`),
    sql.query(`SELECT * FROM settings`),
    sql.query(`SELECT * FROM pitching_batches ORDER BY created_at DESC`)
  ]);

  const members: Member[] = membersRows.map((r: any) => ({
    id: (r.id || '').trim(),
    name: r.name || '',
    role: (r.role || 'P') as any,
    username: r.username || '',
    phone: r.phone || '',
    facebook: r.facebook || '',
    primaryExpertise: r.primary_expertise || '',
    secondaryExpertise: r.secondary_expertise || '',
    active: r.active !== false
  }));

  const platforms: Platform[] = platformsRows.map((r: any) => ({
    id: r.id,
    name: r.name,
    defaultDurationDays: parseInt(r.default_duration_days || '2', 10)
  }));

  const channelGroups: ChannelGroup[] = channelGroupsRows.map((r: any) => ({
    id: r.id,
    name: r.name,
    color: r.color || '#5B9EE8',
    archived: r.archived === true,
    description: r.description || '',
    referenceVideoLink: r.reference_video_link || '',
    videoFormat: r.video_format || ''
  }));

  const platformChannels: PlatformChannel[] = platformChannelsRows.map((r: any) => ({
    id: r.id,
    channelGroupId: r.channel_group_id,
    platformId: r.platform_id
  }));

  const ideas: Idea[] = ideasRows.map((r: any) => ({
    id: r.id,
    title: r.title || '',
    description: r.description || '',
    logline: r.logline || '',
    referenceLinks: r.reference_links || '',
    angle: r.angle || '',
    keyMessage: r.key_message || '',
    platformChannelId: r.platform_channel_id || '',
    submittedByEmail: r.submitted_by_email || '',
    status: (r.status || 'PITCH') as any,
    durationDays: parseInt(r.duration_days || '0', 10),
    assignedToEmail: r.assigned_to_email || '',
    startDate: r.start_date || '',
    endDate: r.end_date || '',
    scriptLink: r.script_link || '',
    videoLink: r.video_link || '',
    qaFeedback: r.qa_feedback || '',
    publishedLink: r.published_link || '',
    scheduledPostDate: r.scheduled_post_date || '',
    createdAt: r.created_at || new Date().toISOString(),
    assignedAt: r.assigned_at || '',
    videoSubmittedAt: r.video_submitted_at || '',
    creditsIdeaByEmail: r.credits_idea_by_email || r.submitted_by_email || '',
    creditsScriptByEmail: r.credits_script_by_email || '',
    creditsEditedScriptByEmail: r.credits_edited_script_by_email || '',
    creditsProducedByEmail: r.credits_produced_by_email || '',
    creditsQaByEmail: r.credits_qa_by_email || '',
    creditsApprovedByEmail: r.credits_approved_by_email || '',
    cancelReason: r.cancel_reason || '',
    cancelledByEmail: r.cancelled_by_email || '',
    cancelledAt: r.cancelled_at || '',
    lastPitchWeek: r.last_pitch_week || '',
    internalNote: r.internal_note || '',
    rating: r.rating !== null && r.rating !== undefined ? parseFloat(r.rating) : undefined,
    tags: r.tags || '',
    pitchingBatchId: r.pitching_batch_id || ''
  }));

  const comments: CommentItem[] = commentsRows.map((r: any) => ({
    id: r.id,
    ideaId: r.idea_id,
    memberId: r.member_id,
    content: r.content || '',
    createdAt: r.created_at || new Date().toISOString()
  }));

  const auditLogs: AuditLogItem[] = auditLogsRows.map((r: any) => ({
    id: r.id,
    ideaId: r.idea_id || '',
    memberId: r.member_id || '',
    action: r.action || '',
    metadata: r.metadata || '',
    timestamp: r.timestamp || new Date().toISOString()
  }));

  const notifications: NotificationItem[] = notificationsRows.map((r: any) => ({
    id: r.id,
    memberId: r.member_id,
    type: r.type || 'info',
    relatedIdeaId: r.related_idea_id || '',
    message: r.message || '',
    read: r.read === true,
    createdAt: r.created_at || new Date().toISOString()
  }));

  const checklists: ChecklistItem[] = checklistsRows.map((r: any) => ({
    id: r.id,
    name: r.name || '',
    assignedToEmail: r.assigned_to_email || '',
    dueDate: r.due_date || '',
    status: r.status || 'Chưa bắt đầu',
    createdByEmail: r.created_by_email || ''
  }));

  const settings: AppSettings = { discordWebhookUrl: '', externalCalendarUrl: '' };
  for (const r of (settingsRows as any[])) {
    if (r.key === 'discordWebhookUrl') settings.discordWebhookUrl = r.value || '';
    if (r.key === 'externalCalendarUrl') settings.externalCalendarUrl = r.value || '';
  }

  const pitchingBatches: PitchingBatch[] = pitchingBatchesRows.map((r: any) => ({
    id: r.id,
    title: r.title || '',
    description: r.description || '',
    deadline: r.deadline || '',
    channelGroupId: r.channel_group_id || '',
    createdByEmail: r.created_by_email || '',
    createdAt: r.created_at || new Date().toISOString(),
    status: (r.status || 'OPEN') as any
  }));

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
    settings,
    pitchingBatches
  };
}
