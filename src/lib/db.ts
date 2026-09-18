import { neon } from '@neondatabase/serverless';
import { 
  Member, Platform, ChannelGroup, PlatformChannel, Idea, 
  CommentItem, AuditLogItem, NotificationItem, ChecklistItem, AppSettings, PitchingBatch,
  ActiveGate, ScriptStatus, PlatformType, ChannelTier, DerivativeType, CopyrightCheckStatus, ScriptData
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

function parseJsonField<T>(val: any, fallback: T): T {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'object') return val as T;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return fallback;
    try {
      return JSON.parse(trimmed) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
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
        'ALTER TABLE channel_groups ADD COLUMN IF NOT EXISTS discord_webhook_url TEXT;',
        'ALTER TABLE channel_groups ADD COLUMN IF NOT EXISTS topic_branch TEXT;',
        'ALTER TABLE platform_channels ADD COLUMN IF NOT EXISTS external_name TEXT;',
        'ALTER TABLE platform_channels ADD COLUMN IF NOT EXISTS external_url TEXT;',
        'ALTER TABLE platform_channels ADD COLUMN IF NOT EXISTS external_channel_id TEXT;',
        // SOP Gating and State Machine (R2)
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS active_gate VARCHAR(50) DEFAULT 'GATE_1_IDEA';",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate1_approved_at VARCHAR(100);",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate1_approved_by_email VARCHAR(255);",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS script_status VARCHAR(50) DEFAULT 'DRAFT';",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS script_locked BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS script_revision_notes TEXT;",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate2_approved_at VARCHAR(100);",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate2_approved_by_email VARCHAR(255);",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate4_approved_at VARCHAR(100);",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate4_approved_by_email VARCHAR(255);",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate5_approved_at VARCHAR(100);",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate5_approved_by_email VARCHAR(255);",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate5_approved_final_url TEXT;",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS core_approval_notes TEXT;",
        // Script 4-Column & Copyright (R3)
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS script_data JSONB;",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS copyright_commitment BOOLEAN DEFAULT FALSE;",
        // Dual Interactive Checklists & TikTok Checklist (R4, R5)
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS production_checklist JSONB;",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS qc_checklist JSONB;",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tiktok_checklist JSONB;",
        // TikTok Derivative Workflow (R5)
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS parent_task_id VARCHAR(100);",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS derivative_type VARCHAR(50) DEFAULT 'NONE';",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS source_video_url TEXT;",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tiktok_target_duration VARCHAR(50) DEFAULT '30-45s';",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tiktok_reframe_applied BOOLEAN DEFAULT FALSE;",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tiktok_hook_summary TEXT;",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tiktok_cta_route TEXT;",
        // Extended Metadata & Deadlines (R6)
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS platform_type VARCHAR(50) DEFAULT 'YOUTUBE_MASTER';",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS channel_tier VARCHAR(50);",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS master_video_link TEXT;",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS asset_folder_link TEXT;",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS script_doc_link TEXT;",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS video_draft_link TEXT;",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS source_project_link TEXT;",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS video_final_link TEXT;",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS deadline_script VARCHAR(50);",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS deadline_production VARCHAR(50);",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS deadline_qc VARCHAR(50);",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS target_publish_date VARCHAR(50);",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS copyright_footage VARCHAR(50) DEFAULT 'PENDING';",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS copyright_music VARCHAR(50) DEFAULT 'PENDING';",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS copyright_mascot VARCHAR(50) DEFAULT 'OFFICIAL';",
        // Publish & Post-Publish Analytics (R6)
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS published_title TEXT;",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS published_thumbnail TEXT;",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS published_caption TEXT;",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS published_hashtags TEXT;",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS metrics_views NUMERIC DEFAULT 0;",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS metrics_retention VARCHAR(50);",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS metrics_ctr VARCHAR(50);",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS metrics_comments INT DEFAULT 0;",
        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS metrics_insights TEXT;",
        // Opaque, revocable server-side sessions. The browser only receives a random token.
        `CREATE TABLE IF NOT EXISTS auth_sessions (
          id VARCHAR(100) PRIMARY KEY,
          member_id VARCHAR(255) NOT NULL,
          expires_at TIMESTAMPTZ NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          revoked_at TIMESTAMPTZ
        );`,
        "CREATE INDEX IF NOT EXISTS idx_auth_sessions_member ON auth_sessions (member_id, expires_at DESC);",
        // Persistent audio workflow. Audio bytes stay private in Postgres so a reload does not lose outputs.
        `CREATE TABLE IF NOT EXISTS audio_jobs (
          id VARCHAR(100) PRIMARY KEY,
          idea_id VARCHAR(100) NOT NULL,
          created_by_email VARCHAR(255) NOT NULL,
          episode TEXT NOT NULL,
          voice_id TEXT NOT NULL,
          voice_name TEXT NOT NULL,
          provider TEXT NOT NULL,
          model_version TEXT,
          speed NUMERIC NOT NULL,
          script_fingerprint VARCHAR(64) NOT NULL,
          status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
          total_segments INT NOT NULL DEFAULT 0,
          completed_segments INT NOT NULL DEFAULT 0,
          master_audio BYTEA,
          master_mime_type VARCHAR(100),
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );`,
        `CREATE TABLE IF NOT EXISTS audio_segments (
          id VARCHAR(100) PRIMARY KEY,
          job_id VARCHAR(100) NOT NULL REFERENCES audio_jobs(id) ON DELETE CASCADE,
          position INT NOT NULL,
          text TEXT NOT NULL,
          text_fingerprint VARCHAR(64) NOT NULL,
          status VARCHAR(30) NOT NULL DEFAULT 'IDLE',
          error TEXT,
          audio_data BYTEA,
          mime_type VARCHAR(100),
          attempts INT NOT NULL DEFAULT 0,
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(job_id, position)
        );`,
        `CREATE TABLE IF NOT EXISTS publishing_jobs (
          id VARCHAR(100) PRIMARY KEY,
          idea_id VARCHAR(100) NOT NULL UNIQUE,
          platform_channel_id VARCHAR(100) NOT NULL,
          created_by_email VARCHAR(255) NOT NULL,
          mode VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
          status VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
          package_version INT NOT NULL DEFAULT 1,
          idempotency_key VARCHAR(160) NOT NULL UNIQUE,
          final_asset_url TEXT NOT NULL,
          destination_name TEXT,
          destination_url TEXT,
          title TEXT NOT NULL,
          caption TEXT,
          hashtags TEXT,
          thumbnail TEXT,
          scheduled_date DATE,
          timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Bangkok',
          external_url TEXT,
          external_id TEXT,
          last_error TEXT,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          published_at TIMESTAMPTZ
        );`,
        // Performance Indexes
        "CREATE INDEX IF NOT EXISTS idx_audio_jobs_idea ON audio_jobs (idea_id, updated_at DESC);",
        "CREATE INDEX IF NOT EXISTS idx_audio_segments_job ON audio_segments (job_id, position);",
        "CREATE INDEX IF NOT EXISTS idx_publishing_jobs_status ON publishing_jobs (status, updated_at DESC);",
        "CREATE INDEX IF NOT EXISTS idx_ideas_parent_task_id ON ideas (parent_task_id);",
        "CREATE INDEX IF NOT EXISTS idx_ideas_active_gate ON ideas (active_gate);",
        "CREATE INDEX IF NOT EXISTS idx_ideas_platform_type ON ideas (platform_type);"
      ];
      for (const m of migrations) {
        try {
          await sql.query(m);
        } catch (error) {
          console.error("Schema migration failed:", error instanceof Error ? error.message : "Unknown database error");
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
      settings: { discordWebhookUrl: '', discordIdeaWebhookUrl: '', externalCalendarUrl: '', discordMuted: false },
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
    discordWebhookUrl: r.discord_webhook_url || '',
    topicBranch: r.topic_branch || ''
  }));

  const platformChannels: PlatformChannel[] = (platformChannelsRows || []).map((r: any) => ({
    id: r.id,
    channelGroupId: r.channel_group_id || '',
    platformId: r.platform_id || '',
    externalName: r.external_name || '',
    externalUrl: r.external_url || '',
    externalChannelId: r.external_channel_id || ''
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
    contentPillar: r.content_pillar || '',
    // SOP Gating & Approvals (R2)
    activeGate: (r.active_gate || 'GATE_1_IDEA') as ActiveGate,
    gate1ApprovedAt: toIsoString(r.gate1_approved_at),
    gate1ApprovedByEmail: r.gate1_approved_by_email || '',
    scriptStatus: (r.script_status || 'DRAFT') as ScriptStatus,
    scriptLocked: r.script_locked === true,
    scriptRevisionNotes: r.script_revision_notes || '',
    gate2ApprovedAt: toIsoString(r.gate2_approved_at),
    gate2ApprovedByEmail: r.gate2_approved_by_email || '',
    gate4ApprovedAt: toIsoString(r.gate4_approved_at),
    gate4ApprovedByEmail: r.gate4_approved_by_email || '',
    gate5ApprovedAt: toIsoString(r.gate5_approved_at),
    gate5ApprovedByEmail: r.gate5_approved_by_email || '',
    gate5ApprovedFinalUrl: r.gate5_approved_final_url || '',
    coreApprovalNotes: r.core_approval_notes || '',
    // Script 4-Column & Copyright (R3)
    scriptData: parseJsonField<ScriptData | undefined>(r.script_data, undefined),
    copyrightCommitment: r.copyright_commitment === true,
    // Dual Checklists & TikTok Checklist (R4, R5)
    productionChecklist: parseJsonField<ChecklistItem[] | undefined>(r.production_checklist, undefined),
    qcChecklist: parseJsonField<ChecklistItem[] | undefined>(r.qc_checklist, undefined),
    tiktokChecklist: parseJsonField<ChecklistItem[] | undefined>(r.tiktok_checklist, undefined),
    // TikTok Derivative (R5)
    parentTaskId: r.parent_task_id || undefined,
    derivativeType: (r.derivative_type || 'NONE') as DerivativeType,
    sourceVideoUrl: r.source_video_url || '',
    tiktokTargetDuration: r.tiktok_target_duration || '30-45s',
    tiktokReframeApplied: r.tiktok_reframe_applied === true,
    tiktokHookSummary: r.tiktok_hook_summary || '',
    tiktokCtaRoute: r.tiktok_cta_route || '',
    // Extended Lifecycle & Resource Links (R6)
    platformType: (r.platform_type || 'YOUTUBE_MASTER') as PlatformType,
    channelTier: r.channel_tier ? (r.channel_tier as ChannelTier) : undefined,
    masterVideoLink: r.master_video_link || '',
    assetFolderLink: r.asset_folder_link || '',
    scriptDocLink: r.script_doc_link || '',
    videoDraftLink: r.video_draft_link || '',
    sourceProjectLink: r.source_project_link || '',
    videoFinalLink: r.video_final_link || '',
    deadlineScript: toDateString(r.deadline_script),
    deadlineProduction: toDateString(r.deadline_production),
    deadlineQc: toDateString(r.deadline_qc),
    targetPublishDate: toDateString(r.target_publish_date),
    copyrightFootage: (r.copyright_footage || 'PENDING') as CopyrightCheckStatus,
    copyrightMusic: (r.copyright_music || 'PENDING') as CopyrightCheckStatus,
    copyrightMascot: (r.copyright_mascot || 'OFFICIAL') as CopyrightCheckStatus,
    // Publish & Post-Publish Analytics (R6)
    publishedTitle: r.published_title || '',
    publishedThumbnail: r.published_thumbnail || '',
    publishedCaption: r.published_caption || '',
    publishedHashtags: r.published_hashtags || '',
    metricsViews: r.metrics_views !== null && r.metrics_views !== undefined ? parseFloat(r.metrics_views) : 0,
    metricsRetention: r.metrics_retention || '',
    metricsCtr: r.metrics_ctr || '',
    metricsComments: r.metrics_comments !== null && r.metrics_comments !== undefined ? parseInt(r.metrics_comments, 10) : 0,
    metricsInsights: r.metrics_insights || '',
    // Snake_case aliases for direct backward compatibility
    active_gate: (r.active_gate || 'GATE_1_IDEA') as ActiveGate,
    script_status: (r.script_status || 'DRAFT') as ScriptStatus,
    script_locked: r.script_locked === true,
    parent_task_id: r.parent_task_id || undefined,
    derivative_type: (r.derivative_type || 'NONE') as DerivativeType,
    platform_type: (r.platform_type || 'YOUTUBE_MASTER') as PlatformType,
    channel_tier: r.channel_tier ? (r.channel_tier as ChannelTier) : undefined
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
    label: r.name || '',
    checked: r.status === 'Hoàn thành',
    assignedToEmail: r.assigned_to_email || '',
    dueDate: toDateString(r.due_date),
    status: r.status || 'Chưa bắt đầu',
    createdByEmail: r.created_by_email || ''
  }));

  const settings: AppSettings = { discordWebhookUrl: '', discordIdeaWebhookUrl: '', externalCalendarUrl: '', discordMuted: false };
  for (const r of ((settingsRows as any[]) || [])) {
    if (r.key === 'discordWebhookUrl') settings.discordWebhookUrl = r.value || '';
    if (r.key === 'discordIdeaWebhookUrl') settings.discordIdeaWebhookUrl = r.value || '';
    if (r.key === 'externalCalendarUrl') settings.externalCalendarUrl = r.value || '';
    if (r.key === 'discordMuted') settings.discordMuted = r.value === 'true';
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
