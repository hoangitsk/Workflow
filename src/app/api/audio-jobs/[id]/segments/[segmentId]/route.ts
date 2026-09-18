import { getCurrentMember } from "../../../../../../actions/auth-actions";
import { ensureSchema, getDb } from "../../../../../../lib/db";
import { getVoiceConfig } from "../../../../../../lib/voice-config";
import { synthesizeSpeech } from "../../../../../../lib/tts-provider";
import { audioErrorMessage, canAccessAudioIdea, loadAudioJob, refreshAudioJobStatus } from "../../../../../../lib/audio-job-server";

export const runtime = "nodejs";
export const maxDuration = 180;
const MAX_AUDIO_BYTES = 15 * 1024 * 1024;

async function context(id: string, segmentId: string) {
  const member = await getCurrentMember();
  if (!member) return { error: Response.json({ error: "Vui lòng đăng nhập." }, { status: 401 }) };
  const sql = getDb();
  await ensureSchema(sql);
  const rows = await sql.query(
    `SELECT aj.*,s.id AS segment_id,s.text,s.status AS segment_status,s.audio_data,s.mime_type,i.assigned_to_email,i.submitted_by_email
       FROM audio_jobs aj JOIN audio_segments s ON s.job_id=aj.id JOIN ideas i ON i.id=aj.idea_id
      WHERE aj.id=$1 AND s.id=$2 LIMIT 1`,
    [id, segmentId]
  );
  if (!rows.length) return { error: Response.json({ error: "Không tìm thấy đoạn âm thanh." }, { status: 404 }) };
  if (!canAccessAudioIdea(member, rows[0])) return { error: Response.json({ error: "Bạn không có quyền với đoạn này." }, { status: 403 }) };
  return { sql, row: rows[0] as Record<string, unknown> };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string; segmentId: string }> }) {
  const { id, segmentId } = await params;
  const result = await context(id, segmentId);
  if (result.error) return result.error;
  if (!result.row.audio_data) return new Response("Chưa có file", { status: 404 });
  const bytes = result.row.audio_data instanceof Uint8Array ? result.row.audio_data : Buffer.from(result.row.audio_data as never);
  return new Response(Uint8Array.from(bytes).buffer, { headers: { "Content-Type": String(result.row.mime_type || "audio/wav"), "Content-Length": String(bytes.byteLength), "Cache-Control": "private, no-store", "Content-Disposition": `inline; filename="${segmentId}.wav"` } });
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string; segmentId: string }> }) {
  const { id, segmentId } = await params;
  const result = await context(id, segmentId);
  if (result.error) return result.error;
  if (!getVoiceConfig().some(voice => voice.id === result.row.voice_id)) return Response.json({ error: "Giọng đọc của job không còn trong cấu hình." }, { status: 409 });
  const claimed = await result.sql.query(`UPDATE audio_segments SET status='PROCESSING',error=NULL,attempts=attempts+1,updated_at=NOW() WHERE id=$1 AND job_id=$2 AND status<>'PROCESSING' RETURNING id`, [segmentId, id]);
  if (!claimed.length) return Response.json({ error: "Đoạn này đang được tạo ở một yêu cầu khác." }, { status: 409 });
  await result.sql.query(`UPDATE audio_jobs SET status='PROCESSING',updated_at=NOW() WHERE id=$1`, [id]);
  try {
    const audio = await synthesizeSpeech(String(result.row.text), String(result.row.voice_id), Number(result.row.speed));
    if (!audio.bytes.length || audio.bytes.length > MAX_AUDIO_BYTES || !audio.mimeType.startsWith("audio/")) throw new Error("AUDIO_INVALID");
    await result.sql.query(`UPDATE audio_segments SET status='COMPLETE',error=NULL,audio_data=$1,mime_type=$2,updated_at=NOW() WHERE id=$3 AND job_id=$4`, [Buffer.from(audio.bytes), audio.mimeType, segmentId, id]);
    await result.sql.query(`UPDATE audio_jobs SET master_audio=NULL,master_mime_type=NULL WHERE id=$1`, [id]);
    await refreshAudioJobStatus(result.sql, id);
    const loaded = await loadAudioJob(result.sql, id);
    return Response.json({ job: loaded?.value, audioUrl: `/api/audio-jobs/${id}/segments/${segmentId}` });
  } catch (error) {
    const message = audioErrorMessage(error);
    await result.sql.query(`UPDATE audio_segments SET status='ERROR',error=$1,audio_data=NULL,mime_type=NULL,updated_at=NOW() WHERE id=$2 AND job_id=$3`, [message, segmentId, id]);
    await refreshAudioJobStatus(result.sql, id);
    return Response.json({ error: message }, { status: error instanceof Error && error.message === "PROVIDER_NOT_CONFIGURED" ? 503 : 502 });
  }
}
