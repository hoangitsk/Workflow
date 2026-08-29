import dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import { neon } from '@neondatabase/serverless';
import { JWT } from 'google-auth-library';

const databaseUrl = process.env.POSTGRES_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("Missing DATABASE_URL or POSTGRES_URL in .env");
  process.exit(1);
}

const sql = neon(databaseUrl);

async function initSchema() {
  console.log("Creating Postgres tables if not exist...");

  await sql.query(`
    CREATE TABLE IF NOT EXISTS members (
      id VARCHAR(255) PRIMARY KEY,
      password VARCHAR(255),
      name VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'P',
      username VARCHAR(100),
      phone VARCHAR(50),
      facebook TEXT,
      primary_expertise TEXT,
      secondary_expertise TEXT,
      active BOOLEAN NOT NULL DEFAULT TRUE
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS platforms (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      default_duration_days INT NOT NULL DEFAULT 2
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS channel_groups (
      id VARCHAR(100) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      color VARCHAR(50) NOT NULL DEFAULT '#5B9EE8',
      archived BOOLEAN NOT NULL DEFAULT FALSE,
      reference_video_link TEXT,
      video_format TEXT
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS platform_channels (
      id VARCHAR(100) PRIMARY KEY,
      channel_group_id VARCHAR(100) NOT NULL,
      platform_id VARCHAR(100) NOT NULL
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS ideas (
      id VARCHAR(100) PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      platform_channel_id VARCHAR(100),
      submitted_by_email VARCHAR(255),
      status VARCHAR(50) NOT NULL DEFAULT 'PITCH',
      duration_days INT DEFAULT 0,
      assigned_to_email VARCHAR(255),
      start_date VARCHAR(50),
      end_date VARCHAR(50),
      script_link TEXT,
      video_link TEXT,
      qa_feedback TEXT,
      published_link TEXT,
      scheduled_post_date VARCHAR(50),
      created_at VARCHAR(100),
      assigned_at VARCHAR(100),
      video_submitted_at VARCHAR(100),
      credits_idea_by_email VARCHAR(255),
      credits_script_by_email VARCHAR(255),
      credits_edited_script_by_email VARCHAR(255),
      credits_produced_by_email VARCHAR(255),
      credits_qa_by_email VARCHAR(255),
      credits_approved_by_email VARCHAR(255),
      cancel_reason TEXT,
      cancelled_by_email VARCHAR(255),
      cancelled_at VARCHAR(100),
      last_pitch_week VARCHAR(50),
      internal_note TEXT,
      rating NUMERIC,
      tags TEXT,
      logline TEXT,
      reference_links TEXT,
      angle TEXT,
      key_message TEXT
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id VARCHAR(100) PRIMARY KEY,
      idea_id VARCHAR(100) NOT NULL,
      member_id VARCHAR(255) NOT NULL,
      content TEXT NOT NULL,
      created_at VARCHAR(100) NOT NULL
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(100) PRIMARY KEY,
      idea_id VARCHAR(100),
      member_id VARCHAR(255),
      action TEXT NOT NULL,
      metadata TEXT,
      timestamp VARCHAR(100) NOT NULL
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS notifications (
      id VARCHAR(100) PRIMARY KEY,
      member_id VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'info',
      related_idea_id VARCHAR(100),
      message TEXT NOT NULL,
      read BOOLEAN NOT NULL DEFAULT FALSE,
      created_at VARCHAR(100) NOT NULL
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS checklists (
      id VARCHAR(100) PRIMARY KEY,
      name TEXT NOT NULL,
      assigned_to_email VARCHAR(255),
      due_date VARCHAR(50),
      status VARCHAR(50) NOT NULL DEFAULT 'Chưa bắt đầu',
      created_by_email VARCHAR(255)
    );
  `);

  await sql.query(`
    CREATE TABLE IF NOT EXISTS settings (
      key VARCHAR(100) PRIMARY KEY,
      value TEXT
    );
  `);

  // Add new columns if they don't exist
  try {
    await sql.query(`ALTER TABLE ideas ADD COLUMN logline TEXT;`);
  } catch (e) { /* ignores if exists */ }
  try {
    await sql.query(`ALTER TABLE ideas ADD COLUMN reference_links TEXT;`);
  } catch (e) { /* ignores if exists */ }
  try {
    await sql.query(`ALTER TABLE ideas ADD COLUMN angle TEXT;`);
  } catch (e) { /* ignores if exists */ }
  try {
    await sql.query(`ALTER TABLE ideas ADD COLUMN key_message TEXT;`);
  } catch (e) { /* ignores if exists */ }

  try {
    await sql.query(`ALTER TABLE channel_groups ADD COLUMN reference_video_link TEXT;`);
  } catch (e) { /* ignores if exists */ }
  try {
    await sql.query(`ALTER TABLE channel_groups ADD COLUMN video_format TEXT;`);
  } catch (e) { /* ignores if exists */ }

  console.log("✅ Schema initialized successfully!");
}

async function migrateFromGoogleSheets() {
  console.log("Reading data from Google Sheets...");
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
  const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!spreadsheetId || !serviceAccountEmail || !privateKey) {
    console.log("Skipping Google Sheets migration (credentials not set).");
    return;
  }

  const auth = new JWT({
    email: serviceAccountEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet?ranges=Members!A1:Z&ranges=Platforms!A1:Z&ranges=ChannelGroups!A1:Z&ranges=PlatformChannels!A1:Z&ranges=Ideas!A1:Z&ranges=Comments!A1:Z&ranges=AuditLogs!A1:Z&ranges=Notifications!A1:Z&ranges=Checklists!A1:Z&ranges=Settings!A1:Z`;

  const response = await auth.request({ url });
  const valueRanges = response.data.valueRanges || [];

  function getSheetRows(sheetName) {
    const vr = valueRanges.find(r => r.range && (r.range.startsWith(`'${sheetName}'!`) || r.range.startsWith(`${sheetName}!`)));
    if (!vr || !vr.values || vr.values.length < 2) return [];
    const [headers, ...dataRows] = vr.values;
    return dataRows.map(row => {
      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = row[idx] !== undefined ? String(row[idx]).trim() : '';
      });
      return obj;
    });
  }

  // 1. Members
  const members = getSheetRows("Members");
  console.log(`Migrating ${members.length} members...`);
  for (const m of members) {
    if (!m.id) continue;
    await sql.query(`
      INSERT INTO members (id, password, name, role, username, phone, facebook, primary_expertise, secondary_expertise, active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT (id) DO UPDATE SET
        password = EXCLUDED.password,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        username = EXCLUDED.username,
        phone = EXCLUDED.phone,
        facebook = EXCLUDED.facebook,
        primary_expertise = EXCLUDED.primary_expertise,
        secondary_expertise = EXCLUDED.secondary_expertise,
        active = EXCLUDED.active;
    `, [
      m.id,
      m.password || '',
      m.name || m.id,
      m.role || 'P',
      m.username || '',
      m.phone || '',
      m.facebook || '',
      m.primaryExpertise || '',
      m.secondaryExpertise || '',
      m.active !== 'FALSE' && m.active !== 'false'
    ]);
  }

  // 2. Platforms
  const platforms = getSheetRows("Platforms");
  console.log(`Migrating ${platforms.length} platforms...`);
  for (const p of platforms) {
    if (!p.id) continue;
    await sql.query(`
      INSERT INTO platforms (id, name, default_duration_days)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        default_duration_days = EXCLUDED.default_duration_days;
    `, [
      p.id,
      p.name || '',
      parseInt(p.defaultDurationDays || '2', 10) || 2
    ]);
  }

  // 3. ChannelGroups
  let channelGroups = getSheetRows("ChannelGroups");
  if (channelGroups.length === 0) channelGroups = getSheetRows("Channels");
  console.log(`Migrating ${channelGroups.length} channel groups...`);
  for (const cg of channelGroups) {
    if (!cg.id) continue;
    await sql.query(`
      INSERT INTO channel_groups (id, name, color, archived)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        color = EXCLUDED.color,
        archived = EXCLUDED.archived;
    `, [
      cg.id,
      cg.name || '',
      cg.color || '#5B9EE8',
      cg.archived === 'TRUE' || cg.archived === 'true'
    ]);
  }

  // 4. PlatformChannels
  const platformChannels = getSheetRows("PlatformChannels");
  console.log(`Migrating ${platformChannels.length} platform channels...`);
  for (const pc of platformChannels) {
    if (!pc.id) continue;
    await sql.query(`
      INSERT INTO platform_channels (id, channel_group_id, platform_id)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO UPDATE SET
        channel_group_id = EXCLUDED.channel_group_id,
        platform_id = EXCLUDED.platform_id;
    `, [
      pc.id,
      pc.channelGroupId || '',
      pc.platformId || ''
    ]);
  }

  // 5. Ideas
  const ideas = getSheetRows("Ideas");
  console.log(`Migrating ${ideas.length} ideas...`);
  for (const i of ideas) {
    if (!i.id) continue;
    await sql.query(`
      INSERT INTO ideas (
        id, title, description, platform_channel_id, submitted_by_email, status,
        duration_days, assigned_to_email, start_date, end_date, script_link, video_link,
        qa_feedback, published_link, scheduled_post_date, created_at, assigned_at,
        video_submitted_at, credits_idea_by_email, credits_script_by_email,
        credits_edited_script_by_email, credits_produced_by_email, credits_qa_by_email,
        credits_approved_by_email, cancel_reason, cancelled_by_email, cancelled_at,
        last_pitch_week, internal_note, rating, tags
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31
      ) ON CONFLICT (id) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        platform_channel_id = EXCLUDED.platform_channel_id,
        submitted_by_email = EXCLUDED.submitted_by_email,
        status = EXCLUDED.status,
        duration_days = EXCLUDED.duration_days,
        assigned_to_email = EXCLUDED.assigned_to_email,
        start_date = EXCLUDED.start_date,
        end_date = EXCLUDED.end_date,
        script_link = EXCLUDED.script_link,
        video_link = EXCLUDED.video_link,
        qa_feedback = EXCLUDED.qa_feedback,
        published_link = EXCLUDED.published_link,
        scheduled_post_date = EXCLUDED.scheduled_post_date,
        created_at = EXCLUDED.created_at,
        assigned_at = EXCLUDED.assigned_at,
        video_submitted_at = EXCLUDED.video_submitted_at,
        credits_idea_by_email = EXCLUDED.credits_idea_by_email,
        credits_script_by_email = EXCLUDED.credits_script_by_email,
        credits_edited_script_by_email = EXCLUDED.credits_edited_script_by_email,
        credits_produced_by_email = EXCLUDED.credits_produced_by_email,
        credits_qa_by_email = EXCLUDED.credits_qa_by_email,
        credits_approved_by_email = EXCLUDED.credits_approved_by_email,
        cancel_reason = EXCLUDED.cancel_reason,
        cancelled_by_email = EXCLUDED.cancelled_by_email,
        cancelled_at = EXCLUDED.cancelled_at,
        last_pitch_week = EXCLUDED.last_pitch_week,
        internal_note = EXCLUDED.internal_note,
        rating = EXCLUDED.rating,
        tags = EXCLUDED.tags;
    `, [
      i.id,
      i.title || '',
      i.description || '',
      i.platformChannelId || i.channelId || '',
      i.submittedByEmail || '',
      i.status || 'PITCH',
      parseInt(i.durationDays || '0', 10) || 0,
      i.assignedToEmail || '',
      i.startDate || '',
      i.endDate || '',
      i.scriptLink || '',
      i.videoLink || '',
      i.qaFeedback || '',
      i.publishedLink || '',
      i.scheduledPostDate || '',
      i.createdAt || new Date().toISOString(),
      i.assignedAt || '',
      i.videoSubmittedAt || '',
      i.creditsIdeaByEmail || i.submittedByEmail || '',
      i.creditsScriptByEmail || '',
      i.creditsEditedScriptByEmail || '',
      i.creditsProducedByEmail || '',
      i.creditsQaByEmail || '',
      i.creditsApprovedByEmail || '',
      i.cancelReason || '',
      i.cancelledByEmail || '',
      i.cancelledAt || '',
      i.lastPitchWeek || '',
      i.internalNote || '',
      i.rating ? parseFloat(i.rating) : null,
      i.tags || ''
    ]);
  }

  // 6. Comments
  const comments = getSheetRows("Comments");
  console.log(`Migrating ${comments.length} comments...`);
  for (const c of comments) {
    if (!c.id) continue;
    await sql.query(`
      INSERT INTO comments (id, idea_id, member_id, content, created_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE SET
        idea_id = EXCLUDED.idea_id,
        member_id = EXCLUDED.member_id,
        content = EXCLUDED.content,
        created_at = EXCLUDED.created_at;
    `, [
      c.id,
      c.ideaId || '',
      c.memberId || '',
      c.content || '',
      c.createdAt || new Date().toISOString()
    ]);
  }

  // 7. AuditLogs
  const auditLogs = getSheetRows("AuditLogs");
  console.log(`Migrating ${auditLogs.length} audit logs...`);
  for (const a of auditLogs) {
    if (!a.id) continue;
    await sql.query(`
      INSERT INTO audit_logs (id, idea_id, member_id, action, metadata, timestamp)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        idea_id = EXCLUDED.idea_id,
        member_id = EXCLUDED.member_id,
        action = EXCLUDED.action,
        metadata = EXCLUDED.metadata,
        timestamp = EXCLUDED.timestamp;
    `, [
      a.id,
      a.ideaId || '',
      a.memberId || '',
      a.action || '',
      a.metadata || '',
      a.timestamp || new Date().toISOString()
    ]);
  }

  // 8. Notifications
  const notifications = getSheetRows("Notifications");
  console.log(`Migrating ${notifications.length} notifications...`);
  for (const n of notifications) {
    if (!n.id) continue;
    await sql.query(`
      INSERT INTO notifications (id, member_id, type, related_idea_id, message, read, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        member_id = EXCLUDED.member_id,
        type = EXCLUDED.type,
        related_idea_id = EXCLUDED.related_idea_id,
        message = EXCLUDED.message,
        read = EXCLUDED.read,
        created_at = EXCLUDED.created_at;
    `, [
      n.id,
      n.memberId || '',
      n.type || 'info',
      n.relatedIdeaId || '',
      n.message || '',
      n.read === 'TRUE' || n.read === 'true',
      n.createdAt || new Date().toISOString()
    ]);
  }

  // 9. Checklists
  const checklists = getSheetRows("Checklists");
  console.log(`Migrating ${checklists.length} checklists...`);
  for (const chk of checklists) {
    if (!chk.id) continue;
    await sql.query(`
      INSERT INTO checklists (id, name, assigned_to_email, due_date, status, created_by_email)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        assigned_to_email = EXCLUDED.assigned_to_email,
        due_date = EXCLUDED.due_date,
        status = EXCLUDED.status,
        created_by_email = EXCLUDED.created_by_email;
    `, [
      chk.id,
      chk.name || '',
      chk.assignedToEmail || '',
      chk.dueDate || '',
      chk.status || 'Chưa bắt đầu',
      chk.createdByEmail || ''
    ]);
  }

  // 10. Settings
  const settings = getSheetRows("Settings");
  console.log(`Migrating ${settings.length} settings...`);
  for (const s of settings) {
    if (!s.key) continue;
    await sql.query(`
      INSERT INTO settings (key, value)
      VALUES ($1, $2)
      ON CONFLICT (key) DO UPDATE SET
        value = EXCLUDED.value;
    `, [
      s.key,
      s.value || ''
    ]);
  }

  console.log("🎉 Complete data migration from Google Sheets to Neon Postgres succeeded!");
}

async function main() {
  try {
    await initSchema();
    await migrateFromGoogleSheets();
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

main();
