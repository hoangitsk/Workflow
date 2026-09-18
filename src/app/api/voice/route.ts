import { getCurrentMember } from "../../../actions/auth-actions";
import { getVoiceConfig } from "../../../lib/voice-config";
import { countWords, MAX_SCENE_WORDS } from "../../../lib/audio-utils";
import { getVoiceProviderState, synthesizeSpeech } from "../../../lib/tts-provider";
import { audioErrorMessage } from "../../../lib/audio-job-server";
export const runtime = "nodejs";
export const maxDuration = 180;

export async function GET() {
  if (!await getCurrentMember()) return Response.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  const voices = getVoiceConfig();
  const provider = getVoiceProviderState();
  return Response.json({ configured: provider.configured && voices.length > 0, voices, provider: provider.provider, modelVersion: provider.modelVersion }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!await getCurrentMember()) return Response.json({ error: "Vui lòng đăng nhập." }, { status: 401 });
  if (!getVoiceProviderState().configured || !getVoiceConfig().length) return Response.json({ error: "Chưa kết nối dịch vụ giọng đọc. Cần cấu hình provider và danh sách giọng trên máy chủ." }, { status: 503 });
  try {
    if (Number(request.headers.get("content-length")) > 20000) return Response.json({error:"Nội dung quá dài."},{status:413});
    const body = await request.json();
    if (typeof body.text !== "string" || !body.text.trim() || body.text.length > 10000 || countWords(body.text) > MAX_SCENE_WORDS) return Response.json({error:"Mỗi đoạn cần có nội dung và tối đa 150 từ / 10.000 ký tự."},{status:400});
    if (!getVoiceConfig().some(v => v.id === body.voiceId)) return Response.json({error:"Giọng đọc không hợp lệ."},{status:400});
    if (typeof body.speed !== "number" || body.speed < 0.75 || body.speed > 1.25) return Response.json({error:"Tốc độ phải từ 0,75 đến 1,25."},{status:400});
    const audio = await synthesizeSpeech(body.text.trim(), body.voiceId, body.speed);
    if (!audio.bytes.length || audio.bytes.length > 15*1024*1024) return Response.json({error:"Dịch vụ trả về file rỗng hoặc quá lớn."},{status:502});
    return new Response(Uint8Array.from(audio.bytes).buffer,{headers:{"Content-Type":audio.mimeType,"Cache-Control":"no-store"}});
  } catch (err) {
    return Response.json({error:err instanceof SyntaxError ? "Dữ liệu yêu cầu không hợp lệ." : audioErrorMessage(err)},{status:err instanceof SyntaxError ? 400 : 502});
  }
}
