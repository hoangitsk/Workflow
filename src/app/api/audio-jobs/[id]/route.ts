import { getCurrentMember } from "../../../../actions/auth-actions";
import { ensureSchema, getDb } from "../../../../lib/db";
import { countWords, MAX_SCENE_WORDS } from "../../../../lib/audio-utils";
import { canAccessAudioIdea, loadAudioJob, refreshAudioJobStatus, sha256 } from "../../../../lib/audio-job-server";

export const runtime = "nodejs";
const MAX_MASTER_BYTES = 50 * 1024 * 1024;

async function authorizedJob(id: string) {
  const member = await getCurrentMember();
  if (!member) return { error: Response.json({ error: "Vui lòng đăng nhập." }, { status: 401 }) };
  const sql = getDb();
  await ensureSchema(sql);
  const rows = await sql.query(`SELECT aj.*,i.assigned_to_email,i.submitted_by_email FROM audio_jobs aj JOIN ideas i ON i.id=aj.idea_id WHERE aj.id=$1 LIMIT 1`, [id]);
  if (!rows.length) return { error: Response.json({ error: "Không tìm thấy job âm thanh." }, { status: 404 }) };
  if (!canAccessAudioIdea(member, rows[0])) return { error: Response.json({ error: "Bạn không có quyền mở job này." }, { status: 403 }) };
  return { member, sql, job: rows[0] as Record<string, unknown> };
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await authorizedJob(id);
  if (result.error) return result.error;
  const loaded = await loadAudioJob(result.sql, id);
  return Response.json({ job: loaded?.value }, { headers: { "Cache-Control": "private, no-store" } });
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await authorizedJob(id);
  if (result.error) return result.error;
  try {
    const body = await request.json() as { segments?: Array<{ id?: unknown; text?: unknown }> };
    if (!Array.isArray(body.segments) || !body.segments.length || body.segments.length > 100) return Response.json({ error: "Danh sách đoạn không hợp lệ." }, { status: 400 });
    const current = await result.sql.query(`SELECT id,text,status FROM audio_segments WHERE job_id=$1`, [id]);
    const byId = new Map(current.map((row: Record<string, unknown>) => [String(row.id), row]));
    for (const item of body.segments) {
      const segmentId = typeof item.id === "string" ? item.id : "";
      const text = typeof item.text === "string" ? item.text.trim() : "";
      const previous = byId.get(segmentId);
      if (!previous || !text || text.length > 10_000 || countWords(text) > MAX_SCENE_WORDS) return Response.json({ error: "Một đoạn không hợp lệ hoặc vượt quá 150 từ." }, { status: 400 });
      if (previous.status === "PROCESSING") return Response.json({ error: "Có đoạn đang được tạo. Hãy chờ hoàn tất rồi sửa." }, { status: 409 });
      if (text !== previous.text) {
        await result.sql.query(`UPDATE audio_segments SET text=$1,text_fingerprint=$2,status='IDLE',error=NULL,audio_data=NULL,mime_type=NULL,updated_at=NOW() WHERE id=$3 AND job_id=$4`, [text, sha256(text), segmentId, id]);
      }
    }
    await result.sql.query(`UPDATE audio_jobs SET master_audio=NULL,master_mime_type=NULL,updated_at=NOW() WHERE id=$1`, [id]);
    await refreshAudioJobStatus(result.sql, id);
    const loaded = await loadAudioJob(result.sql, id);
    return Response.json({ job: loaded?.value });
  } catch (error) {
    return Response.json({ error: error instanceof SyntaxError ? "Dữ liệu không hợp lệ." : "Không cập nhật được job." }, { status: error instanceof SyntaxError ? 400 : 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const result = await authorizedJob(id);
  if (result.error) return result.error;
  const mimeType = request.headers.get("content-type")?.split(";")[0] || "";
  if (!mimeType.startsWith("audio/") || !request.body) return Response.json({ error: "File master phải là audio." }, { status: 400 });
  if (Number(request.headers.get("content-length")) > MAX_MASTER_BYTES) return Response.json({ error: "File master vượt quá 50 MB." }, { status: 413 });
  const incomplete = await result.sql.query(`SELECT COUNT(*)::int AS count FROM audio_segments WHERE job_id=$1 AND status<>'COMPLETE'`, [id]);
  if (Number(incomplete[0]?.count || 0) > 0) return Response.json({ error: "Chỉ lưu file master khi tất cả đoạn đã hoàn thành." }, { status: 409 });
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_MASTER_BYTES) return Response.json({ error: "File master rỗng hoặc quá lớn." }, { status: 413 });
  await result.sql.query(`UPDATE audio_jobs SET master_audio=$1,master_mime_type=$2,updated_at=NOW() WHERE id=$3`, [Buffer.from(bytes), mimeType, id]);
  return Response.json({ masterUrl: `/api/audio-jobs/${id}/master` });
}

