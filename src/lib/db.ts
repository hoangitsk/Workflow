import { neon } from '@neondatabase/serverless';
import { 
  Member, Platform, ChannelGroup, PlatformChannel, Idea, 
  CommentItem, AuditLogItem, NotificationItem, ChecklistItem, AppSettings, PitchingBatch 
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

function toIsoString(val: any, fallback = ''): string {
  if (!val) return fallback;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? fallback : val.toISOString();
  }
  const str = String(val).trim();
  if (!str) return fallback;
  const d = new Date(str);
  return isNaN(d.getTime()) ? str : d.toISOString();
}

function toDateString(val: any, fallback = ''): string {
  if (!val) return fallback;
  if (val instanceof Date) {
    return isNaN(val.getTime()) ? fallback : val.toISOString().slice(0, 10);
  }
  const str = String(val).trim();
  if (!str) return fallback;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const d = new Date(str);
  return isNaN(d.getTime()) ? str : d.toISOString().slice(0, 10);
}

let schemaEnsured = false;
let schemaEnsuringPromise: Promise<void> | null = null;

export async function ensureSchema(sql: any): Promise<void> {
  if (schemaEnsured) return;
  if (schemaEnsuringPromise) return schemaEnsuringPromise;

  schemaEnsuringPromise = (async () => {
    try {
      const migrations = [
        'ALTER TABLE ideas ADD COLUMN IF NOT EXISTS logline TEXT;',
        'ALTER TABLE ideas ADD COLUMN IF NOT EXISTS reference_links TEXT;',
        'ALTER TABLE ideas ADD COLUMN IF NOT EXISTS angle TEXT;',
        'ALTER TABLE ideas ADD COLUMN IF NOT EXISTS key_message TEXT;',
        'ALTER TABLE ideas ADD COLUMN IF NOT EXISTS pitching_batch_id TEXT;',
        'ALTER TABLE ideas ADD COLUMN IF NOT EXISTS content_pillar TEXT;',
        'ALTER TABLE pitching_batches ADD COLUMN IF NOT EXISTS category TEXT;',
        'ALTER TABLE pitching_batches ADD COLUMN IF NOT EXISTS example_angles TEXT;',
        'ALTER TABLE channel_groups ADD COLUMN IF NOT EXISTS description TEXT;',
        'ALTER TABLE channel_groups ADD COLUMN IF NOT EXISTS reference_video_link TEXT;',
        'ALTER TABLE channel_groups ADD COLUMN IF NOT EXISTS video_format TEXT;',
        'ALTER TABLE channel_groups ADD COLUMN IF NOT EXISTS discord_webhook_url TEXT;'
      ];
      for (const m of migrations) {
        try {
          await sql.query(m);
        } catch {
          // ignore
        }
      }
      schemaEnsured = true;
    } catch (e) {
      console.error("Auto schema migration error:", e);
    } finally {
      schemaEnsuringPromise = null;
    }
  })();

  return schemaEnsuringPromise;
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
  let sql: any;
  try {
    sql = getDb();
  } catch (err) {
    console.error("Database connection configuration error:", err);
    return {
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
  }

  // Ensure missing columns exist in the background
  ensureSchema(sql).catch(() => {});

  const safeQuery = async (queryText: string, params: any[] = []): Promise<any[]> => {
    try {
      const res = await sql.query(queryText, params);
      return Array.isArray(res) ? res : [];
    } catch (e) {
      console.error(`Postgres query failed [${queryText.slice(0, 40)}...]:`, e);
      return [];
    }
  };

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
    safeQuery(`SELECT * FROM members ORDER BY name ASC`),
    safeQuery(`SELECT * FROM platforms ORDER BY name ASC`),
    safeQuery(`SELECT * FROM channel_groups ORDER BY name ASC`),
    safeQuery(`SELECT * FROM platform_channels`),
    safeQuery(`SELECT * FROM ideas ORDER BY created_at DESC`),
    safeQuery(`SELECT * FROM comments ORDER BY created_at ASC`),
    safeQuery(`SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 500`),
    safeQuery(`SELECT * FROM notifications ORDER BY created_at DESC LIMIT 500`),
    safeQuery(`SELECT * FROM checklists ORDER BY id ASC`),
    safeQuery(`SELECT * FROM settings`),
    safeQuery(`SELECT * FROM pitching_batches ORDER BY created_at DESC`)
  ]);

  const members: Member[] = (membersRows || []).map((r: any) => ({
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

  const platforms: Platform[] = (platformsRows || []).map((r: any) => ({
    id: r.id,
    name: r.name || '',
    defaultDurationDays: parseInt(r.default_duration_days || '2', 10) || 2
  }));

  const channelGroups: ChannelGroup[] = (channelGroupsRows || []).map((r: any) => ({
    id: r.id,
    name: r.name || '',
    color: r.color || '#5B9EE8',
    archived: r.archived === true,
    description: r.description || '',
    referenceVideoLink: r.reference_video_link || '',
    videoFormat: r.video_format || '',
    discordWebhookUrl: r.discord_webhook_url || ''
  }));

  const platformChannels: PlatformChannel[] = (platformChannelsRows || []).map((r: any) => ({
    id: r.id,
    channelGroupId: r.channel_group_id || '',
    platformId: r.platform_id || ''
  }));

  const ideas: Idea[] = (ideasRows || []).map((r: any) => ({
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
    durationDays: parseInt(r.duration_days || '0', 10) || 0,
    assignedToEmail: r.assigned_to_email || '',
    startDate: toDateString(r.start_date),
    endDate: toDateString(r.end_date),
    scriptLink: r.script_link || '',
    videoLink: r.video_link || '',
    qaFeedback: r.qa_feedback || '',
    publishedLink: r.published_link || '',
    scheduledPostDate: toDateString(r.scheduled_post_date),
    createdAt: toIsoString(r.created_at, new Date().toISOString()),
    assignedAt: toIsoString(r.assigned_at),
    videoSubmittedAt: toIsoString(r.video_submitted_at),
    creditsIdeaByEmail: r.credits_idea_by_email || r.submitted_by_email || '',
    creditsScriptByEmail: r.credits_script_by_email || '',
    creditsEditedScriptByEmail: r.credits_edited_script_by_email || '',
    creditsProducedByEmail: r.credits_produced_by_email || '',
    creditsQaByEmail: r.credits_qa_by_email || '',
    creditsApprovedByEmail: r.credits_approved_by_email || '',
    cancelReason: r.cancel_reason || '',
    cancelledByEmail: r.cancelled_by_email || '',
    cancelledAt: toIsoString(r.cancelled_at),
    lastPitchWeek: r.last_pitch_week || '',
    internalNote: r.internal_note || '',
    rating: r.rating !== null && r.rating !== undefined ? parseFloat(r.rating) : undefined,
    tags: r.tags || '',
    pitchingBatchId: r.pitching_batch_id || '',
    contentPillar: r.content_pillar || ''
  }));

  const comments: CommentItem[] = (commentsRows || []).map((r: any) => ({
    id: r.id,
    ideaId: r.idea_id || '',
    memberId: r.member_id || '',
    content: r.content || '',
    createdAt: toIsoString(r.created_at, new Date().toISOString())
  }));

  const auditLogs: AuditLogItem[] = (auditLogsRows || []).map((r: any) => ({
    id: r.id,
    ideaId: r.idea_id || '',
    memberId: r.member_id || '',
    action: r.action || '',
    metadata: r.metadata || '',
    timestamp: toIsoString(r.timestamp, new Date().toISOString())
  }));

  const notifications: NotificationItem[] = (notificationsRows || []).map((r: any) => ({
    id: r.id,
    memberId: r.member_id || '',
    type: r.type || 'info',
    relatedIdeaId: r.related_idea_id || '',
    message: r.message || '',
    read: r.read === true,
    createdAt: toIsoString(r.created_at, new Date().toISOString())
  }));

  const checklists: ChecklistItem[] = (checklistsRows || []).map((r: any) => ({
    id: r.id,
    name: r.name || '',
    assignedToEmail: r.assigned_to_email || '',
    dueDate: toDateString(r.due_date),
    status: r.status || 'Chưa bắt đầu',
    createdByEmail: r.created_by_email || ''
  }));

  const settings: AppSettings = { discordWebhookUrl: '', discordIdeaWebhookUrl: '', externalCalendarUrl: '' };
  for (const r of ((settingsRows as any[]) || [])) {
    if (r.key === 'discordWebhookUrl') settings.discordWebhookUrl = r.value || '';
    if (r.key === 'discordIdeaWebhookUrl') settings.discordIdeaWebhookUrl = r.value || '';
    if (r.key === 'externalCalendarUrl') settings.externalCalendarUrl = r.value || '';
  }

  const pitchingBatches: PitchingBatch[] = (pitchingBatchesRows || []).map((r: any) => ({
    id: r.id,
    title: r.title || '',
    category: r.category || '',
    description: r.description || '',
    exampleAngles: r.example_angles || '',
    deadline: toDateString(r.deadline),
    channelGroupId: r.channel_group_id || '',
    createdByEmail: r.created_by_email || '',
    createdAt: toIsoString(r.created_at, new Date().toISOString()),
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
