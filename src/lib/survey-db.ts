import { getDb } from './db';

export interface SurveyResponseRecord {
  id: string;
  fullname: string;
  school?: string;
  phone?: string;
  email?: string;
  clarity: number;
  usefulness: number;
  facilitator: number;
  satisfaction: number;
  highlight?: string;
  gap?: string;
  continue_project: string;
  reason?: string;
  submitted_at: string;
}

export interface SurveyInput {
  fullname: string;
  school?: string;
  phone?: string;
  email?: string;
  clarity: number;
  usefulness: number;
  facilitator: number;
  satisfaction: number;
  highlight?: string;
  gap?: string;
  continue_project: string;
  reason?: string;
}

let schemaEnsured = false;
let schemaPromise: Promise<void> | null = null;

export async function ensureSurveySchema(): Promise<void> {
  if (schemaEnsured) return;
  if (schemaPromise) return schemaPromise;

  schemaPromise = (async () => {
    try {
      const sql = getDb();
      await sql.query(`
        CREATE TABLE IF NOT EXISTS survey_responses (
          id VARCHAR(100) PRIMARY KEY,
          fullname VARCHAR(255) NOT NULL,
          school VARCHAR(255),
          phone VARCHAR(100),
          email VARCHAR(255),
          clarity INT DEFAULT 0,
          usefulness INT DEFAULT 0,
          facilitator INT DEFAULT 0,
          satisfaction INT NOT NULL,
          highlight TEXT,
          gap TEXT,
          continue_project VARCHAR(255) NOT NULL,
          reason TEXT,
          submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        );
      `);
      await sql.query(`
        CREATE INDEX IF NOT EXISTS idx_survey_responses_submitted_at ON survey_responses (submitted_at DESC);
      `);
      schemaEnsured = true;
    } catch (err) {
      console.error('Lỗi khởi tạo bảng survey_responses:', err);
      schemaEnsured = false;
    } finally {
      schemaPromise = null;
    }
  })();

  return schemaPromise;
}

export async function saveSurveyResponse(input: SurveyInput): Promise<SurveyResponseRecord> {
  await ensureSurveySchema();
  const sql = getDb();

  const id = 'srv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
  const now = new Date().toISOString();

  await sql.query(`
    INSERT INTO survey_responses (
      id, fullname, school, phone, email,
      clarity, usefulness, facilitator, satisfaction,
      highlight, gap, continue_project, reason, submitted_at
    ) VALUES (
      $1, $2, $3, $4, $5,
      $6, $7, $8, $9,
      $10, $11, $12, $13, $14
    )
  `, [
    id,
    input.fullname?.trim() || 'Khuyết danh',
    input.school?.trim() || null,
    input.phone?.trim() || null,
    input.email?.trim() || null,
    Number(input.clarity) || 0,
    Number(input.usefulness) || 0,
    Number(input.facilitator) || 0,
    Number(input.satisfaction) || 0,
    input.highlight?.trim() || null,
    input.gap?.trim() || null,
    input.continue_project?.trim() || '',
    input.reason?.trim() || null,
    now
  ]);

  return {
    id,
    fullname: input.fullname?.trim() || 'Khuyết danh',
    school: input.school?.trim() || '',
    phone: input.phone?.trim() || '',
    email: input.email?.trim() || '',
    clarity: Number(input.clarity) || 0,
    usefulness: Number(input.usefulness) || 0,
    facilitator: Number(input.facilitator) || 0,
    satisfaction: Number(input.satisfaction) || 0,
    highlight: input.highlight?.trim() || '',
    gap: input.gap?.trim() || '',
    continue_project: input.continue_project?.trim() || '',
    reason: input.reason?.trim() || '',
    submitted_at: now
  };
}

export async function getAllSurveyResponses(): Promise<SurveyResponseRecord[]> {
  await ensureSurveySchema();
  const sql = getDb();

  try {
    const rows = await sql.query(`
      SELECT 
        id, fullname, school, phone, email,
        clarity, usefulness, facilitator, satisfaction,
        highlight, gap, continue_project, reason,
        submitted_at
      FROM survey_responses
      ORDER BY submitted_at DESC
    `);

    return (rows as any[]).map(r => ({
      id: String(r.id),
      fullname: String(r.fullname || ''),
      school: String(r.school || ''),
      phone: String(r.phone || ''),
      email: String(r.email || ''),
      clarity: Number(r.clarity || 0),
      usefulness: Number(r.usefulness || 0),
      facilitator: Number(r.facilitator || 0),
      satisfaction: Number(r.satisfaction || 0),
      highlight: String(r.highlight || ''),
      gap: String(r.gap || ''),
      continue_project: String(r.continue_project || ''),
      reason: String(r.reason || ''),
      submitted_at: r.submitted_at instanceof Date ? r.submitted_at.toISOString() : String(r.submitted_at || '')
    }));
  } catch (err) {
    console.error('Lỗi truy vấn danh sách khảo sát:', err);
    return [];
  }
}

export async function deleteSurveyResponseById(id: string): Promise<boolean> {
  await ensureSurveySchema();
  const sql = getDb();

  try {
    await sql.query(`DELETE FROM survey_responses WHERE id = $1`, [id]);
    return true;
  } catch (err) {
    console.error('Lỗi xóa khảo sát:', err);
    return false;
  }
}
