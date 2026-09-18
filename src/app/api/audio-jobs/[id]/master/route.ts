import { getCurrentMember } from "../../../../../actions/auth-actions";
import { ensureSchema, getDb } from "../../../../../lib/db";
import { canAccessAudioIdea } from "../../../../../lib/audio-job-server";

export const runtime = "nodejs";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const member = await getCurrentMember();
  if (!member) return new Response("Vui lòng đăng nhập", { status: 401 });
  const { id } = await params;
  const sql = getDb();
  await ensureSchema(sql);
  const rows = await sql.query(`SELECT aj.master_audio,aj.master_mime_type,i.assigned_to_email,i.submitted_by_email FROM audio_jobs aj JOIN ideas i ON i.id=aj.idea_id WHERE aj.id=$1 LIMIT 1`, [id]);
  if (!rows.length || !rows[0].master_audio) return new Response("Không tìm thấy file", { status: 404 });
  if (!canAccessAudioIdea(member, rows[0])) return new Response("Không có quyền", { status: 403 });
  const bytes = rows[0].master_audio instanceof Uint8Array ? rows[0].master_audio : Buffer.from(rows[0].master_audio);
  return new Response(Uint8Array.from(bytes).buffer, { headers: { "Content-Type": rows[0].master_mime_type || "audio/wav", "Content-Length": String(bytes.byteLength), "Cache-Control": "private, no-store", "Content-Disposition": `attachment; filename="${id}_MASTER.wav"` } });
}
