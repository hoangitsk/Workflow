import { getCurrentMember } from "../../../../actions/auth-actions";
import { getDb } from "../../../../lib/db";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Readable } from "node:stream";
export const runtime="nodejs";
export async function GET(request: Request, {params}:{params:Promise<{name:string}>}) {
  if(!await getCurrentMember()) return new Response("Vui lòng đăng nhập",{status:401});
  const {name}=await params;
  if(!/^[a-f0-9-]{36}\.(mp4|webm|mov)$/.test(name) || !process.env.MEDIA_UPLOAD_DIR) return new Response("Không tìm thấy file",{status:404});
  const sql=getDb();
  const rows=await sql.query(`SELECT id FROM ideas WHERE video_final_link=$1 LIMIT 1`,[`/api/media/${name}`]);
  if(!rows.length) return new Response("Không tìm thấy file",{status:404});
  try {
    const path=join(resolve(process.env.MEDIA_UPLOAD_DIR),name), info=await stat(path);
    let start=0,end=info.size-1;
    const range=request.headers.get("range");
    if(range) {
      const match=/^bytes=(\d*)-(\d*)$/.exec(range);
      if(!match || (!match[1]&&!match[2])) return new Response(null,{status:416,headers:{"Content-Range":`bytes */${info.size}`}});
      if(!match[1]) start=Math.max(0,info.size-Number(match[2]));
      else {start=Number(match[1]); if(match[2]) end=Math.min(end,Number(match[2]));}
      if(start>end || start>=info.size) return new Response(null,{status:416,headers:{"Content-Range":`bytes */${info.size}`}});
    }
    return new Response(Readable.toWeb(createReadStream(path,{start,end})) as ReadableStream,{status:range?206:200,headers:{"Content-Type":name.endsWith("webm")?"video/webm":name.endsWith("mov")?"video/quicktime":"video/mp4","Content-Length":String(end-start+1),"Accept-Ranges":"bytes","Cache-Control":"private, no-store","Content-Disposition":`inline; filename="${name}"`,...(range?{"Content-Range":`bytes ${start}-${end}/${info.size}`}:{})}});
  } catch {return new Response("Không tìm thấy file",{status:404});}
}
