import "server-only";
import { createHash } from "node:crypto";
import type { Member } from "./types";
import type { getDb } from "./db";

type SqlClient = ReturnType<typeof getDb>;

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function canAccessAudioIdea(member: Member, idea: Record<string, unknown>) {
  return member.role === "Core" || member.role === "E" || idea.assigned_to_email === member.id || idea.submitted_by_email === member.id;
}

export function audioErrorMessage(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  if (code === "PROVIDER_NOT_CONFIGURED") return "Dịch vụ giọng đọc chưa được cấu hình.";
  if (code.startsWith("GRADIO_START_")) return "Không khởi tạo được yêu cầu trên dịch vụ giọng đọc. Space có thể đang ngủ hoặc cần đăng nhập lại.";
  if (code === "GRADIO_GENERATION_FAILED") return "Dịch vụ giọng đọc báo tạo file thất bại.";
  if (code.startsWith("GRADIO_")) return "Dịch vụ giọng đọc chưa trả về file hoàn chỉnh. Hãy thử lại sau khi Space khởi động xong.";
  if (code.startsWith("REST_PROVIDER_")) return "Dịch vụ giọng đọc chưa xử lý được yêu cầu.";
  return "Không tạo được âm thanh hoặc đã quá thời gian chờ.";
}

export function serializeAudioJob(job: Record<string, unknown>, segments: Record<string, unknown>[]) {
  return {
    id: String(job.id),
    ideaId: String(job.idea_id),
    episode: String(job.episode || ""),
    voiceId: String(job.voice_id || ""),
    voiceName: String(job.voice_name || ""),
    provider: String(job.provider || ""),
    modelVersion: String(job.model_version || ""),
    speed: Number(job.speed || 1),
    scriptFingerprint: String(job.script_fingerprint || ""),
    status: String(job.status || "DRAFT"),
    totalSegments: Number(job.total_segments || 0),
    completedSegments: Number(job.completed_segments || 0),
    masterUrl: job.master_audio ? `/api/audio-jobs/${job.id}/master` : "",
    createdAt: job.created_at ? new Date(String(job.created_at)).toISOString() : "",
    updatedAt: job.updated_at ? new Date(String(job.updated_at)).toISOString() : "",
    segments: segments.map(segment => ({
      id: String(segment.id),
      position: Number(segment.position),
      text: String(segment.text || ""),
      status: String(segment.status || "IDLE"),
      error: String(segment.error || ""),
      attempts: Number(segment.attempts || 0),
      audioUrl: segment.audio_data ? `/api/audio-jobs/${job.id}/segments/${segment.id}` : "",
    })),
  };
}

export async function loadAudioJob(sql: SqlClient, jobId: string) {
  const jobs = await sql.query(`SELECT * FROM audio_jobs WHERE id=$1 LIMIT 1`, [jobId]);
  if (!jobs.length) return null;
  const segments = await sql.query(`SELECT id,position,text,status,error,attempts,audio_data IS NOT NULL AS audio_data FROM audio_segments WHERE job_id=$1 ORDER BY position`, [jobId]);
  return { raw: jobs[0] as Record<string, unknown>, value: serializeAudioJob(jobs[0], segments) };
}

export async function refreshAudioJobStatus(sql: SqlClient, jobId: string) {
  const counts = await sql.query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status='COMPLETE')::int AS complete,
            COUNT(*) FILTER (WHERE status='ERROR')::int AS errors,
            COUNT(*) FILTER (WHERE status='PROCESSING')::int AS processing
       FROM audio_segments WHERE job_id=$1`,
    [jobId]
  );
  const count = counts[0] || { total: 0, complete: 0, errors: 0, processing: 0 };
  const total = Number(count.total || 0);
  const complete = Number(count.complete || 0);
  const errors = Number(count.errors || 0);
  const processing = Number(count.processing || 0);
  const status = total > 0 && complete === total ? "COMPLETE" : processing > 0 ? "PROCESSING" : errors > 0 && complete > 0 ? "PARTIAL" : errors > 0 ? "FAILED" : "DRAFT";
  await sql.query(`UPDATE audio_jobs SET status=$1,total_segments=$2,completed_segments=$3,updated_at=NOW() WHERE id=$4`, [status, total, complete, jobId]);
}
