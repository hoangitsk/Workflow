"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, FileText, Save } from "lucide-react";
import { submitIdeaAction } from "../../actions/idea-actions";
import { useLocalDraft } from "../../lib/use-local-draft";
import type { ChannelGroup, Platform, PlatformChannel, PitchingBatch } from "../../lib/types";

const emptyDraft = { title: "", platformChannelId: "", pitchingBatchId: "", contentPillar: "", insight: "", hook: "", problem: "", angle: "", point1: "", point2: "", point3: "", value: "", cta: "", references: "" };
export default function IdeaComposer({ memberId, channels, platforms, platformChannels, batches, onDone }: {
  memberId: string; channels: ChannelGroup[]; platforms: Platform[]; platformChannels: PlatformChannel[]; batches: PitchingBatch[]; onDone: (title: string) => void;
}) {
  const draft = useLocalDraft(`ynda:idea:v1:${memberId}`, emptyDraft);
  const d = draft.value;
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const selectedPc = platformChannels.find(p => p.id === d.platformChannelId);
  const selectedChannel = channels.find(c => c.id === selectedPc?.channelGroupId);
  const choices = platformChannels.filter(p => channels.some(c => c.id === p.channelGroupId && !c.archived));
  const description = [d.insight && `Insight: ${d.insight}`, d.problem && `Vấn đề khai thác: ${d.problem}`, [d.point1,d.point2,d.point3].filter(Boolean).map((p,i) => `${i+1}. ${p}`).join("\n"), d.cta && `CTA: ${d.cta}`].filter(Boolean).join("\n\n");
  const completed = [d.title, d.platformChannelId, d.insight, d.hook, d.angle, d.point1, d.value].filter(s => s.trim()).length;
  function field(name: keyof typeof d, title: string, hint: string, multiline = true) {
    return <label className="form-field" key={name}><span>{title}</span>{multiline ? <textarea value={d[name]} onChange={e => draft.update({[name]: e.target.value})} rows={3} maxLength={6000} placeholder={hint}/> : <input value={d[name]} onChange={e => draft.update({[name]: e.target.value})} maxLength={250} placeholder={hint}/>}</label>;
  }
  async function submit() {
    setError("");
    if (completed < 7) { setError("Điền tên, kênh, insight, hook, góc nhìn, ít nhất một luận điểm và giá trị người xem nhận được."); return; }
    setBusy(true);
    try {
      await submitIdeaAction(d.title, description, d.platformChannelId, d.hook, JSON.stringify(d.references.split("\n").map(url => url.trim()).filter(Boolean).map(url => ({url}))), d.angle, d.value, d.contentPillar, d.pitchingBatchId);
      draft.clear(); router.refresh(); onDone(d.title);
    } catch (err) { setError(err instanceof Error ? err.message : "Chưa nộp được idea. Bản nháp vẫn được giữ lại."); }
    finally { setBusy(false); }
  }
  return <div className="workbench idea-composer"><div className="draft-bar"><span role="status"><Save size={14}/> {draft.notice}</span><label><input type="checkbox" checked={draft.autoSave} onChange={e => {draft.setAutoSave(e.target.checked); if(e.target.checked) draft.save();}}/> Tự lưu</label></div>
    <div className="composer-tabs" role="tablist" aria-label="Các bước viết idea">{["Chọn hướng", "Phát triển ý", "Xem & nộp"].map((label,i) => <button key={label} role="tab" aria-selected={step === i} onClick={() => setStep(i)}><span>{i+1}</span>{label}</button>)}</div>
    <fieldset disabled={!draft.ready || busy} className="composer-body">
    {step === 0 && <div className="form-stack"><div><h2>Bắt đầu từ một câu hỏi hay</h2><p className="muted">Chọn người xem và điều bạn muốn họ hiểu sau video.</p></div>
      <div className="form-grid"><label className="form-field"><span>Kênh & nền tảng *</span><select value={d.platformChannelId} onChange={e => draft.update({platformChannelId:e.target.value, pitchingBatchId:""})}><option value="">Chọn nơi video sẽ xuất hiện</option>{choices.map(pc => <option key={pc.id} value={pc.id}>{channels.find(c => c.id === pc.channelGroupId)?.name} · {platforms.find(p => p.id === pc.platformId)?.name}</option>)}</select></label><label className="form-field"><span>Đợt pitching</span><select value={d.pitchingBatchId} onChange={e => draft.update({pitchingBatchId:e.target.value})}><option value="">Idea tự đề xuất</option>{batches.filter(b => b.status === "OPEN" && (!b.channelGroupId || b.channelGroupId === selectedPc?.channelGroupId)).map(b => <option key={b.id} value={b.id}>{b.title} · {b.deadline}</option>)}</select></label></div>
      {selectedChannel?.description && <div className="example-box"><strong>Định hướng {selectedChannel.name}</strong><p>{selectedChannel.description}</p></div>}
      {d.pitchingBatchId && <div className="example-box"><strong>Đề bài</strong><p>{batches.find(b => b.id === d.pitchingBatchId)?.description}</p></div>}
      {field("title","Tên idea *","Ví dụ: Vì sao ta đồng cảm với phản diện?",false)}
      {field("contentPillar","Tuyến nội dung","Ví dụ: Phân tích nhân vật / News / Branding",false)}
      {field("insight","Người xem đang quan tâm điều gì? *","Một thắc mắc, cảm xúc hoặc hiểu lầm cụ thể của khán giả.")}
      {field("hook","Câu mở đầu dự kiến *","Viết câu bạn muốn người xem nghe trong những giây đầu.")}
    </div>}
    {step === 1 && <div className="form-stack"><div><h2>Biến góc nhìn thành nội dung</h2><p className="muted">Viết ý chính trước. Chưa cần một kịch bản hoàn chỉnh.</p></div>{field("problem","Vấn đề muốn khai thác","Bạn muốn giải thích điều gì, trong phạm vi nào?")}{field("angle","Góc nhìn riêng *","Bạn sẽ kể khác những video cùng chủ đề như thế nào?")}
      <div className="example-box"><strong>Ba luận điểm để triển khai</strong><p className="muted">Mỗi ý nên đi kèm một cảnh phim, ví dụ hoặc nguồn có thể kiểm tra.</p></div>
      {field("point1","Luận điểm 1 *","Ý chính + ví dụ chứng minh")}{field("point2","Luận điểm 2","Ý tiếp theo phát triển từ luận điểm trước")}{field("point3","Luận điểm 3","Ý chốt dẫn đến thông điệp của video")}{field("value","Người xem nhận được gì? *","Một hiểu biết, cách nhìn hoặc hành động cụ thể.")}{field("cta","CTA / câu hỏi cuối","Bạn muốn họ thảo luận, xem tiếp hay tham gia điều gì?")}{field("references","Footage & tài liệu tham khảo","Mỗi dòng một đường dẫn https://")}
    </div>}
    {step === 2 && <div className="idea-preview"><span className="eyebrow"><FileText size={14}/> BẢN XEM TRƯỚC</span><h2>{d.title || "Idea chưa có tên"}</h2><p className="muted">{selectedChannel?.name || "Chưa chọn kênh"} · {d.contentPillar || "Chưa chọn tuyến"}</p><blockquote>{d.hook || "Chưa có câu mở đầu"}</blockquote><h3>Góc nhìn</h3><p>{d.angle || "Chưa điền"}</p><h3>Nội dung triển khai</h3><p className="preserve-lines">{description || "Chưa có nội dung"}</p><h3>Giá trị người xem nhận được</h3><p>{d.value || "Chưa điền"}</p><h3>Reference</h3><p className="preserve-lines">{d.references || "Chưa đính kèm"}</p><div className="handoff"><Check size={16}/> {completed}/7 phần chính đã điền. Idea sẽ chuyển đến Editor/Core để duyệt.</div></div>}
    </fieldset>
    {error && <p role="alert" className="form-error">{error}</p>}
    <footer className="composer-footer"><button type="button" className="secondary-button" onClick={() => draft.save()} disabled={!draft.ready || busy}>Lưu nháp</button><div className="button-row">{step > 0 && <button className="secondary-button" onClick={() => setStep(step-1)} disabled={busy}>Quay lại</button>}{step < 2 ? <button className="primary-button" onClick={() => setStep(step+1)} disabled={!draft.ready}>Tiếp tục <ArrowRight size={16}/></button> : <button className="primary-button" onClick={submit} disabled={busy || !draft.ready}>{busy ? "Đang nộp…" : "Nộp idea"}</button>}</div></footer>
  </div>;
}
