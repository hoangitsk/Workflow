"use client";

import React, { useState, useMemo, useEffect, useTransition } from "react";
import {
  Film, Clapperboard, Users, LayoutGrid, Calendar, FolderOpen, Award,
  Plus, X, Trash2, RotateCcw, ChevronRight, ChevronLeft, AlertTriangle,
  CheckCircle2, XCircle, Link as LinkIcon, Copy, Lightbulb, PenLine,
  Scissors, Clapperboard as ClapIcon, ShieldCheck, Lock, LogOut
} from "lucide-react";

import { loginWithTokenAction, logoutAction } from "../../actions/auth-actions";
import { submitIdeaAction, approveIdeaAction, submitScriptAction, startProductionAction, submitVideoAction, qaPassAction, qaFailAction, deleteIdeaAction, cancelIdeaAction } from "../../actions/idea-actions";
import { createChannelAction, archiveChannelAction, restoreChannelAction, createMemberAction, removeMemberAction, updateMemberProfileAction } from "../../actions/admin-actions";
import { createChecklistAction, updateChecklistStatusAction, deleteChecklistAction } from "../../actions/checklist-actions";

/* ---------------------------------------------------------------------
   TOKENS
--------------------------------------------------------------------- */
const C = {
  bg: "#131519",
  bgSoft: "#191c22",
  panel: "#1D2028",
  panelRaised: "#252933",
  border: "#323847",
  borderSoft: "#2A2E38",
  text: "#F1EEE6",
  textMuted: "#8B90A0",
  textFaint: "#5C6072",
  teal: "#49D3C4",
  tealDim: "#2B534E",
  amber: "#E3A73C",
  amberDim: "#4A3B22",
  red: "#E64A34",
  redDim: "#4A2620",
  violet: "#9C8CFF",
  gold: "#D9B54A",
  blue: "#5B9EE8",
  green: "#5FC97A",
};

const CHANNEL_PALETTE = [C.blue, C.violet, C.gold, C.green, "#E28FD0", "#7FD1E0"];

const STATUS_ORDER = ["PITCH", "ASSIGNMENT", "SCRIPT", "PRODUCTION", "QA", "COMPLETE"];
const STATUS_LABEL: Record<string, string> = {
  PITCH: "Ý tưởng",
  ASSIGNMENT: "Đã giao",
  SCRIPT: "Kịch bản",
  PRODUCTION: "Sản xuất",
  QA: "Kiểm duyệt",
  COMPLETE: "Hoàn thành",
};
const ROLE_LABEL: Record<string, string> = { Core: "Core", E: "Editor", P: "Producer" };
const PLATFORM_DEFAULT_DAYS: Record<string, number> = { TikTok: 2, YouTube: 4 };

const WEEKDAY_INFO: Record<number, any> = {
  1: { tag: "T2", title: "Mở nộp ý tưởng", who: "Core", desc: "Core mở cổng nhận ý tưởng mới." },
  2: { tag: "T3", title: "Nộp & duyệt ý tưởng", who: "E · P · Core", desc: "Duyệt top 5–6, chốt người." },
  3: { tag: "T4", title: "Kịch bản & bắt đầu", who: "P → E", desc: "Nộp và sửa kịch bản." },
  4: { tag: "T5", title: "Sản xuất", who: "Producer", desc: "Quay dựng theo số ngày." },
  5: { tag: "T6", title: "Sản xuất", who: "Producer", desc: "Tiếp tục quay dựng." },
  6: { tag: "T7", title: "Kiểm duyệt", who: "P → E", desc: "Nộp video & QA." },
  0: { tag: "CN", title: "Ngày đệm", who: "E · P", desc: "Sửa ý tưởng bị trả về." },
};

/* ---------------------------------------------------------------------
   HELPERS
--------------------------------------------------------------------- */
const iso = (d: any) => new Date(d).toISOString().slice(0, 10);
const addDays = (d: any, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const today = new Date();
const todayIso = iso(today);
const fmtDate = (s: any) => { if (!s) return "—"; const d = new Date(s); return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`; };
const fmtDateFull = (s: any) => { if (!s) return "—"; const d = new Date(s); return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`; };

function overdueInfo(idea: any) {
  if (idea.status === "ASSIGNMENT" && idea.assignedAt) {
    const hrs = (Date.now() - new Date(idea.assignedAt).getTime()) / 36e5;
    if (hrs > 24) return { level: "yellow", msg: "Quá 1 ngày chưa nộp kịch bản" };
  }
  if (idea.status === "PRODUCTION" && idea.endDate) {
    const end = new Date(iso(idea.endDate) + "T23:59:59");
    const diffDays = (end.getTime() - today.getTime()) / 864e5;
    if (diffDays < 0) return { level: "red", msg: `Đã trễ hạn (${fmtDate(idea.endDate)})` };
    if (diffDays <= 1) return { level: "yellow", msg: `Còn ≤1 ngày tới hạn (${fmtDate(idea.endDate)})` };
  }
  if (idea.status === "QA" && idea.videoSubmittedAt) {
    const hrs = (Date.now() - new Date(idea.videoSubmittedAt).getTime()) / 36e5;
    if (hrs > 24) return { level: "yellow", msg: "Quá 24 giờ chưa duyệt" };
  }
  return null;
}

function canApprove(role: string) { return role === "Core"; }
function canSubmitScript(actor: any, idea: any) { return idea.assignedToId === actor.id && (actor.role === "P"); }
function canStartProduction(actor: any) { return actor.role === "E" || actor.role === "Core"; }
function canSubmitVideo(actor: any, idea: any) { return idea.assignedToId === actor.id && actor.role === "P"; }
function canQA(actor: any) { return actor.role === "E" || actor.role === "Core"; }
function canDeleteIdea(actor: any, idea: any) {
  if (actor.role === "Core" || actor.role === "E") return true;
  if (idea.status === "PITCH" && idea.submittedById === actor.id) return true;
  return false;
}
function canCancelIdea(actor: any, idea: any) {
  if (idea.status === "COMPLETE" || idea.status === "CANCELLED") return false;
  return canDeleteIdea(actor, idea);
}
function canManageChannels(actor: any) { return actor.role === "Core"; }
function canManageMembers(actor: any) { return actor.role === "Core"; }
function canDeleteChecklist(actor: any, checklist: any) { return actor.role === "Core" || actor.id === checklist.createdByEmail; }

/* ---------------------------------------------------------------------
   UI PRIMITIVES
--------------------------------------------------------------------- */
function Badge({ children, tone = "muted" }: any) {
  const tones: any = {
    muted: { bg: C.panelRaised, fg: C.textMuted, bd: C.border },
    teal: { bg: C.tealDim, fg: C.teal, bd: C.teal },
    amber: { bg: C.amberDim, fg: C.amber, bd: C.amber },
    red: { bg: C.redDim, fg: C.red, bd: C.red },
    green: { bg: "#1E3A28", fg: C.green, bd: C.green },
  };
  const t = tones[tone];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium tracking-wide"
      style={{ background: t.bg, color: t.fg, border: `1px solid ${t.bd}44`, fontFamily: "var(--font-mono)" }}>
      {children}
    </span>
  );
}

function RoleChip({ role }: any) {
  const map: any = { Core: C.red, E: C.teal, P: C.blue };
  return (
    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-widest"
      style={{ color: map[role], border: `1px solid ${map[role]}55`, fontFamily: "var(--font-mono)" }}>
      {ROLE_LABEL[role]?.toUpperCase()}
    </span>
  );
}

function Modal({ title, onClose, children, wide }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,11,14,0.72)", backdropFilter: "blur(2px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full flex flex-col"
        style={{ maxWidth: wide ? 640 : 460, maxHeight: "88vh", background: C.panel, border: `1px solid ${C.border}`, borderRadius: 4, boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
          <h3 style={{ color: C.text, fontFamily: "var(--font-display)", fontSize: 18, letterSpacing: 0.3 }}>{title}</h3>
          <button onClick={onClose} style={{ color: C.textMuted }} className="hover:opacity-70"><X size={18} /></button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function FieldLabel({ children }: any) { return <label className="block mb-1.5 text-xs font-semibold tracking-wide" style={{ color: C.textMuted }}>{children}</label>; }
const inputStyle = { background: C.bgSoft, border: `1px solid ${C.border}`, color: C.text, borderRadius: 3 };

function TextInput(props: any) { return <input {...props} className={"w-full px-3 py-2 text-sm outline-none " + (props.className||"")} style={{ ...inputStyle, ...(props.style||{}) }} />; }
function Select(props: any) { return <select {...props} className={"w-full px-3 py-2 text-sm outline-none " + (props.className||"")} style={{ ...inputStyle, ...(props.style||{}) }} />; }
function TextArea(props: any) { return <textarea {...props} className={"w-full px-3 py-2 text-sm outline-none " + (props.className||"")} style={{ ...inputStyle, ...(props.style||{}) }} />; }
function Btn({ children, onClick, tone = "default", disabled, type = "button", small, loading }: any) {
  const tones: any = {
    default: { bg: C.panelRaised, fg: C.text, bd: C.border },
    primary: { bg: C.teal, fg: "#0B1615", bd: C.teal },
    danger: { bg: "transparent", fg: C.red, bd: C.red },
    ghost: { bg: "transparent", fg: C.textMuted, bd: "transparent" },
  };
  const t = tones[tone];
  return (
    <button type={type} onClick={onClick} disabled={disabled || loading}
      className={"inline-flex items-center gap-1.5 font-semibold rounded transition-opacity " + (small ? "px-2.5 py-1 text-xs" : "px-3.5 py-2 text-sm") + (disabled || loading ? " opacity-40 cursor-not-allowed" : " hover:opacity-85")}
      style={{ background: t.bg, color: t.fg, border: `1px solid ${t.bd}` }}>
      {loading ? "..." : children}
    </button>
  );
}

/* ---------------------------------------------------------------------
   LOGIN SCREEN
--------------------------------------------------------------------- */
import { auth, provider, signInWithPopup } from "../../lib/firebase";

function LoginScreen() {
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      // Send token to server
      await loginWithTokenAction(idToken);
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Đăng nhập thất bại");
      setLoading(false);
    }
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: C.text, fontFamily: "var(--font-body)" }}>
      <div style={{ background: C.panel, padding: 40, borderRadius: 8, width: 400, border: `1px solid ${C.border}`, textAlign: "center" }}>
        <div className="flex items-center justify-center gap-3 mb-6">
          <Film size={32} color={C.amber} />
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 28, letterSpacing: 0.5 }}>YNDA LOGIN</h2>
        </div>
        <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 30 }}>Đăng nhập bằng tài khoản Google đã được cấp quyền truy cập hệ thống.</p>
        <Btn tone="primary" onClick={handleLogin} loading={loading} className="w-full justify-center">
          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Đăng nhập bằng Google
        </Btn>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   MAIN APP (CLIENT)
--------------------------------------------------------------------- */
export default function ClientApp({ initialMembers, initialChannels, initialIdeas, initialChecklists, currentMemberId }: any) {
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const members = initialMembers;
  const channels = initialChannels;
  const ideas = initialIdeas;
  const checklists = initialChecklists || [];

  const [tab, setTab] = useState("board");
  const [openIdea, setOpenIdea] = useState<any>(null);
  const [showNewIdea, setShowNewIdea] = useState(false);
  const [approveIdea, setApproveIdea] = useState<any>(null);
  const [qaRejectIdea, setQaRejectIdea] = useState<any>(null);
  const [qaCompleteIdea, setQaCompleteIdea] = useState<any>(null);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [showNewMember, setShowNewMember] = useState(false);
  const [confirmDeleteChannel, setConfirmDeleteChannel] = useState<any>(null);
  const [cancelIdeaTarget, setCancelIdeaTarget] = useState<any>(null);
  const [showProfile, setShowProfile] = useState<any>(null);
  const [editProfile, setEditProfile] = useState<any>(null);
  const [showCancelledLog, setShowCancelledLog] = useState(false);
  
  const [portfolioMember, setPortfolioMember] = useState<string | null>(currentMemberId);
  const [ganttChannelId, setGanttChannelId] = useState<string | null>(channels.find((c: any) => !c.archived)?.id || null);
  const [ganttMonthOffset, setGanttMonthOffset] = useState(0);

  // Auto update open idea if it changes in props
  useEffect(() => {
    if (openIdea) {
      const updated = ideas.find((i: any) => i.id === openIdea.id);
      if (updated) setOpenIdea(updated);
      else setOpenIdea(null);
    }
  }, [ideas]);

  if (!currentMemberId) {
    return <LoginScreen members={members} />;
  }

  const actor = members.find((m: any) => m.id === currentMemberId);
  if (!actor) {
    // Session exists but user deleted?
    return <LoginScreen members={members} />;
  }

  const memberById = Object.fromEntries(members.map((m: any) => [m.id, m]));
  const channelById = Object.fromEntries(channels.map((c: any) => [c.id, c]));
  const activeChannels = channels.filter((c: any) => !c.archived);
  const trashedChannels = channels.filter((c: any) => c.archived);

  // ACTION HELPERS
  const runAction = (fn: any, ...args: any) => {
    startTransition(async () => {
      try {
        await fn(...args);
      } catch (err: any) {
        alert(err.message);
      }
    });
  };

  const submitIdea = (title: string, channelId: string) => {
    runAction(submitIdeaAction, title, channelId);
    setShowNewIdea(false);
    showToast(`Đã nộp ý tưởng "${title}"`);
  };
  const approveIdeaFn = (idea: any, platform: string, days: number, producerId: string) => {
    runAction(approveIdeaAction, idea.id, platform, days, producerId);
    setApproveIdea(null);
    showToast(`Đã duyệt "${idea.title}"`);
  };
  const qaPassFn = (idea: any, link: string) => {
    runAction(qaPassAction, idea.id, link);
    setQaCompleteIdea(null);
    showToast(`"${idea.title}" hoàn thành 🎉`);
  };
  const qaFailFn = (idea: any, note: string) => {
    runAction(qaFailAction, idea.id, note);
    setQaRejectIdea(null);
    showToast(`Đã trả về "${idea.title}"`);
  };

  const handleLogout = async () => {
    await logoutAction();
    window.location.reload();
  };

  const TABS = [
    { id: "board", label: "Bảng ý tưởng", icon: LayoutGrid },
    { id: "gantt", label: "Kênh & Gantt", icon: Calendar },
    { id: "members", label: "Thành viên & Nhật ký", icon: Users },
    { id: "checklist", label: "Checklist", icon: CheckCircle2 },
    { id: "portfolio", label: "Portfolio", icon: Award },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "var(--font-body)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        :root { --font-display: 'Oswald', sans-serif; --font-body: 'Inter', sans-serif; --font-mono: 'JetBrains Mono', monospace; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        select option { background: ${C.bgSoft}; }
      `}</style>

      {/* HEADER */}
      <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
        <div className="flex items-center gap-2.5">
          <div style={{ width: 30, height: 30, background: C.amber, borderRadius: 3, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Film size={17} color="#1A1300" />
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, color: C.text, letterSpacing: 0.5, lineHeight: 1 }}>YNDA WORKFLOW</div>
            <div style={{ fontSize: 10.5, color: C.textFaint, fontFamily: "var(--font-mono)", marginTop: 2 }}>phiên bản web hoàn chỉnh</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {isPending && <span style={{ fontSize: 11, color: C.teal }}>Đang đồng bộ...</span>}
          <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: C.panelRaised, borderRadius: 20 }}>
            <span style={{ fontSize: 12, color: C.text, fontWeight: 500 }}>{actor.name}</span>
            <RoleChip role={actor.role} />
          </div>
          <button onClick={handleLogout} style={{ color: C.textMuted }} className="hover:text-red-400">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* WEEK STRIP */}
      <div className="px-5 pt-4 pb-3" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
        <div className="flex items-stretch gap-3">
          <div className="flex gap-1 items-center shrink-0">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => {
              const active = d === today.getDay();
              return (
                <div key={d} className="relative flex flex-col items-center justify-center"
                  style={{ width: 34, height: 44, background: active ? C.teal : C.panelRaised, border: `1px solid ${active ? C.teal : C.border}`, borderRadius: 2 }}>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: active ? "#0B1615" : C.textMuted }}>{WEEKDAY_INFO[d].tag}</span>
                </div>
              );
            })}
          </div>
          <div className="flex-1 flex items-center gap-3 px-4" style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 3 }}>
            <Clapperboard size={20} color={C.amber} />
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span style={{ fontFamily: "var(--font-display)", fontSize: 16, letterSpacing: 0.4, color: C.text }}>{WEEKDAY_INFO[today.getDay()].title.toUpperCase()}</span>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: C.textFaint }}>· {fmtDateFull(todayIso)}</span>
              </div>
              <p style={{ color: C.textMuted, fontSize: 12.5, marginTop: 2 }}>{WEEKDAY_INFO[today.getDay()].desc}</p>
            </div>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-1 px-5 pt-3" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium"
            style={{ color: tab === t.id ? C.teal : C.textMuted, borderBottom: `2px solid ${tab === t.id ? C.teal : "transparent"}`, marginBottom: -1 }}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="p-5">
        {tab === "board" && (
          <BoardView ideas={ideas} channels={channels} memberById={memberById} channelById={channelById} actor={actor}
            onOpen={setOpenIdea} onNewIdea={() => setShowNewIdea(true)} />
        )}
        {tab === "gantt" && (
          <GanttView channels={activeChannels} trashed={trashedChannels} ideas={ideas} actor={actor}
            ganttChannelId={ganttChannelId} setGanttChannelId={setGanttChannelId} monthOffset={ganttMonthOffset} setMonthOffset={setGanttMonthOffset}
            onNewChannel={() => setShowNewChannel(true)} onDeleteChannel={setConfirmDeleteChannel} onRestoreChannel={(c: any) => runAction(restoreChannelAction, c.id)} />
        )}
        {tab === "members" && (
          <MembersView members={members} ideas={ideas} channelById={channelById} actor={actor}
            showCancelledLog={showCancelledLog} setShowCancelledLog={setShowCancelledLog} onShowProfile={setShowProfile}
            onAddMember={() => setShowNewMember(true)} onRemoveMember={(m: any) => runAction(removeMemberAction, m.id)} />
        )}
        {tab === "checklist" && (
          <ChecklistView checklists={checklists} actor={actor} members={members} />
        )}
        {tab === "portfolio" && (
          <PortfolioView members={members} ideas={ideas} channelById={channelById}
            selected={portfolioMember} setSelected={setPortfolioMember} showToast={showToast} />
        )}
      </div>

      {/* MODALS */}
      {showNewIdea && (
        <Modal title="Nộp ý tưởng mới" onClose={() => setShowNewIdea(false)}>
          <form onSubmit={(e: any) => { e.preventDefault(); submitIdea(e.target.title.value, e.target.channel.value); }}>
            <FieldLabel>Tên ý tưởng</FieldLabel>
            <TextInput id="title" autoFocus required />
            <div className="mt-3">
              <FieldLabel>Kênh</FieldLabel>
              <Select id="channel" required>
                {activeChannels.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </Select>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Btn onClick={() => setShowNewIdea(false)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Nộp</Btn>
            </div>
          </form>
        </Modal>
      )}

      {openIdea && (
        <Modal title={openIdea.title} onClose={() => setOpenIdea(null)} wide>
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <Badge tone="muted">{STATUS_LABEL[openIdea.status]}</Badge>
            {channelById[openIdea.channelId] && <span style={{ fontSize: 12, color: channelById[openIdea.channelId].color, fontFamily: "var(--font-mono)" }}>{channelById[openIdea.channelId].name}</span>}
            {openIdea.platform && <Badge tone="muted">{openIdea.platform}</Badge>}
            {overdueInfo(openIdea) && <Badge tone="red"><AlertTriangle size={11} /> {overdueInfo(openIdea)?.msg}</Badge>}
          </div>

          {openIdea.qaFeedback && (
            <div className="mb-4 p-3" style={{ background: C.redDim, border: `1px solid ${C.red}55`, borderRadius: 3 }}>
              <div style={{ fontSize: 11, color: C.red, fontWeight: 700, marginBottom: 2 }}>GHI CHÚ QA — CHƯA ĐẠT</div>
              <div style={{ fontSize: 13, color: C.text }}>{openIdea.qaFeedback}</div>
            </div>
          )}

          <div className="mb-4 p-3" style={{ background: C.bgSoft, borderRadius: 3, border: `1px solid ${C.borderSoft}` }}>
            <div style={{ fontSize: 11, color: C.textFaint, fontWeight: 700, marginBottom: 4, letterSpacing: 0.5 }}>GHI NHẬN ĐÓNG GÓP</div>
            <CreditRow icon={Lightbulb} label="Idea gốc" member={memberById[openIdea.creditsIdeaById]} />
            <CreditRow icon={ShieldCheck} label="Người điều hành (Core duyệt)" member={memberById[openIdea.creditsApprovedById]} />
            <CreditRow icon={PenLine} label="Viết kịch bản" member={memberById[openIdea.creditsScriptById]} />
            <CreditRow icon={Scissors} label="Biên tập kịch bản" member={memberById[openIdea.creditsEditedScriptById]} />
            <CreditRow icon={ClapIcon} label="Sản xuất (quay/dựng)" member={memberById[openIdea.creditsProducedById]} />
            <CreditRow icon={ShieldCheck} label="Kiểm duyệt QA" member={memberById[openIdea.creditsQaById]} />
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2" style={{ borderTop: `1px solid ${C.borderSoft}` }}>
            {openIdea.status === "PITCH" && canApprove(actor.role) && <Btn tone="primary" onClick={() => setApproveIdea(openIdea)}><CheckCircle2 size={14} /> Duyệt</Btn>}
            {openIdea.status === "ASSIGNMENT" && canSubmitScript(actor, openIdea) && <Btn tone="primary" onClick={() => runAction(submitScriptAction, openIdea.id)}>Nộp kịch bản</Btn>}
            {openIdea.status === "SCRIPT" && canStartProduction(actor) && <Btn tone="primary" onClick={() => runAction(startProductionAction, openIdea.id)}>Bắt đầu sản xuất</Btn>}
            {openIdea.status === "PRODUCTION" && canSubmitVideo(actor, openIdea) && <Btn tone="primary" onClick={() => runAction(submitVideoAction, openIdea.id)}>Nộp video</Btn>}
            {openIdea.status === "QA" && canQA(actor) && (
              <>
                <Btn tone="primary" onClick={() => setQaCompleteIdea(openIdea)}><CheckCircle2 size={14} /> Đạt</Btn>
                <Btn tone="danger" onClick={() => setQaRejectIdea(openIdea)}><XCircle size={14} /> Chưa đạt</Btn>
              </>
            )}
            
            <div className="flex-1" />
            {canCancelIdea(actor, openIdea) && (
              <Btn tone="ghost" onClick={() => { setCancelIdeaTarget(openIdea); setOpenIdea(null); }}><XCircle size={13} /> Huỷ</Btn>
            )}
            {canDeleteIdea(actor, openIdea) && openIdea.status !== "COMPLETE" && (
              <Btn tone="ghost" onClick={() => { runAction(deleteIdeaAction, openIdea.id); setOpenIdea(null); }}><Trash2 size={13} /> Xoá</Btn>
            )}
          </div>
        </Modal>
      )}

      {/* Action Modals */}
      {approveIdea && (
        <Modal title={`Duyệt "${approveIdea.title}"`} onClose={() => setApproveIdea(null)}>
          <form onSubmit={(e: any) => { e.preventDefault(); approveIdeaFn(approveIdea, e.target.platform.value, parseInt(e.target.days.value), e.target.producer.value); }}>
            <FieldLabel>Nền tảng</FieldLabel>
            <Select id="platform" required className="mb-3">
              <option value="TikTok">TikTok</option>
              <option value="YouTube">YouTube</option>
            </Select>
            <FieldLabel>Số ngày sản xuất</FieldLabel>
            <TextInput id="days" type="number" min={1} defaultValue={2} required className="mb-3" />
            <FieldLabel>Producer phụ trách</FieldLabel>
            <Select id="producer" required>
              {members.filter((m: any) => m.role === "P").map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.name} {m.primaryExpertise ? `— [${m.primaryExpertise}]` : ""}
                </option>
              ))}
            </Select>
            <div className="flex justify-end gap-2 mt-5">
              <Btn onClick={() => setApproveIdea(null)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Duyệt</Btn>
            </div>
          </form>
        </Modal>
      )}

      {qaCompleteIdea && (
        <Modal title={`Đạt — "${qaCompleteIdea.title}"`} onClose={() => setQaCompleteIdea(null)}>
          <form onSubmit={(e: any) => { e.preventDefault(); qaPassFn(qaCompleteIdea, e.target.link.value); }}>
            <FieldLabel>Dán link sản phẩm đã đăng (bắt buộc)</FieldLabel>
            <TextInput id="link" required placeholder="https://..." />
            <div className="flex justify-end gap-2 mt-5">
              <Btn onClick={() => setQaCompleteIdea(null)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Hoàn thành</Btn>
            </div>
          </form>
        </Modal>
      )}

      {qaRejectIdea && (
        <Modal title={`Chưa đạt — "${qaRejectIdea.title}"`} onClose={() => setQaRejectIdea(null)}>
          <form onSubmit={(e: any) => { e.preventDefault(); qaFailFn(qaRejectIdea, e.target.note.value); }}>
            <FieldLabel>Lý do (bắt buộc)</FieldLabel>
            <TextArea id="note" required rows={3} />
            <div className="flex justify-end gap-2 mt-5">
              <Btn onClick={() => setQaRejectIdea(null)}>Huỷ</Btn>
              <Btn tone="danger" type="submit" loading={isPending}>Trả về PRODUCTION</Btn>
            </div>
          </form>
        </Modal>
      )}

      {showNewChannel && (
        <Modal title="Tạo kênh mới" onClose={() => setShowNewChannel(false)}>
          <form onSubmit={(e: any) => { e.preventDefault(); runAction(createChannelAction, e.target.name.value, CHANNEL_PALETTE[channels.length % CHANNEL_PALETTE.length]); setShowNewChannel(false); }}>
            <FieldLabel>Tên kênh</FieldLabel>
            <TextInput id="name" required />
            <div className="flex justify-end gap-2 mt-5">
              <Btn onClick={() => setShowNewChannel(false)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Tạo</Btn>
            </div>
          </form>
        </Modal>
      )}

      {showNewMember && (
        <Modal title="Thêm thành viên" onClose={() => setShowNewMember(false)}>
          <form onSubmit={(e: any) => { 
            e.preventDefault(); 
            runAction(createMemberAction, e.target.name.value, e.target.role.value, e.target.email.value, e.target.phone?.value, e.target.facebook?.value, e.target.primary?.value, e.target.secondary?.value); 
            setShowNewMember(false); 
          }}>
            <FieldLabel>Tên</FieldLabel>
            <TextInput id="name" required className="mb-3" />
            <FieldLabel>Vai trò</FieldLabel>
            <Select id="role" required className="mb-3">
              <option value="P">Producer</option><option value="E">Editor</option><option value="Core">Core</option>
            </Select>
            <FieldLabel>Email Google (Bắt buộc để đăng nhập)</FieldLabel>
            <TextInput id="email" type="email" required className="mb-4" />
            
            <details className="mb-4 text-sm">
              <summary className="cursor-pointer text-blue-400 mb-2 font-medium">+ Thêm chi tiết (tuỳ chọn)</summary>
              <div className="pl-2 border-l border-gray-700 mt-2 space-y-3">
                <div>
                  <FieldLabel>Số điện thoại</FieldLabel>
                  <TextInput id="phone" />
                </div>
                <div>
                  <FieldLabel>Link Facebook</FieldLabel>
                  <TextInput id="facebook" />
                </div>
                <div>
                  <FieldLabel>Chuyên môn chính</FieldLabel>
                  <Select id="primary">
                    <option value="">-- Chọn --</option>
                    <option value="Content">Content</option>
                    <option value="Quay dựng">Quay dựng</option>
                    <option value="Dựng-Edit">Dựng-Edit</option>
                    <option value="Thiết kế">Thiết kế</option>
                    <option value="Khác">Khác</option>
                  </Select>
                </div>
                <div>
                  <FieldLabel>Chuyên môn phụ</FieldLabel>
                  <Select id="secondary">
                    <option value="">-- Chọn --</option>
                    <option value="Content">Content</option>
                    <option value="Quay dựng">Quay dựng</option>
                    <option value="Dựng-Edit">Dựng-Edit</option>
                    <option value="Thiết kế">Thiết kế</option>
                    <option value="Khác">Khác</option>
                  </Select>
                </div>
              </div>
            </details>

            <div className="flex justify-end gap-2 mt-5">
              <Btn onClick={() => setShowNewMember(false)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Thêm</Btn>
            </div>
          </form>
        </Modal>
      )}

      {cancelIdeaTarget && (
        <Modal title="Huỷ ý tưởng" onClose={() => setCancelIdeaTarget(null)}>
          <form onSubmit={(e: any) => { e.preventDefault(); runAction(cancelIdeaAction, cancelIdeaTarget.id, e.target.reason.value); setCancelIdeaTarget(null); }}>
            <p className="mb-3 text-sm text-gray-400">Ý tưởng này sẽ bị ẩn khỏi bảng làm việc chính, nhưng vẫn lưu trong nhật ký.</p>
            <FieldLabel>Lý do huỷ (không bắt buộc)</FieldLabel>
            <TextInput id="reason" placeholder="VD: Trùng ý tưởng tuần trước..." className="mb-5" />
            <div className="flex justify-end gap-2">
              <Btn onClick={() => setCancelIdeaTarget(null)}>Đóng</Btn>
              <Btn tone="danger" type="submit" loading={isPending}>Đồng ý Huỷ</Btn>
            </div>
          </form>
        </Modal>
      )}

      {showProfile && (
        <Modal title="Hồ sơ thành viên" onClose={() => setShowProfile(null)}>
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3">
              <div style={{ width: 48, height: 48, borderRadius: 24, background: C.tealDim, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: C.teal, fontWeight: "bold" }}>
                {showProfile.name[0]}
              </div>
              <div>
                <div style={{ fontSize: 18, color: C.text, fontWeight: 600 }}>{showProfile.name}</div>
                <RoleChip role={showProfile.role} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
              <div>
                <FieldLabel>Email</FieldLabel>
                <div className="text-gray-200">{showProfile.id}</div>
              </div>
              <div>
                <FieldLabel>Số điện thoại</FieldLabel>
                <div className="text-gray-200">{showProfile.phone || "—"}</div>
              </div>
              <div>
                <FieldLabel>Chuyên môn chính</FieldLabel>
                <div className="text-gray-200">{showProfile.primaryExpertise || "—"}</div>
              </div>
              <div>
                <FieldLabel>Chuyên môn phụ</FieldLabel>
                <div className="text-gray-200">{showProfile.secondaryExpertise || "—"}</div>
              </div>
              <div className="col-span-2">
                <FieldLabel>Facebook</FieldLabel>
                <div className="text-blue-400 break-all">{showProfile.facebook ? <a href={showProfile.facebook} target="_blank" rel="noreferrer">{showProfile.facebook}</a> : "—"}</div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-gray-700 pt-4">
            <Btn onClick={() => setShowProfile(null)}>Đóng</Btn>
            {actor.role === "Core" && (
              <Btn tone="primary" onClick={() => { setEditProfile(showProfile); setShowProfile(null); }}>Sửa hồ sơ</Btn>
            )}
          </div>
        </Modal>
      )}

      {editProfile && (
        <Modal title="Sửa hồ sơ" onClose={() => setEditProfile(null)}>
          <form onSubmit={(e: any) => { 
            e.preventDefault(); 
            runAction(updateMemberProfileAction, editProfile.id, e.target.phone.value, e.target.facebook.value, e.target.primary.value, e.target.secondary.value); 
            setEditProfile(null); 
          }}>
            <div className="mb-4 text-sm text-gray-300">Đang sửa hồ sơ của: <b>{editProfile.name}</b> ({editProfile.id})</div>
            <div className="space-y-3">
              <div>
                <FieldLabel>Số điện thoại</FieldLabel>
                <TextInput id="phone" defaultValue={editProfile.phone} />
              </div>
              <div>
                <FieldLabel>Link Facebook</FieldLabel>
                <TextInput id="facebook" defaultValue={editProfile.facebook} />
              </div>
              <div>
                <FieldLabel>Chuyên môn chính</FieldLabel>
                <Select id="primary" defaultValue={editProfile.primaryExpertise}>
                  <option value="">-- Chọn --</option>
                  <option value="Content">Content</option>
                  <option value="Quay dựng">Quay dựng</option>
                  <option value="Dựng-Edit">Dựng-Edit</option>
                  <option value="Thiết kế">Thiết kế</option>
                  <option value="Khác">Khác</option>
                </Select>
              </div>
              <div>
                <FieldLabel>Chuyên môn phụ</FieldLabel>
                <Select id="secondary" defaultValue={editProfile.secondaryExpertise}>
                  <option value="">-- Chọn --</option>
                  <option value="Content">Content</option>
                  <option value="Quay dựng">Quay dựng</option>
                  <option value="Dựng-Edit">Dựng-Edit</option>
                  <option value="Thiết kế">Thiết kế</option>
                  <option value="Khác">Khác</option>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-5">
              <Btn onClick={() => setEditProfile(null)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Lưu thay đổi</Btn>
            </div>
          </form>
        </Modal>
      )}

      {confirmDeleteChannel && (
        <Modal title="Xoá kênh?" onClose={() => setConfirmDeleteChannel(null)}>
          <p style={{ color: C.textMuted, fontSize: 13.5, lineHeight: 1.6 }}>
            Nếu kênh có idea, nó sẽ được chuyển vào <b>Thùng rác</b>. Nếu trống, sẽ bị xoá vĩnh viễn.
          </p>
          <div className="flex justify-end gap-2 mt-5">
            <Btn onClick={() => setConfirmDeleteChannel(null)}>Huỷ</Btn>
            <Btn tone="danger" onClick={() => { runAction(archiveChannelAction, confirmDeleteChannel.id); setConfirmDeleteChannel(null); }}>Đồng ý xoá</Btn>
          </div>
        </Modal>
      )}

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-2.5 z-50" style={{ background: C.panelRaised, border: `1px solid ${C.teal}66`, borderRadius: 3, color: C.text, fontSize: 13 }}>
          {toast}
        </div>
      )}
    </div>
  );

  /* Sub Views */
  function BoardView({ ideas, channelById, actor, onOpen, onNewIdea }: any) {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: C.text }}>BẢNG Ý TƯỞNG</h2>
          <Btn tone="primary" onClick={onNewIdea}><Plus size={15} /> Nộp ý tưởng</Btn>
        </div>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${STATUS_ORDER.length}, minmax(200px, 1fr))`, overflowX: "auto" }}>
          {STATUS_ORDER.map((status) => {
            const col = ideas.filter((i: any) => i.status === status);
            return (
              <div key={status} style={{ minWidth: 200 }}>
                <div className="flex items-center justify-between mb-2 px-0.5">
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, fontWeight: 700, color: C.textMuted }}>{STATUS_LABEL[status].toUpperCase()}</span>
                  <span style={{ fontSize: 10.5, color: C.textFaint }}>{col.length}</span>
                </div>
                {col.map((idea: any) => (
                  <button key={idea.id} onClick={() => onOpen(idea)} className="w-full text-left p-3 mb-2"
                    style={{ background: C.panel, borderRadius: 3, borderLeft: `3px solid ${channelById[idea.channelId]?.color || C.border}`, border: `1px solid ${C.borderSoft}`, borderLeftWidth: 3 }}>
                    <div className="flex items-start justify-between gap-2">
                      <span style={{ color: C.text, fontSize: 13.5, fontWeight: 600 }}>{idea.title}</span>
                    </div>
                  </button>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  function GanttView({ channels, trashed, onNewChannel, onDeleteChannel, onRestoreChannel }: any) {
    return (
      <div>
        <div className="flex justify-between mb-4">
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: C.text }}>DỰ ÁN CON (KÊNH)</h2>
          {canManageChannels(actor) && <Btn tone="primary" onClick={onNewChannel}><Plus size={14} /> Tạo kênh</Btn>}
        </div>
        <div className="flex flex-wrap gap-2 mb-5">
          {channels.map((c: any) => (
            <div key={c.id} className="flex items-center gap-2 px-2.5 py-1.5" style={{ background: C.panel, border: `1px solid ${C.borderSoft}`, borderRadius: 3 }}>
              <span style={{ width: 9, height: 9, borderRadius: 9, background: c.color }} />
              <span style={{ fontSize: 13, color: C.text }}>{c.name}</span>
              {canManageChannels(actor) && <button onClick={() => onDeleteChannel(c)} className="ml-1 text-gray-500 hover:text-red-400"><Trash2 size={13} /></button>}
            </div>
          ))}
        </div>
        
        {trashed.length > 0 && (
          <div className="mt-8">
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, color: C.textMuted }}>THÙNG RÁC</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              {trashed.map((c: any) => (
                <div key={c.id} className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-800 rounded">
                  <span style={{ fontSize: 12.5, color: C.textMuted }}>{c.name}</span>
                  {canManageChannels(actor) && <button onClick={() => onRestoreChannel(c)} className="text-teal-500 text-xs"><RotateCcw size={12} className="inline"/> Khôi phục</button>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  function MembersView({ members, ideas, channelById, actor, showCancelledLog, setShowCancelledLog, onShowProfile, onAddMember, onRemoveMember }: any) {
    const cancelledIdeas = ideas.filter((i: any) => i.status === "CANCELLED");

    return (
      <div>
        <div className="flex justify-between mb-4">
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: C.text }}>THÀNH VIÊN & NHẬT KÝ</h2>
          {canManageMembers(actor) && <Btn tone="primary" onClick={onAddMember}><Plus size={14} /> Thêm thành viên</Btn>}
        </div>
        <div className="flex flex-wrap gap-2 mb-8">
          {members.map((m: any) => (
            <div key={m.id} className="flex items-center gap-2 px-3 py-2 bg-gray-900 border border-gray-800 rounded">
              <button onClick={() => onShowProfile(m)} className="hover:underline" style={{ fontSize: 13, color: C.text }}>{m.name}</button>
              <RoleChip role={m.role} />
              {canManageMembers(actor) && <button onClick={() => onRemoveMember(m)} className="ml-1 text-gray-500 hover:text-red-400"><Trash2 size={12} /></button>}
            </div>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <h3 style={{ fontFamily: "var(--font-display)", fontSize: 16, color: C.textMuted }}>NHẬT KÝ HOẠT ĐỘNG</h3>
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input type="checkbox" checked={showCancelledLog} onChange={(e) => setShowCancelledLog(e.target.checked)} className="accent-teal-500" />
              Hiện cả idea đã huỷ ({cancelledIdeas.length})
            </label>
          </div>

          <div className="space-y-2">
            {!showCancelledLog && <div className="text-sm text-gray-500 italic">Nhật ký đang trống (Chỉ hiển thị idea bị huỷ nếu bật công tắc).</div>}
            
            {showCancelledLog && cancelledIdeas.length === 0 && (
              <div className="text-sm text-gray-500 italic">Không có idea nào bị huỷ.</div>
            )}

            {showCancelledLog && cancelledIdeas.map((i: any) => {
              const by = members.find((m: any) => m.id === i.cancelledByEmail);
              const ch = channelById[i.channelId];
              return (
                <div key={i.id} className="p-3 bg-gray-900 border border-gray-800 rounded">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="line-through text-gray-400 text-sm font-semibold">{i.title}</span>
                        <span className="text-xs text-gray-600">{ch?.name || "Kênh đã xoá"}</span>
                      </div>
                      {i.cancelReason && <div className="text-xs text-gray-500 mt-1 italic">"{i.cancelReason}"</div>}
                    </div>
                    <div className="text-right text-xs text-gray-500">
                      <div>Huỷ bởi {by?.name || i.cancelledByEmail}</div>
                      <div>{fmtDateFull(i.cancelledAt)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  function ChecklistView({ checklists, actor, members }: any) {
    const STATUSES = ["Chưa bắt đầu", "Đang thực hiện", "Done"];
    const handleStatusClick = (checklist: any) => {
      const idx = STATUSES.indexOf(checklist.status);
      const next = STATUSES[(idx + 1) % STATUSES.length];
      runAction(updateChecklistStatusAction, checklist.id, next);
    };

    return (
      <div>
        <div className="flex justify-between mb-4">
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: C.text }}>CHECKLIST CHUẨN BỊ</h2>
        </div>
        
        <form className="mb-6 flex gap-2" onSubmit={(e: any) => { e.preventDefault(); runAction(createChecklistAction, e.target.name.value); e.target.reset(); }}>
          <TextInput id="name" required placeholder="+ Thêm việc mới (Enter để lưu)" style={{ flex: 1, maxWidth: 400 }} />
          <Btn tone="primary" type="submit" loading={isPending}>Thêm</Btn>
        </form>

        <div className="grid gap-2">
          {checklists.map((c: any) => {
            let badgeTone = "muted";
            if (c.status === "Đang thực hiện") badgeTone = "amber";
            if (c.status === "Done") badgeTone = "green";
            
            return (
              <div key={c.id} className="flex items-center justify-between p-3 bg-gray-900 border border-gray-800 rounded hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3">
                  <button onClick={() => handleStatusClick(c)}>
                    <Badge tone={badgeTone}>{c.status}</Badge>
                  </button>
                  <span style={{ fontSize: 14, color: c.status === "Done" ? C.textMuted : C.text, textDecoration: c.status === "Done" ? "line-through" : "none" }}>{c.name}</span>
                </div>
                {canDeleteChecklist(actor, c) && (
                  <button onClick={() => runAction(deleteChecklistAction, c.id)} className="text-gray-500 hover:text-red-400">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
          {checklists.length === 0 && <p className="text-sm text-gray-500 italic mt-4">Chưa có việc nào trong danh sách.</p>}
        </div>
      </div>
    );
  }

  function PortfolioView({ members, ideas, channelById, selected, setSelected, showToast }: any) {
    const member = members.find((m: any) => m.id === selected) || members[0];
    const CREDIT_META = [
      { key: "creditsIdeaById", label: "Idea gốc (Người đưa ra)", icon: Lightbulb },
      { key: "creditsApprovedById", label: "Người điều hành (Core duyệt)", icon: ShieldCheck },
      { key: "creditsScriptById", label: "Viết kịch bản", icon: PenLine },
      { key: "creditsEditedScriptById", label: "Biên tập (Người chỉnh sửa)", icon: Scissors },
      { key: "creditsProducedById", label: "Sản xuất (Quay/Dựng)", icon: ClapIcon },
      { key: "creditsQaById", label: "Kiểm duyệt QA", icon: ShieldCheck },
    ];

    const items = ideas.filter((i: any) => i.status === "COMPLETE" && i.publishedLink && 
      CREDIT_META.some(cm => i[cm.key] === member?.id)
    );

    if (!member) return <p style={{ color: C.textFaint }}>Chưa có thành viên nào.</p>;

    return (
      <div>
        <div className="flex justify-between mb-5">
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: C.text }}>PORTFOLIO CÁ NHÂN</h2>
        </div>
        <div className="flex flex-wrap gap-2 mb-6">
          {members.map((m: any) => (
            <button key={m.id} onClick={() => setSelected(m.id)}
              className="flex items-center gap-2 px-3 py-1.5"
              style={{ background: m.id === member.id ? C.tealDim : C.panel, border: `1px solid ${m.id === member.id ? C.teal : C.borderSoft}`, borderRadius: 20 }}>
              <span style={{ fontSize: 12.5, color: m.id === member.id ? C.teal : C.text }}>{m.name}</span>
              <RoleChip role={m.role} />
            </button>
          ))}
        </div>

        <div style={{ background: C.panel, border: `1px solid ${C.borderSoft}`, borderRadius: 4, padding: 20 }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 19, color: C.text }}>{member.name}</h3>
          
          {items.length === 0 ? (
            <p style={{ color: C.textFaint, fontSize: 13, marginTop: 16 }}>Chưa có sản phẩm nào hoàn thành kèm link.</p>
          ) : (
            <div className="mt-5 flex flex-col gap-3">
              {items.map((i: any, idx: number) => {
                const ch = channelById[i.channelId];
                const roles = CREDIT_META.filter((cm) => i[cm.key] === member.id);
                return (
                  <div key={i.id} className="p-3.5" style={{ background: C.bgSoft, border: `1px solid ${C.borderSoft}`, borderLeft: `3px solid ${ch ? ch.color : C.border}`, borderRadius: 3 }}>
                    <div className="flex items-center gap-2 mb-2">
                      <span style={{ fontSize: 14.5, fontWeight: 600, color: C.text }}>{idx + 1}. {i.title}</span>
                      <span style={{ fontSize: 11, color: C.textFaint }}>({ch?.name} · {i.platform})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {roles.map((r) => (
                        <span key={r.key} className="inline-flex items-center gap-1 px-2 py-0.5" style={{ fontSize: 10.5, color: C.teal, border: `1px solid ${C.teal}44`, borderRadius: 3 }}>
                          <r.icon size={10} /> {r.label}
                        </span>
                      ))}
                    </div>
                    <a href={i.publishedLink} target="_blank" rel="noreferrer" className="text-blue-400 text-sm hover:underline">{i.publishedLink}</a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }
}

function CreditRow({ icon: Icon, label, member }: any) {
  return (
    <div className="flex items-center gap-2 py-1">
      <Icon size={13} color={C.textFaint} />
      <span style={{ fontSize: 12, color: C.textMuted, width: 180 }}>{label}</span>
      <span style={{ fontSize: 12.5, color: member ? C.text : C.textFaint, fontWeight: member ? 600 : 400 }}>{member ? member.name : "chưa có"}</span>
    </div>
  );
}
