"use client";
import { useEffect, useRef, useState } from "react";
import { Download, History, Mic2, RefreshCw, Scissors, Search } from "lucide-react";
import type { Idea, PlatformChannel } from "../../lib/types";
import type { Voice } from "../../lib/voice-config";
import { audioBufferToWav, countWords, splitScript } from "../../lib/audio-utils";
import { useLocalDraft } from "../../lib/use-local-draft";

type Scene = { id: string; text: string; audioUrl?: string; status: "IDLE" | "PROCESSING" | "COMPLETE" | "ERROR"; error?: string; attempts?: number };
type AudioJob = {
  id: string; ideaId: string; episode: string; voiceId: string; voiceName: string; provider: string; modelVersion: string;
  speed: number; status: string; totalSegments: number; completedSegments: number; masterUrl?: string; updatedAt: string; segments: Scene[];
};

export default function AudioStudio({ memberId, ideas, platformChannels }: { memberId: string; ideas: Idea[]; platformChannels: PlatformChannel[] }) {
  const draft = useLocalDraft(`ynda:audio:v2:${memberId}`, { script:"", episode:"EP01", voiceId:"", speed:"1", ideaId:"" });
  const [voices,setVoices] = useState<Voice[]>([]);
  const [provider,setProvider] = useState("");
  const [modelVersion,setModelVersion] = useState("");
  const [configured,setConfigured] = useState(false);
  const [checking,setChecking] = useState(false);
  const [query,setQuery] = useState("");
  const [scenes,setScenes] = useState<Scene[]>([]);
  const [job,setJob] = useState<AudioJob | null>(null);
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const controller = useRef<AbortController | null>(null);
  const d = draft.value;
  const approvedIdeas = ideas.filter(i => (i.scriptStatus === "APPROVED" || i.scriptData?.status === "APPROVED") && i.scriptData?.segments.length);
  const selectedIdea = ideas.find(i => i.id === d.ideaId);
  const selectedPlatformChannel = platformChannels.find(item => item.id === selectedIdea?.platformChannelId);
  const channelVoices = voices.filter(voice => !voice.channelGroupId || voice.channelGroupId === selectedPlatformChannel?.channelGroupId);

  function applyJob(value: AudioJob) {
    setJob(value);
    setScenes(value.segments);
    draft.update({ ideaId:value.ideaId, episode:value.episode, voiceId:value.voiceId, speed:String(value.speed), script:value.segments.map(segment => segment.text).join("\n\n") });
  }

  async function loadVoices() {
    setChecking(true);
    try {
      const res=await fetch("/api/voice",{cache:"no-store"});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error);
      setVoices(data.voices || []); setConfigured(!!data.configured); setProvider(data.provider || ""); setModelVersion(data.modelVersion || "");
      setMessage(data.configured ? "Dịch vụ sẵn sàng. Mỗi lần tạo sẽ được lưu vào job để có thể tiếp tục sau khi tải lại." : "Chưa kết nối dịch vụ giọng đọc. Bạn vẫn có thể chọn script và chuẩn bị các đoạn; quản trị viên cần cấu hình provider và danh sách giọng.");
    } catch(e) { setConfigured(false); setMessage(e instanceof Error?e.message:"Không tải được giọng đọc."); }
    finally { setChecking(false); }
  }

  async function loadLatestJob(ideaId: string) {
    setChecking(true); setMessage("");
    try {
      const res=await fetch(`/api/audio-jobs?ideaId=${encodeURIComponent(ideaId)}`,{cache:"no-store"});
      const data=await res.json();
      if(!res.ok) throw new Error(data.error);
      if(data.jobs?.length) { applyJob(data.jobs[0]); setMessage("Đã khôi phục job âm thanh gần nhất của công việc này."); return; }
      const idea=ideas.find(item=>item.id===ideaId);
      if(idea) {
        const script=idea.scriptData?.segments.map(segment=>segment.voiceAiText).filter(Boolean).join("\n\n") || "";
        const preferred=voices.find(voice=>voice.channelGroupId===platformChannels.find(item=>item.id===idea.platformChannelId)?.channelGroupId) || voices.find(voice=>!voice.channelGroupId) || voices[0];
        setJob(null);setScenes([]);draft.update({ideaId,script,episode:idea.scriptData?.episodeName || idea.title,voiceId:preferred?.id || d.voiceId});
        setMessage("Chưa có job đã lưu. Kiểm tra lời đọc rồi chia phân cảnh để bắt đầu.");
      }
    } catch(e) {setMessage(e instanceof Error?e.message:"Không tải được lịch sử âm thanh.");}
    finally {setChecking(false);}
  }

  useEffect(() => { void loadVoices(); return () => controller.current?.abort(); },[]);

  function invalidate() {
    setJob(null);
    setScenes(prev => prev.map(scene => ({id:crypto.randomUUID(),text:scene.text,status:"IDLE"})));
  }

  function split() {
    if(scenes.length && !window.confirm("Chia lại sẽ tạo một job phiên bản mới và không dùng lại âm thanh cũ. Tiếp tục?")) return;
    setJob(null);
    setScenes(splitScript(d.script).map(text => ({id:crypto.randomUUID(),text,status:"IDLE"})));
    setMessage("Đã chia lời đọc. Kiểm tra từng đoạn trước khi tạo âm thanh.");
  }

  async function ensureJob(): Promise<AudioJob> {
    if(!d.ideaId) throw new Error("Hãy chọn một công việc có kịch bản đã duyệt.");
    if(!d.voiceId) throw new Error("Hãy chọn giọng đọc.");
    if(!scenes.length) throw new Error("Hãy chia lời đọc thành phân cảnh.");
    if(job) {
      const res=await fetch(`/api/audio-jobs/${job.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({segments:scenes.map(scene=>({id:scene.id,text:scene.text}))})});
      const data=await res.json();if(!res.ok)throw new Error(data.error);applyJob(data.job);return data.job;
    }
    const res=await fetch("/api/audio-jobs",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ideaId:d.ideaId,episode:d.episode,voiceId:d.voiceId,speed:Number(d.speed),segments:scenes.map(scene=>scene.text)})});
    const data=await res.json();if(!res.ok)throw new Error(data.error);applyJob(data.job);return data.job;
  }

  async function generateSegment(activeJob: AudioJob, segment: Scene, signal: AbortSignal) {
    setScenes(prev=>prev.map(item=>item.id===segment.id?{...item,status:"PROCESSING",error:undefined}:item));
    try {
      const res=await fetch(`/api/audio-jobs/${activeJob.id}/segments/${segment.id}`,{method:"POST",signal});
      const data=await res.json(); if(!res.ok) throw new Error(data.error);
      applyJob(data.job);
    } catch(e) {
      if(!signal.aborted) setScenes(prev=>prev.map(item=>item.id===segment.id?{...item,status:"ERROR",error:e instanceof Error?e.message:"Tạo âm thanh thất bại."}:item));
    }
  }

  async function run(targetId?: string) {
    if(busy) return;
    setBusy(true);setMessage("");const abort=new AbortController();controller.current=abort;
    try {
      const targetPosition=targetId ? scenes.findIndex(segment=>segment.id===targetId) : -1;
      let current=await ensureJob();
      const targets=current.segments.filter((_segment,index)=>targetId ? index===targetPosition : current.segments[index].status!=="COMPLETE");
      for(const segment of targets) {
        if(abort.signal.aborted) break;
        await generateSegment(current,segment,abort.signal);
        const refreshed=await fetch(`/api/audio-jobs/${current.id}`,{cache:"no-store"});
        if(refreshed.ok) {current=(await refreshed.json()).job;applyJob(current);}
      }
      setMessage(abort.signal.aborted?"Đã dừng tạo âm thanh.":"Đã xử lý xong danh sách đoạn. Hãy nghe kiểm tra trước khi ghép master.");
    } catch(e) {setMessage(e instanceof Error?e.message:"Không tạo được job âm thanh.");}
    finally {setBusy(false);controller.current=null;}
  }

  async function merge() {
    if(!job) return;
    setBusy(true);setMessage("");const context=new AudioContext({sampleRate:44100});
    try {
      const buffers=[];
      for(const scene of scenes) { const response=await fetch(scene.audioUrl!,{cache:"no-store"});if(!response.ok)throw new Error();buffers.push(await context.decodeAudioData(await response.arrayBuffer())); }
      const channels=Math.max(...buffers.map(buffer=>buffer.numberOfChannels));
      const merged=context.createBuffer(channels,buffers.reduce((total,buffer)=>total+buffer.length,0),context.sampleRate);
      let offset=0;
      for(const buffer of buffers) { for(let channel=0;channel<channels;channel+=1) merged.getChannelData(channel).set(buffer.getChannelData(Math.min(channel,buffer.numberOfChannels-1)),offset); offset+=buffer.length; }
      const blob=audioBufferToWav(merged);
      const saved=await fetch(`/api/audio-jobs/${job.id}`,{method:"PUT",headers:{"Content-Type":"audio/wav"},body:blob});
      const data=await saved.json();if(!saved.ok)throw new Error(data.error);
      const url=URL.createObjectURL(blob);const link=document.createElement("a");link.href=url;link.download=`${filename}_FULL_VO_V01.wav`;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
      setJob(previous=>previous?{...previous,masterUrl:data.masterUrl}:previous);setMessage("Đã ghép, lưu master vào job và tải WAV về máy.");
    } catch {setMessage("Không ghép hoặc lưu được file master. Hãy kiểm tra từng đoạn rồi thử lại.");}
    finally {await context.close();setBusy(false);}
  }

  const filename=d.episode.replace(/[^\p{L}\p{N}_-]/gu,"_") || "Episode";
  const selectedVoice=voices.find(voice=>voice.id===d.voiceId);
  const ready=configured && !!selectedVoice && !!d.ideaId;
  const complete=scenes.filter(scene=>scene.status==="COMPLETE").length;
  const statusLabel:Record<string,string>={DRAFT:"Bản nháp",PROCESSING:"Đang tạo",PARTIAL:"Có đoạn lỗi",FAILED:"Thất bại",COMPLETE:"Hoàn tất"};

  return <div className="workbench"><header className="page-heading"><div><span className="eyebrow">SẢN XUẤT / VOICE</span><h1>Phòng âm thanh</h1><p>Tạo voice từ script đã duyệt, lưu từng đoạn và tiếp tục được sau khi tải lại.</p></div></header>
    <div className="audio-layout"><aside className="paper voice-sidebar"><h2><Mic2 size={19}/> Voice profile</h2><label className="search-field"><Search size={16}/><input aria-label="Tìm giọng đọc" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Tìm tên giọng, kênh…"/></label><div className="voice-list">{channelVoices.filter(voice=>`${voice.name} ${voice.description || ""} ${voice.channelGroupId || ""}`.toLocaleLowerCase().includes(query.toLocaleLowerCase())).map(voice=><button disabled={busy || !draft.ready} key={voice.id} className={voice.id===d.voiceId?"selected":""} onClick={()=>{if(voice.id!==d.voiceId){draft.update({voiceId:voice.id});invalidate();}}}><strong>{voice.name}</strong><small>{voice.description || voice.channelGroupId || "Giọng đọc dự án"}</small></button>)}</div>{!voices.length&&<p className="muted">Chưa có giọng nào được cấu hình.</p>}<button className="secondary-button" onClick={loadVoices} disabled={checking||busy}><RefreshCw size={15}/>{checking?"Đang kiểm tra…":"Kiểm tra kết nối"}</button><div className="provider-state"><span>Provider</span><strong>{provider||"Chưa cấu hình"}</strong><small>Model: {modelVersion||"—"}</small></div><label className="form-field"><span>Tốc độ đọc · {d.speed}×</span><input type="range" aria-label="Tốc độ đọc" min="0.75" max="1.25" step="0.05" value={d.speed} disabled={busy} onChange={e=>{draft.update({speed:e.target.value});invalidate();}}/></label><p className="muted">Đổi voice hoặc tốc độ sẽ tạo job phiên bản mới, không ghi đè bản cũ.</p></aside>
    <div className="form-stack"><section className="paper form-stack"><div className="section-heading"><h2>01 · Chọn script đã duyệt</h2><span className="muted">{countWords(d.script)} từ</span></div><div className="form-grid"><label className="form-field"><span>Công việc</span><select value={d.ideaId} disabled={busy||checking} onChange={e=>{const ideaId=e.target.value;if(!ideaId){draft.update({ideaId:""});setJob(null);setScenes([]);return;}void loadLatestJob(ideaId);}}><option value="">Chọn công việc</option>{approvedIdeas.map(idea=><option key={idea.id} value={idea.id}>{idea.title}</option>)}</select></label><label className="form-field"><span>Mã tập / tên file</span><input value={d.episode} onChange={e=>draft.update({episode:e.target.value})} disabled={busy||!draft.ready}/></label></div><label className="form-field"><span>Lời đọc từ final script</span><textarea rows={8} value={d.script} disabled={busy||!draft.ready||!!job} onChange={e=>draft.update({script:e.target.value})} placeholder="Chọn một công việc có script đã duyệt."/></label><div className="section-heading"><small role="status" className="muted">{draft.notice}</small><button className="primary-button" disabled={busy||!d.ideaId||!d.script.trim()} onClick={split}><Scissors size={16}/> Chia phân cảnh</button></div></section>
    {message&&<p role="status" className="notice-box">{message}</p>}
    {job&&<section className="paper job-summary"><div><span className="eyebrow"><History size={13}/> JOB ĐÃ LƯU</span><h3>{statusLabel[job.status]||job.status}</h3></div><div><strong>{job.completedSegments}/{job.totalSegments}</strong><small>đoạn hoàn tất</small></div><div><strong>{job.voiceName}</strong><small>{job.provider} · {job.modelVersion}</small></div>{job.masterUrl&&<a className="secondary-button" href={job.masterUrl}><Download size={15}/> Tải master đã lưu</a>}</section>}
    <section className="form-stack"><div className="section-heading"><h2>02 · Nghe & kiểm tra từng đoạn</h2><span className="muted">{complete}/{scenes.length} đã tạo</span></div>{!scenes.length&&<div className="paper empty-state"><Mic2 size={26}/><h3>Chưa có phân cảnh</h3><p>Chọn script đã duyệt và chia phân cảnh để bắt đầu.</p></div>}{scenes.map((scene,index)=><article key={scene.id} className="paper scene-card"><div className="section-heading"><h3>Đoạn {String(index+1).padStart(2,"0")}</h3><span className={countWords(scene.text)>150?"form-error":"muted"}>{countWords(scene.text)}/150 từ · {scene.status==="COMPLETE"?"Đã lưu":scene.status==="PROCESSING"?"Đang tạo":scene.status==="ERROR"?"Có lỗi":"Chưa tạo"}</span></div><textarea aria-label={`Lời đọc đoạn ${index+1}`} rows={3} value={scene.text} disabled={busy} onChange={e=>{setScenes(prev=>prev.map(item=>item.id===scene.id?{...item,text:e.target.value,status:"IDLE",audioUrl:undefined,error:undefined}:item));}}/>{scene.error&&<p className="form-error" role="alert">{scene.error}</p>}<div className="scene-actions">{scene.audioUrl&&<><audio controls src={`${scene.audioUrl}?v=${scene.attempts||0}`} preload="metadata"/><a className="secondary-button" href={scene.audioUrl} download={`${filename}_${String(index+1).padStart(2,"0")}_VO_V01.wav`}><Download size={15}/> Tải đoạn</a></>}<button className="secondary-button" disabled={busy||!ready||!scene.text.trim()||countWords(scene.text)>150} onClick={()=>void run(scene.id)}>{scene.status==="PROCESSING"?"Đang tạo…":scene.audioUrl?"Tạo lại":"Tạo giọng đọc"}</button></div></article>)}</section>
    {scenes.length>0&&<footer className="paper section-heading"><p className="muted">{selectedVoice?.name||"Chọn voice profile"} · {complete}/{scenes.length} đoạn đã lưu</p><div className="button-row">{busy&&<button className="secondary-button" onClick={()=>controller.current?.abort()}>Dừng sau đoạn này</button>}<button className="secondary-button" disabled={busy||complete!==scenes.length||!job} onClick={merge}><Download size={16}/> Ghép, lưu & tải WAV</button><button className="primary-button" disabled={busy||!ready||complete===scenes.length||scenes.some(scene=>!scene.text.trim()||countWords(scene.text)>150)} onClick={()=>void run()}>{busy?"Đang xử lý…":"Tạo các đoạn còn lại"}</button></div></footer>}</div></div></div>;
}
