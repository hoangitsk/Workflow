import { getAllData } from "../../../lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Award, Lightbulb, ShieldCheck, PenLine, Scissors, Clapperboard, ExternalLink, ArrowLeft, CheckCircle2, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PublicPortfolioPage({ params }: Props) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id).toLowerCase().trim();

  let members: any[] = [];
  let ideas: any[] = [];
  let channelGroups: any[] = [];
  let platforms: any[] = [];
  let platformChannels: any[] = [];

  try {
    const data = await getAllData();
    members = data.members;
    ideas = data.ideas;
    channelGroups = data.channelGroups;
    platforms = data.platforms;
    platformChannels = data.platformChannels;
  } catch (err) {
    console.error("Lỗi nạp portfolio:", err);
  }

  const member = members.find(m => (m.id || '').toLowerCase().trim() === decodedId);
  if (!member) {
    return notFound();
  }

  const channelById = Object.fromEntries(channelGroups.map(c => [c.id, c]));
  const platformById = Object.fromEntries(platforms.map(p => [p.id, p]));
  const pcById = Object.fromEntries(platformChannels.map(pc => [pc.id, pc]));

  const CREDIT_META = [
    { key: "creditsIdeaByEmail", label: "Idea gốc", icon: Lightbulb },
    { key: "creditsApprovedByEmail", label: "Duyệt bởi (Core)", icon: ShieldCheck },
    { key: "creditsScriptByEmail", label: "Viết kịch bản", icon: PenLine },
    { key: "creditsEditedScriptByEmail", label: "Biên tập kịch bản", icon: Scissors },
    { key: "creditsProducedByEmail", label: "Sản xuất (Quay/Dựng)", icon: Clapperboard },
    { key: "creditsQaByEmail", label: "Kiểm duyệt QA", icon: CheckCircle2 },
  ];

  const completedWorks = ideas.filter(i => 
    i.status === "COMPLETE" && 
    i.publishedLink && 
    CREDIT_META.some(cm => (i as any)[cm.key] === member.id)
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] px-4 py-10" style={{ fontFamily: "var(--font-sans, sans-serif)" }}>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
            <ArrowLeft size={14} /> Về Trang Quản Trị YNDA
          </Link>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-mono font-medium text-emerald-800">
            <Sparkles size={12} className="text-emerald-600" />
            <span>XÁC THỰC BỞI Ý NIỆM ĐIỆN ẢNH</span>
          </div>
        </div>

        {/* PROFILE HEADER HERO */}
        <div className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E2E8F0] saas-shadow-md relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            
            {/* Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden p-1 bg-slate-100 border-2 border-slate-300 shadow-sm flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-2xl font-extrabold text-white">
                  {member.name ? member.name[0] : "U"}
                </div>
              </div>
              <img 
                src="/logo.png" 
                alt="YNDA Logo" 
                className="w-6 h-6 rounded-full absolute -bottom-1 -right-1 border-2 border-white shadow"
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mb-1.5">
                <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">{member.name}</h1>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                  {member.role === "Core" ? "BAN ĐÀO TẠO (CORE)" : (member.role === "E" ? "BAN ĐÀO TẠO" : "BAN DỰ ÁN")}
                </span>
              </div>
              
              <div className="text-xs font-mono text-slate-500 mb-3">{member.id}</div>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-600">
                {member.primaryExpertise && (
                  <div className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
                    Chuyên môn chính: <b className="text-slate-900 font-semibold">{member.primaryExpertise}</b>
                  </div>
                )}
                {member.secondaryExpertise && (
                  <div className="px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200">
                    Phụ: <b className="text-slate-900 font-semibold">{member.secondaryExpertise}</b>
                  </div>
                )}
                <div className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium">
                  Tổng tác phẩm: <b className="font-bold">{completedWorks.length} video</b>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* COMPLETED WORKS SECTION */}
        <div className="space-y-3.5">
          <div className="flex items-center gap-2">
            <Award size={18} className="text-amber-600" />
            <div>
              <h2 className="text-base font-bold text-slate-900">SẢN PHẨM HOÀN THÀNH ({completedWorks.length})</h2>
              <p className="text-xs text-slate-500">Danh sách tác phẩm video có chứng thực liên kết xuất bản chính thức</p>
            </div>
          </div>

          {completedWorks.length === 0 ? (
            <div className="p-8 rounded-xl bg-white border border-slate-200 text-center text-xs text-slate-400 italic">
              Chưa có sản phẩm hoàn thành nào được ghi nhận với liên kết công khai.
            </div>
          ) : (
            <div className="grid gap-3">
              {completedWorks.map((idea, idx) => {
                const pc = pcById[idea.platformChannelId];
                const channel = pc ? channelById[pc.channelGroupId] : null;
                const platform = pc ? platformById[pc.platformId] : null;
                const roles = CREDIT_META.filter(cm => (idea as any)[cm.key] === member.id);

                return (
                  <div key={idea.id} 
                    className="p-4 rounded-xl bg-white border border-[#E2E8F0] saas-shadow hover:border-slate-300 transition-all"
                    style={{ borderLeftWidth: 4, borderLeftColor: channel ? channel.color : "#4F46E5" }}>
                    
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 mb-0.5 leading-snug">
                          {idx + 1}. {idea.title}
                        </h3>
                        <div className="text-[11px] font-mono text-slate-500 flex items-center gap-1.5">
                          <span className="font-semibold" style={{ color: channel?.color || "#4F46E5" }}>{channel?.name || "Kênh YNDA"}</span>
                          <span>•</span>
                          <span>{platform?.name || "Video"}</span>
                        </div>
                      </div>

                      <a href={idea.publishedLink} target="_blank" rel="noreferrer" 
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shrink-0">
                        <span>Xem Video</span> <ExternalLink size={12} />
                      </a>
                    </div>

                    {idea.description && (
                      <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200 mb-2 leading-relaxed">
                        {idea.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-mono text-slate-400">Vai trò:</span>
                      {roles.map(r => (
                        <span key={r.key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          <r.icon size={11} className="text-slate-500" /> {r.label}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="pt-6 mt-8 text-center text-xs text-slate-400 border-t border-slate-200 flex flex-col items-center justify-center gap-2">
          <img src="/logo.png" alt="Ý Niệm Điện Ảnh" className="w-8 h-8 rounded-lg border border-slate-200" />
          <div>
            <div className="font-bold text-slate-700 tracking-wider text-xs">Ý NIỆM ĐIỆN ẢNH</div>
            <div className="text-[10px] text-slate-400">Studio Production Management Hub</div>
          </div>
        </div>

      </div>
    </div>
  );
}
