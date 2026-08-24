import { getAllData } from "../../../lib/sheets";
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
    <div className="min-h-screen bg-[#080B11] text-[#F8FAFC] px-4 py-10" style={{ fontFamily: "var(--font-sans, sans-serif)" }}>
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* TOP BAR */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#222E44]">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-[#94A3B8] hover:text-[#E5C058] transition-colors">
            <ArrowLeft size={15} /> Về Trang Quản Trị YNDA
          </Link>
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#182030] border border-[#E5C058]/30 text-xs font-mono text-[#E5C058]">
            <Sparkles size={13} className="text-[#E5C058]" />
            <span>XÁC THỰC BỞI Ý NIỆM ĐIỆN ẢNH</span>
          </div>
        </div>

        {/* PROFILE HEADER HERO */}
        <div className="p-8 rounded-2xl bg-gradient-to-br from-[#121824] to-[#182234] border border-[#222E44] shadow-2xl relative overflow-hidden">
          {/* Subtle cosmic glow background */}
          <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#E5C058]/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 relative z-10">
            {/* Logo / Avatar with gold ring */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden p-1 bg-gradient-to-tr from-[#B8860B] via-[#E5C058] to-[#FFF0B3] shadow-lg shadow-[#E5C058]/20 flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-[#101726] flex items-center justify-center text-3xl font-extrabold text-[#E5C058]">
                  {member.name ? member.name[0] : "U"}
                </div>
              </div>
              <img 
                src="/logo.png" 
                alt="YNDA Logo" 
                className="w-7 h-7 rounded-full absolute -bottom-1 -right-1 border-2 border-[#101726] shadow"
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-2">
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">{member.name}</h1>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider bg-[#E5C058]/15 text-[#E5C058] border border-[#E5C058]/30">
                  {member.role === "Core" ? "CORE TEAM" : (member.role === "E" ? "EDITOR" : "PRODUCER")}
                </span>
              </div>
              
              <div className="text-xs font-mono text-[#94A3B8] mb-4">{member.id}</div>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-[#94A3B8]">
                {member.primaryExpertise && (
                  <div className="px-3 py-1 rounded bg-[#101622] border border-[#222E44]">
                    Chuyên môn chính: <b className="text-white font-semibold">{member.primaryExpertise}</b>
                  </div>
                )}
                {member.secondaryExpertise && (
                  <div className="px-3 py-1 rounded bg-[#101622] border border-[#222E44]">
                    Phụ: <b className="text-white font-semibold">{member.secondaryExpertise}</b>
                  </div>
                )}
                <div className="px-3 py-1 rounded bg-[#101622] border border-[#222E44]">
                  Tổng tác phẩm: <b className="text-[#E5C058] font-bold">{completedWorks.length} video</b>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COMPLETED WORKS SECTION */}
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#E5C058]/15 flex items-center justify-center text-[#E5C058]">
              <Award size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">SẢN PHẨM HOÀN THÀNH ({completedWorks.length})</h2>
              <p className="text-xs text-[#94A3B8]">Danh sách tác phẩm video có bằng chứng liên kết xuất bản công khai</p>
            </div>
          </div>

          {completedWorks.length === 0 ? (
            <div className="p-12 rounded-xl bg-[#101726] border border-[#222E44] text-center text-sm text-[#64748B]">
              Chưa có sản phẩm hoàn thành nào được ghi nhận với liên kết công khai.
            </div>
          ) : (
            <div className="grid gap-4">
              {completedWorks.map((idea, idx) => {
                const pc = pcById[idea.platformChannelId];
                const channel = pc ? channelById[pc.channelGroupId] : null;
                const platform = pc ? platformById[pc.platformId] : null;
                const roles = CREDIT_META.filter(cm => (idea as any)[cm.key] === member.id);

                return (
                  <div key={idea.id} 
                    className="p-5 rounded-xl bg-[#121824] border border-[#222E44] hover:border-[#E5C058]/40 transition-all shadow-md"
                    style={{ borderLeftWidth: 4, borderLeftColor: channel ? channel.color : "#E5C058" }}>
                    
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                      <div>
                        <h3 className="text-base font-bold text-white mb-1 leading-snug">
                          {idx + 1}. {idea.title}
                        </h3>
                        <div className="text-xs font-mono text-[#94A3B8] flex items-center gap-2">
                          <span className="font-semibold" style={{ color: channel?.color || "#E5C058" }}>{channel?.name || "Kênh YNDA"}</span>
                          <span>•</span>
                          <span>{platform?.name || "Video"}</span>
                        </div>
                      </div>

                      <a href={idea.publishedLink} target="_blank" rel="noreferrer" 
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1B2434] hover:bg-[#26334D] border border-[#334155] text-xs font-semibold text-[#60A5FA] hover:text-white transition-all shrink-0">
                        <span>Xem Video</span> <ExternalLink size={13} />
                      </a>
                    </div>

                    {idea.description && (
                      <p className="text-xs text-[#94A3B8] bg-[#0A0E17] p-3 rounded-lg border border-[#1A2333] mb-3 leading-relaxed">
                        {idea.description}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#1E293B]">
                      <span className="text-[11px] font-mono text-[#64748B]">Vai trò đóng góp:</span>
                      {roles.map(r => (
                        <span key={r.key} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono text-[#E5C058] bg-[#E5C058]/10 border border-[#E5C058]/30">
                          <r.icon size={12} /> {r.label}
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
        <div className="pt-8 mt-12 text-center text-xs text-[#64748B] border-t border-[#222E44] flex flex-col items-center justify-center gap-3">
          <img src="/logo.png" alt="Ý Niệm Điện Ảnh" className="w-10 h-10 rounded-full border border-[#E5C058]/40 shadow-md" />
          <div>
            <div className="font-bold text-white tracking-wider text-sm">Ý NIỆM ĐIỆN ẢNH</div>
            <div className="text-[11px] text-[#94A3B8] mt-0.5">Nơi Ý Tưởng Cất Cánh — Studio Production Management Suite</div>
          </div>
        </div>

      </div>
    </div>
  );
}
