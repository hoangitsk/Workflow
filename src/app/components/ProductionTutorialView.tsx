"use client";

import { useState } from "react";
import {
  ArrowRight, BarChart3, CheckCircle2, ChevronRight, Clapperboard,
  FileCheck2, FileText, Lightbulb, Music2, Play, Scissors, Send,
  ShieldCheck, Upload, Users, Video
} from "lucide-react";

type Stage = {
  no: string;
  title: string;
  owner: string;
  ownerTone: string;
  input: string;
  work: string;
  output: string;
  guard: string;
  icon: typeof Lightbulb;
};

const stages: Stage[] = [
  { no: "01", title: "Xây dựng Idea", owner: "Editor · Ban Đào tạo", ownerTone: "bg-blue-100 text-blue-800", input: "Định hướng chủ đề từ Core", work: "Nghiên cứu insight, chọn vấn đề, góc khai thác và kênh phù hợp.", output: "Idea đề xuất / Content Brief", guard: "Chưa đầu tư viết script hoặc dựng video ở bước này.", icon: Lightbulb },
  { no: "02", title: "Chốt & giao Idea", owner: "Editor · Ban Đào tạo", ownerTone: "bg-blue-100 text-blue-800", input: "Idea / Content Brief", work: "Đánh giá định hướng, giá trị, tính khả thi và giao việc cho Producer.", output: "Idea đã chốt", guard: "Chỉ idea được duyệt mới được đi tiếp.", icon: FileCheck2 },
  { no: "03", title: "Nộp Script", owner: "Producer · Ban Dự án", ownerTone: "bg-violet-100 text-violet-800", input: "Idea đã chốt", work: "Viết Hook → Body → Outro → CTA/Loop; điền Voice, Visual, BGM/SFX, subtitle và reference.", output: "Bản nháp Script", guard: "Nộp theo ma trận 4 cột, không chỉ nộp phần lời đọc.", icon: FileText },
  { no: "04", title: "Sửa & duyệt Script", owner: "Editor · Ban Đào tạo", ownerTone: "bg-blue-100 text-blue-800", input: "Bản nháp Script", work: "Kiểm tra logic, tính chính xác, thông điệp, format và khả năng sản xuất.", output: "Script hoàn chỉnh", guard: "Script chưa duyệt không vào Production.", icon: CheckCircle2 },
  { no: "05", title: "Production & Assembly", owner: "Producer · Ban Dự án", ownerTone: "bg-violet-100 text-violet-800", input: "Script duyệt + guideline + reference", work: "Chuẩn bị voice, footage, graphic, subtitle, BGM/SFX rồi lắp ráp bản nháp.", output: "Video nháp 16:9", guard: "Voice và visual được làm song song; không tự đổi định hướng đã chốt.", icon: Clapperboard },
  { no: "06", title: "Nộp video cho Editor", owner: "Producer · Ban Dự án", ownerTone: "bg-violet-100 text-violet-800", input: "Video nháp", work: "Tự đối chiếu script, format, guideline và bàn giao đủ file/source cần thiết.", output: "Gói bàn giao", guard: "Thiếu asset hoặc link source thì chưa nộp.", icon: Send },
  { no: "07", title: "QC & hoàn thiện", owner: "Editor · Ban Đào tạo", ownerTone: "bg-blue-100 text-blue-800", input: "Video bàn giao + Script + Assets", work: "QC và chỉnh trực tiếp: hình, tiếng, nhịp dựng, text, subtitle, layout.", output: "Video hoàn thiện", guard: "Editor xử lý khâu hoàn thiện, tránh vòng lặp trả Producer sửa vụn vặt.", icon: ShieldCheck },
  { no: "08", title: "Core duyệt chốt", owner: "Core + Editor", ownerTone: "bg-amber-100 text-amber-800", input: "Video hoàn thiện", work: "Kiểm tra định hướng kênh và chất lượng tổng thể. Nếu có lỗi, Editor sửa rồi gửi lại.", output: "Video được duyệt cuối", guard: "Chỉ Core được quyết định duyệt đăng.", icon: Users },
  { no: "09", title: "Publish & Analytics", owner: "Publish + Editor/Core", ownerTone: "bg-emerald-100 text-emerald-800", input: "Video được duyệt", work: "Đăng đúng kênh, title, thumbnail, caption, hashtag, CTA; theo dõi retention và tương tác.", output: "Báo cáo + insight", guard: "Insight quay về bước 01 để cải thiện idea tiếp theo.", icon: BarChart3 },
];

const scriptRows = [
  ["00:00–00:15", "Hook / 3Ws", "Câu hỏi What · When · Why", "Title lớn + linh vật + cảnh phim", "Pop-up / Ting + BGM tò mò"],
  ["00:15–01:30", "Luận điểm 1", "Bối cảnh & diễn biến", "Footage + dừng voice 3s chạy thoại gốc", "BGM chuyển trầm"],
  ["01:30–03:00", "Luận điểm 2", "Lăng kính phân tích chính", "Bảng từ khóa + linh vật chỉ dẫn", "BGM đẩy cảm xúc"],
  ["03:00–04:30", "Outro", "Chốt bài học, mẹo ứng dụng", "Summary Card có thể chụp lưu", "BGM dịu xuống"],
  ["04:30–05:00", "CTA & Loop", "Câu hỏi thảo luận, nối mượt về Hook", "Khung CTA + logo + đăng ký", "SFX đăng ký / Ting"],
];

export default function ProductionTutorialView() {
  const [selected, setSelected] = useState(0);
  const [channel, setChannel] = useState<"youtube" | "tiktok">("youtube");
  const active = stages[selected];
  const ActiveIcon = active.icon;

  return (
    <div className="space-y-5 pb-8">
      <section className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-5 sm:p-7 text-white overflow-hidden relative">
        <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full bg-indigo-500/25 blur-3xl" />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold tracking-wider text-indigo-100"><Play size={13} /> TUTORIAL VẬN HÀNH</div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight">Từ một idea đến YouTube, rồi thành TikTok</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Bản mô phỏng dùng để onboarding: bấm vào từng bước để biết ai làm, cần nhận gì, phải làm gì và bàn giao đầu ra nào.</p>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 saas-shadow">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div><h2 className="font-bold text-slate-900">1. Sơ đồ vận hành tổng thể</h2><p className="text-xs text-slate-500 mt-1">Mỗi ô là một cổng bàn giao. Không bỏ qua cổng kiểm duyệt.</p></div>
          <div className="flex gap-2 text-[10px] font-bold"><span className="rounded-full bg-blue-100 px-2 py-1 text-blue-800">EDITOR</span><span className="rounded-full bg-violet-100 px-2 py-1 text-violet-800">PRODUCER</span><span className="rounded-full bg-amber-100 px-2 py-1 text-amber-800">CORE</span></div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            return <div key={stage.no} className="flex items-center gap-2 shrink-0">
              <button onClick={() => setSelected(index)} className={`w-32 min-h-28 rounded-xl border p-3 text-left transition-all ${selected === index ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-100" : "border-slate-200 hover:border-slate-400 hover:bg-slate-50"}`}>
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400"><span>{stage.no}</span><Icon size={15} className="text-slate-600" /></div>
                <div className="mt-2 text-xs font-bold leading-4 text-slate-900">{stage.title}</div>
                <div className={`mt-2 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold ${stage.ownerTone}`}>{stage.owner.split(" · ")[0]}</div>
              </button>
              {index < stages.length - 1 && <ChevronRight size={16} className="text-slate-300 shrink-0" />}
            </div>;
          })}
        </div>
        <div className="mt-3 grid gap-3 rounded-xl border border-indigo-100 bg-indigo-50/60 p-4 sm:grid-cols-[auto_1fr_1fr_1fr]">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white"><ActiveIcon size={18} /></div>
          <div><div className="text-[10px] font-bold tracking-wider text-slate-500">NHẬN VÀO</div><p className="mt-1 text-xs font-semibold text-slate-800">{active.input}</p></div>
          <div><div className="text-[10px] font-bold tracking-wider text-slate-500">THỰC HIỆN</div><p className="mt-1 text-xs leading-5 text-slate-700">{active.work}</p></div>
          <div><div className="text-[10px] font-bold tracking-wider text-slate-500">BÀN GIAO</div><p className="mt-1 text-xs font-semibold text-slate-800">{active.output}</p><p className="mt-1 text-[11px] leading-4 text-rose-700">⚑ {active.guard}</p></div>
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.35fr_0.9fr]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 saas-shadow">
          <div className="flex items-center justify-between gap-3"><div><h2 className="font-bold text-slate-900">2. Dây chuyền tạo video</h2><p className="text-xs text-slate-500 mt-1">Ba module có thể chuẩn bị song song sau khi Script đã duyệt.</p></div><Video size={19} className="text-indigo-600" /></div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {[{title:"A · Nội dung", text:"Idea, research, script, hook, outro, CTA", who:"Editor định hướng · Producer viết", out:"Script hoàn chỉnh", color:"border-blue-200 bg-blue-50"},{title:"B · Âm thanh", text:"Voice, BGM, SFX; phát âm, tốc độ và cân bằng âm lượng", who:"Producer / thu âm", out:"File audio chuẩn", color:"border-amber-200 bg-amber-50"},{title:"C · Hình ảnh", text:"Footage, nhân vật, graphic, subtitle, hoạt họa", who:"Producer / truyền thông", out:"Thư mục visual", color:"border-violet-200 bg-violet-50"}].map((m, i) => <div key={m.title} className={`rounded-xl border p-4 ${m.color}`}><div className="text-xs font-bold text-slate-900">{m.title}</div><p className="mt-2 text-xs leading-5 text-slate-600">{m.text}</p><div className="mt-3 border-t border-slate-200/70 pt-2 text-[11px] font-semibold text-slate-700">{m.who}</div><div className="mt-1 text-[11px] text-slate-500">→ {m.out}</div>{i === 0 && <div className="hidden md:block absolute" />}</div>)}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-slate-600"><span className="rounded-lg bg-slate-100 px-3 py-2">A: Script duyệt</span><ArrowRight size={16} /><span className="rounded-lg bg-slate-100 px-3 py-2">B + C: làm song song</span><ArrowRight size={16} /><span className="rounded-lg bg-indigo-100 px-3 py-2 text-indigo-800">Assembly video nháp</span></div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 saas-shadow">
          <h2 className="font-bold text-slate-900">Asset cần sẵn sàng</h2><p className="text-xs text-slate-500 mt-1">Tách rõ thứ làm một lần và thứ làm theo từng tập.</p>
          <div className="mt-4 space-y-3 text-xs">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3"><div className="font-bold text-emerald-900">Pre-built · dùng nhiều tập</div><ul className="mt-2 space-y-1 text-emerald-800"><li>• Linh vật: màu, biểu cảm, tư thế</li><li>• Intro/outro, lower-third, font, subtitle template</li><li>• SFX chuẩn & BGM đã kiểm tra bản quyền</li></ul></div>
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3"><div className="font-bold text-orange-900">On-demand · theo từng tập</div><ul className="mt-2 space-y-1 text-orange-800"><li>• Final script, voiceover, footage hợp ngữ cảnh</li><li>• Graphic/subtitle riêng và source/reference</li><li>• Kiểm quyền sử dụng trước khi publish</li></ul></div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 saas-shadow">
        <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="font-bold text-slate-900">3. Mô phỏng xuất bản đa nền tảng</h2><p className="text-xs text-slate-500 mt-1">YouTube là master; TikTok là lát cắt có chủ đích từ bản master, không làm lại từ đầu.</p></div><div className="flex rounded-lg bg-slate-100 p-1"><button onClick={() => setChannel("youtube")} className={`rounded-md px-3 py-1.5 text-xs font-bold ${channel === "youtube" ? "bg-white text-red-600 shadow-sm" : "text-slate-500"}`}>YouTube</button><button onClick={() => setChannel("tiktok")} className={`rounded-md px-3 py-1.5 text-xs font-bold ${channel === "tiktok" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>TikTok extraction</button></div></div>
        {channel === "youtube" ? <div className="mt-5 grid gap-4 md:grid-cols-[1.25fr_0.75fr]"><div className="rounded-xl bg-slate-950 p-4 text-white"><div className="aspect-video rounded-lg border border-white/10 bg-gradient-to-br from-indigo-700 via-slate-800 to-black p-4 flex flex-col justify-between"><span className="text-[10px] font-bold tracking-wider text-indigo-200">MASTER · 16:9 · 02:00–05:00</span><div><div className="text-lg font-extrabold leading-tight">HOOK: câu hỏi bẻ ngược nhận thức</div><div className="mt-2 text-xs text-slate-300">Body 2–3 luận điểm · khoảng thở chạy thoại gốc · summary card · CTA loop</div></div><span className="text-[10px] text-slate-400">Xuất: video master + thumbnail + title + caption + hashtag</span></div></div><div className="space-y-3 text-xs"><div className="rounded-lg border border-slate-200 p-3"><b>Trước khi đăng</b><p className="mt-1 text-slate-600">Kiểm âm thanh, subtitle, footage/nhạc, CTA, thumbnail và metadata.</p></div><div className="rounded-lg border border-slate-200 p-3"><b>Sau khi đăng</b><p className="mt-1 text-slate-600">Theo dõi view, retention, comment để tạo brief mới.</p></div></div></div> : <div className="mt-5 grid gap-4 md:grid-cols-[0.8fr_auto_0.8fr]"><div className="rounded-xl border border-red-200 bg-red-50 p-4"><div className="text-[10px] font-bold text-red-700">NGUỒN</div><div className="mt-2 font-bold text-slate-900">Video YouTube master</div><p className="mt-1 text-xs leading-5 text-slate-600">Xem retention/comment, chọn một đoạn 30–45 giây có luận điểm độc lập và cảm xúc cao.</p></div><div className="flex items-center justify-center"><ArrowRight className="text-slate-400" /></div><div className="rounded-xl border border-slate-900 bg-slate-950 p-4 text-white"><div className="mx-auto flex aspect-[9/16] w-28 flex-col justify-between rounded-lg border border-white/20 bg-gradient-to-b from-fuchsia-500 via-slate-900 to-black p-2"><span className="text-[7px] font-bold">HOOK 0–3s</span><span className="text-[7px]">Subtitle lớn<br/>CTA về YouTube<br/>+ Community</span><span className="text-[7px] text-slate-300">9:16 · 30–45s</span></div><div className="mt-3 text-center text-xs font-bold">TikTok cutdown</div></div></div>}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 saas-shadow overflow-x-auto">
        <div className="flex items-center gap-2"><Music2 size={18} className="text-indigo-600" /><div><h2 className="font-bold text-slate-900">4. Ma trận script cần nộp</h2><p className="text-xs text-slate-500 mt-1">Producer điền đủ bốn cột để Editor có thể duyệt và dựng đúng ý.</p></div></div>
        <table className="mt-4 min-w-[760px] w-full text-left text-xs"><thead className="bg-slate-100 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="p-3">Thời gian</th><th className="p-3">Phân đoạn</th><th className="p-3">Voice / nội dung</th><th className="p-3">Hình ảnh / edit</th><th className="p-3">Nhạc / SFX</th></tr></thead><tbody>{scriptRows.map(row => <tr key={row[0]} className="border-b border-slate-100 last:border-0"><td className="p-3 font-mono font-semibold text-slate-700">{row[0]}</td><td className="p-3 font-bold text-slate-900">{row[1]}</td><td className="p-3 leading-5 text-slate-600">{row[2]}</td><td className="p-3 leading-5 text-slate-600">{row[3]}</td><td className="p-3 leading-5 text-slate-600">{row[4]}</td></tr>)}</tbody></table>
      </section>

      <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 sm:p-5"><div className="flex gap-3"><Upload className="mt-0.5 shrink-0 text-indigo-600" size={20}/><div><h2 className="font-bold text-indigo-950">Quy ước trách nhiệm để vận hành không bị nghẽn</h2><p className="mt-1 text-xs leading-5 text-indigo-900"><b>Editor</b> chịu trách nhiệm “làm gì, vì sao, theo hướng nào”. <b>Producer</b> chịu trách nhiệm “triển khai như thế nào”. Sau bàn giao, <b>Editor</b> hoàn thiện trực tiếp trước khi Core duyệt chốt. Dữ liệu sau đăng là input cho Idea kế tiếp.</p></div></div></section>
    </div>
  );
}
