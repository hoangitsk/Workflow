import { randomUUID } from "node:crypto";
import { getCurrentMember } from "../../../actions/auth-actions";
import { ensureSchema, getDb } from "../../../lib/db";
import { countWords, MAX_SCENE_WORDS } from "../../../lib/audio-utils";
import { getVoiceConfig } from "../../../lib/voice-config";
import { getVoiceProviderState } from "../../../lib/tts-provider";
import { canAccessAudioIdea, loadAudioJob, sha256 } from "../../../lib/audio-job-server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const member = await getCurrentMember();
  if (!member) return Response.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  const sql = getDb();
  await ensureSchema(sql);
  const ideaId = new URL(request.url).searchParams.get("ideaId")?.trim() || "";
  const rows = await sql.query(
    `SELECT aj.* FROM audio_jobs aj
       JOIN ideas i ON i.id=aj.idea_id
      WHERE ($1='' OR aj.idea_id=$1)
        AND ($2 IN ('Core','E') OR aj.created_by_email=$3 OR i.assigned_to_email=$3 OR i.submitted_by_email=$3)
      ORDER BY aj.updated_at DESC LIMIT 30`,
    [ideaId, member.role, member.id]
  );
  const jobs = [];
  for (const row of rows) {
    const loaded = await loadAudioJob(sql, String(row.id));
    if (loaded) jobs.push(loaded.value);
  }
  return Response.json({ jobs }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function POST(request: Request) {
  const member = await getCurrentMember();
  if (!member) return Response.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  try {
    if (Number(request.headers.get("content-length")) > 300_000) return Response.json({ error: "Nội dung job quá dài." }, { status: 413 });
    const body = await request.json() as Record<string, unknown>;
    const ideaId = typeof body.ideaId === "string" ? body.ideaId.trim() : "";
    const episode = typeof body.episode === "string" ? body.episode.trim() : "";
    const voiceId = typeof body.voiceId === "string" ? body.voiceId.trim() : "";
    const speed = Number(body.speed);
    const segments = Array.isArray(body.segments) ? body.segments : [];
    const voices = getVoiceConfig();
    const voice = voices.find(item => item.id === voiceId);
    if (!ideaId || !episode || episode.length > 300) return Response.json({ error: "Chọn công việc và nhập mã tập hợp lệ." }, { status: 400 });
    if (!voice) return Response.json({ error: "Chọn một giọng đọc đã được cấu hình." }, { status: 400 });
    if (!Number.isFinite(speed) || speed < 0.75 || speed > 1.25) return Response.json({ error: "Tốc độ phải từ 0,75 đến 1,25." }, { status: 400 });
    if (!segments.length || segments.length > 100 || !segments.every(text => typeof text === "string" && text.trim() && text.length <= 10_000 && countWords(text) <= MAX_SCENE_WORDS)) {
      return Response.json({ error: "Job cần 1–100 đoạn; mỗi đoạn có tối đa 150 từ / 10.000 ký tự." }, { status: 400 });
    }
    const sql = getDb();
    await ensureSchema(sql);
    const ideas = await sql.query(`SELECT * FROM ideas WHERE id=$1 LIMIT 1`, [ideaId]);
    const idea = ideas[0] as Record<string, unknown> | undefined;
    if (!idea) return Response.json({ error: "Không tìm thấy công việc." }, { status: 404 });
    if (!canAccessAudioIdea(member, idea)) return Response.json({ error: "Bạn không phụ trách công việc này." }, { status: 403 });
    if (idea.script_status !== "APPROVED" && !idea.gate2_approved_at) return Response.json({ error: "Chỉ tạo âm thanh từ kịch bản đã được duyệt." }, { status: 409 });
    const cleanSegments = (segments as string[]).map(text => text.trim());
    const fingerprint = sha256(JSON.stringify({ ideaId, voiceId, speed, segments: cleanSegments }));
    const existing = await sql.query(`SELECT id FROM audio_jobs WHERE idea_id=$1 AND script_fingerprint=$2 AND voice_id=$3 AND speed=$4 ORDER BY updated_at DESC LIMIT 1`, [ideaId, fingerprint, voiceId, speed]);
    if (existing.length) {
      const loaded = await loadAudioJob(sql, String(existing[0].id));
      return Response.json({ job: loaded?.value, reused: true });
    }
    const jobId = randomUUID();
    const provider = getVoiceProviderState();
    await sql.query(
      `INSERT INTO audio_jobs (id,idea_id,created_by_email,episode,voice_id,voice_name,provider,model_version,speed,script_fingerprint,status,total_segments,completed_segments)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'DRAFT',$11,0)`,
      [jobId, ideaId, member.id, episode, voiceId, voice.name, provider.provider, provider.modelVersion, speed, fingerprint, cleanSegments.length]
    );
    try {
      for (let position = 0; position < cleanSegments.length; position += 1) {
        const text = cleanSegments[position];
        await sql.query(
          `INSERT INTO audio_segments (id,job_id,position,text,text_fingerprint,status) VALUES ($1,$2,$3,$4,$5,'IDLE')`,
          [randomUUID(), jobId, position, text, sha256(text)]
        );
      }
    } catch (error) {
      await sql.query(`DELETE FROM audio_jobs WHERE id=$1`, [jobId]);
      throw error;
    }
    const loaded = await loadAudioJob(sql, jobId);
    return Response.json({ job: loaded?.value, reused: false }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof SyntaxError ? "Dữ liệu yêu cầu không hợp lệ." : "Không lưu được job âm thanh." }, { status: error instanceof SyntaxError ? 400 : 500 });
  }
}

