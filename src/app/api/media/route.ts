import { getCurrentMember } from "../../../actions/auth-actions";
import { getDb } from "../../../lib/db";
import { createWriteStream } from "node:fs";
import { mkdir, rename, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { randomUUID } from "node:crypto";
export const runtime="nodejs";
export const maxDuration=300;
const MAX_BYTES=250*1024*1024;
export async function POST(request: Request) {
  const member=await getCurrentMember();
  if(!member || !["Core","E"].includes(member.role)) return Response.json({error:"Chỉ Editor/Core được tải bản final để đăng."},{status:403});
  if(!process.env.MEDIA_UPLOAD_DIR) return Response.json({error:"Máy chủ chưa cấu hình kho video (MEDIA_UPLOAD_DIR). Bạn vẫn có thể dùng link Drive hoặc kho lưu trữ hiện có."},{status:503});
  const ideaId=new URL(request.url).searchParams.get("ideaId");
  const mime=request.headers.get("content-type")?.split(";")[0];
  const ext=mime==="video/mp4"?"mp4":mime==="video/webm"?"webm":mime==="video/quicktime"?"mov":null;
  if(!ideaId || !ext || !request.body) return Response.json({error:"Chọn video MP4, WebM hoặc MOV và một công việc."},{status:400});
  if(Number(request.headers.get("content-length"))>MAX_BYTES) return Response.json({error:"Video vượt quá 250 MB. Dùng link lưu trữ cho file lớn hơn."},{status:413});
  const sql=getDb();
  const rows=await sql.query(`SELECT id FROM ideas WHERE id=$1 AND active_gate='GATE_5_CORE' AND gate5_approved_at IS NULL`,[ideaId]);
  if(!rows.length) return Response.json({error:"Chỉ được tải bản final trước khi Core duyệt chốt. Bản đã duyệt phải quay lại QC để thay phiên bản."},{status:409});
  const folder=resolve(process.env.MEDIA_UPLOAD_DIR), name=`${randomUUID()}.${ext}`;
  const partial=join(folder,`${name}.part`), destination=join(folder,name);
  let bytes=0, signature=Buffer.alloc(0);
  try {
    await mkdir(folder,{recursive:true});
    const guard=new Transform({transform(chunk:Buffer,_encoding,callback) {
      bytes+=chunk.length;
      if(signature.length<16) signature=Buffer.concat([signature,chunk.subarray(0,16-signature.length)]);
      if(bytes>MAX_BYTES) callback(new Error("SIZE_LIMIT")); else callback(null,chunk);
    }});
    await pipeline(Readable.fromWeb(request.body as Parameters<typeof Readable.fromWeb>[0]),guard,createWriteStream(partial,{flags:"wx"}),{signal:request.signal});
    if(bytes<16 || (ext==="webm" ? signature.subarray(0,4).toString("hex")!=="1a45dfa3" : signature.subarray(4,8).toString()!=="ftyp")) throw new Error("INVALID_VIDEO");
    await rename(partial,destination);
    const url=`/api/media/${name}`;
    const updated=await sql.query(`UPDATE ideas SET video_final_link=$1 WHERE id=$2 AND active_gate='GATE_5_CORE' AND gate5_approved_at IS NULL RETURNING id`,[url,ideaId]);
    if(!updated.length) throw new Error("STATE_CHANGED");
    return Response.json({url,name,bytes});
  } catch(e) {
    await Promise.allSettled([rm(partial,{force:true}),rm(destination,{force:true})]);
    const code=e instanceof Error?e.message:"";
    return Response.json({error:code==="SIZE_LIMIT"?"Video vượt quá 250 MB.":code==="INVALID_VIDEO"?"File không đúng định dạng video đã chọn.":code==="STATE_CHANGED"?"Công việc đã đổi trạng thái. Hãy tải lại.":"Tải video thất bại. Kiểm tra kho lưu trữ hoặc dùng link video."},{status:code==="SIZE_LIMIT"?413:400});
  }
}
