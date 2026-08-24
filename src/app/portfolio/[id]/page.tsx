import { getAllData } from "../../../lib/sheets";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Award, Lightbulb, ShieldCheck, PenLine, Scissors, Clapperboard, ExternalLink, ArrowLeft, CheckCircle2 } from "lucide-react";

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
    { key: "creditsIdeaByEmail", label: "Idea gốc (Người đưa ra)", icon: Lightbulb },
    { key: "creditsApprovedByEmail", label: "Người điều hành (Core duyệt)", icon: ShieldCheck },
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
    <div style={{ background: "#131519", minHeight: "100vh", color: "#F1EEE6", fontFamily: "var(--font-body), sans-serif", padding: "40px 20px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        :root { --font-display: 'Oswald', sans-serif; --font-body: 'Inter', sans-serif; --font-mono: 'JetBrains Mono', monospace; }
      `}</style>

      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 30 }}>
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#8B90A0", fontSize: 13, textDecoration: "none" }}>
            <ArrowLeft size={14} /> Về Trang Quản Trị
          </Link>
          <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", color: "#49D3C4", background: "#2B534E", padding: "4px 10px", borderRadius: 12 }}>
            PORTFOLIO ĐƯỢC XÁC THỰC BỞI YNDA
          </span>
        </div>

        {/* PROFILE HEADER */}
        <div style={{ background: "#1D2028", border: "1px solid #323847", borderRadius: 8, padding: 30, marginBottom: 30, display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ width: 72, height: 72, borderRadius: 36, background: "#2B534E", color: "#49D3C4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 30, fontWeight: "bold" }}>
            {member.name ? member.name[0] : "U"}
          </div>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: 28, margin: 0, letterSpacing: 0.5 }}>{member.name}</h1>
              <span style={{ fontSize: 11, fontFamily: "var(--font-mono)", fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "#252933", border: "1px solid #323847", color: "#E3A73C" }}>
                {member.role === "Core" ? "CORE TEAM" : (member.role === "E" ? "EDITOR" : "PRODUCER")}
              </span>
            </div>
            <div style={{ fontSize: 13, color: "#8B90A0", marginBottom: 8 }}>{member.id}</div>
            <div style={{ display: "flex", gap: 16, fontSize: 12.5, color: "#8B90A0", flexWrap: "wrap" }}>
              {member.primaryExpertise && <div>Chuyên môn chính: <b style={{ color: "#F1EEE6" }}>{member.primaryExpertise}</b></div>}
              {member.secondaryExpertise && <div>Phụ: <b style={{ color: "#F1EEE6" }}>{member.secondaryExpertise}</b></div>}
            </div>
          </div>
        </div>

        {/* COMPLETED WORKS */}
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
            <Award size={20} color="#E3A73C" />
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: 22, margin: 0, letterSpacing: 0.5 }}>SẢN PHẨM HOÀN THÀNH ({completedWorks.length})</h2>
          </div>

          {completedWorks.length === 0 ? (
            <div style={{ background: "#1D2028", border: "1px solid #323847", borderRadius: 8, padding: 40, textAlign: "center", color: "#8B90A0" }}>
              Chưa có sản phẩm hoàn thành nào được ghi nhận với liên kết công khai.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {completedWorks.map((idea, idx) => {
                const pc = pcById[idea.platformChannelId];
                const channel = pc ? channelById[pc.channelGroupId] : null;
                const platform = pc ? platformById[pc.platformId] : null;
                const roles = CREDIT_META.filter(cm => (idea as any)[cm.key] === member.id);

                return (
                  <div key={idea.id} style={{ background: "#1D2028", border: "1px solid #323847", borderLeft: `4px solid ${channel ? channel.color : "#49D3C4"}`, borderRadius: 6, padding: 20 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 600, color: "#F1EEE6", marginBottom: 4 }}>
                          {idx + 1}. {idea.title}
                        </div>
                        <div style={{ fontSize: 12, color: "#8B90A0", fontFamily: "var(--font-mono)" }}>
                          {channel?.name || "Kênh YNDA"} · {platform?.name || "Video"}
                        </div>
                      </div>
                      <a href={idea.publishedLink} target="_blank" rel="noreferrer" 
                        style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", background: "#252933", border: "1px solid #323847", borderRadius: 4, color: "#5B9EE8", fontSize: 12, textDecoration: "none", fontWeight: 600, shrink: 0 }}>
                        Xem Video <ExternalLink size={12} />
                      </a>
                    </div>

                    {idea.description && (
                      <p style={{ fontSize: 13, color: "#8B90A0", margin: "10px 0 14px", lineHeight: 1.5, background: "#131519", padding: 10, borderRadius: 4, border: "1px solid #2A2E38" }}>
                        {idea.description}
                      </p>
                    )}

                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10 }}>
                      <span style={{ fontSize: 11, color: "#5C6072", alignSelf: "center", fontWeight: 600 }}>Vai trò:</span>
                      {roles.map(r => (
                        <span key={r.key} style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "3px 8px", background: "#2B534E", border: "1px solid #49D3C444", borderRadius: 4, color: "#49D3C4", fontSize: 11, fontWeight: 500 }}>
                          <r.icon size={11} /> {r.label}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ marginTop: 40, textAlign: "center", fontSize: 12, color: "#5C6072", borderTop: "1px solid #2A2E38", paddingTop: 20 }}>
          YNDA Workflow System — Hệ thống quy trình sản xuất nội dung số chuyên nghiệp.
        </div>
      </div>
    </div>
  );
}
