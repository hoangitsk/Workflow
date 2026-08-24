"use client";

import { useRouter } from "next/navigation";
import React, { useState, useMemo, useEffect, useTransition, useRef } from "react";
import {
  Film, Clapperboard, Users, LayoutGrid, Calendar, FolderOpen, Award,
  Plus, X, Trash2, RotateCcw, ChevronRight, ChevronLeft, AlertTriangle,
  CheckCircle2, XCircle, Link as LinkIcon, Copy, Lightbulb, PenLine,
  Scissors, Clapperboard as ClapIcon, ShieldCheck, Lock, LogOut, Bell,
  Search, Filter, Send, MessageSquare, ExternalLink, Settings as SettingsIcon,
  BarChart3, RefreshCw, Eye, Sparkles, Clock, Check, CalendarDays, Layers,
  Star, Video, Play, ArrowRight, Compass, ShieldAlert, Sparkle, UserCheck
} from "lucide-react";

import { loginWithCredentialsAction, logoutAction, changePasswordAction } from "../../actions/auth-actions";
import { 
  submitIdeaAction, approveIdeaAction, submitScriptAction, startProductionAction, 
  submitVideoAction, qaPassAction, qaFailAction, deleteIdeaAction, cancelIdeaAction,
  archiveUnselectedIdeasAction, restoreArchivedIdeaAction, updateScheduledPostDateAction, 
  triggerDailyCronAction, reassignIdeaAction, updateIdeaDetailsAction, extendDeadlineAction
} from "../../actions/idea-actions";
import { 
  createChannelGroupAction, archiveChannelGroupAction, restoreChannelGroupAction, 
  createPlatformAction, createMemberAction, removeMemberAction, updateMemberProfileAction, 
  toggleMemberActiveAction, updateSettingsAction 
} from "../../actions/admin-actions";
import { addCommentAction } from "../../actions/comment-actions";
import { markNotificationAsReadAction, markAllNotificationsAsReadAction } from "../../actions/notification-actions";
import { sendWeeklyReportToDiscordAction } from "../../actions/report-actions";
import { createChecklistAction, updateChecklistStatusAction, deleteChecklistAction } from "../../actions/checklist-actions";
import { Member, Platform, ChannelGroup, PlatformChannel, Idea, CommentItem, AuditLogItem, NotificationItem, ChecklistItem, AppSettings, Role } from "../../lib/types";

/* ---------------------------------------------------------------------
   CINEMA STUDIO THEME TOKENS (Ý NIỆM ĐIỆN ẢNH)
--------------------------------------------------------------------- */
const C = {
  bg: "#080B11",
  bgSoft: "#0D121B",
  panel: "#111723",
  panelRaised: "#182132",
  panelHover: "#1F2C42",
  border: "#232F46",
  borderSoft: "#182234",
  text: "#F8FAFC",
  textMuted: "#94A3B8",
  textFaint: "#64748B",
  gold: "#E5C058",
  goldDim: "#2A2312",
  goldBorder: "#E5C0584D",
  amber: "#F59E0B",
  amberDim: "#332109",
  red: "#F43F5E",
  redDim: "#33141B",
  violet: "#8B5CF6",
  blue: "#3B82F6",
  blueDim: "#13233E",
  green: "#10B981",
  greenDim: "#0D2B1F",
  teal: "#14B8A6",
  tealDim: "#0D2B26"
};

const CHANNEL_PALETTE = ["#3B82F6", "#8B5CF6", "#EC4899", "#E5C058", "#10B981", "#06B6D4"];

const STATUS_ORDER = ["PITCH", "ASSIGNMENT", "SCRIPT", "PRODUCTION", "QA", "COMPLETE"] as const;
const STATUS_LABEL: Record<string, string> = {
  PITCH: "Ý tưởng",
  ASSIGNMENT: "Đã giao",
  SCRIPT: "Kịch bản",
  PRODUCTION: "Sản xuất",
  QA: "Kiểm duyệt",
  COMPLETE: "Hoàn thành",
  ARCHIVED_IDEA: "Lưu trữ",
  CANCELLED: "Đã huỷ"
};

const STATUS_COLORS: Record<string, { bg: string; fg: string; bd: string }> = {
  PITCH: { bg: "#2E1A47", fg: "#C084FC", bd: "#8B5CF6" },
  ASSIGNMENT: { bg: "#332109", fg: "#FBBF24", bd: "#F59E0B" },
  SCRIPT: { bg: "#13233E", fg: "#60A5FA", bd: "#3B82F6" },
  PRODUCTION: { bg: "#2A1B38", fg: "#E879F9", bd: "#C026D3" },
  QA: { bg: "#381822", fg: "#FB7185", bd: "#F43F5E" },
  COMPLETE: { bg: "#0D2B1F", fg: "#34D399", bd: "#10B981" },
  ARCHIVED_IDEA: { bg: "#232F46", fg: "#94A3B8", bd: "#475569" },
  CANCELLED: { bg: "#2D181D", fg: "#FCA5A5", bd: "#EF4444" }
};

const ROLE_LABEL: Record<string, string> = { Core: "Core Team", E: "Editor", P: "Producer" };

const WEEKDAY_INFO: Record<number, { tag: string; title: string; who: string; desc: string }> = {
  1: { tag: "T2", title: "Mở nộp ý tưởng & Lên lịch tuần", who: "Core Team", desc: "Core mở cổng nhận ý tưởng mới và chuẩn bị định hướng kế hoạch tuần." },
  2: { tag: "T3", title: "Nộp ý tưởng & Duyệt Top ý tưởng", who: "E · P · Core", desc: "Editor & Producer pitch idea; Core duyệt top 5–6 ý tưởng, chốt người & số ngày." },
  3: { tag: "T4", title: "Nộp & Chỉnh sửa kịch bản", who: "P → E", desc: "Producer nộp kịch bản; Editor chỉnh sửa và xác nhận bấm máy sản xuất." },
  4: { tag: "T5", title: "Sản xuất & Quay dựng (Production)", who: "Producer", desc: "Quay dựng video theo số ngày đã chốt linh hoạt theo từng nền tảng." },
  5: { tag: "T6", title: "Sản xuất & Hậu kỳ (Production)", who: "Producer", desc: "Tiếp tục hoàn thiện bản dựng, âm thanh và color grading." },
  6: { tag: "T7", title: "Nộp video & Kiểm duyệt QA", who: "P → E", desc: "Producer nộp video draft; Editor đánh giá QA (Đạt + link đăng thật / Chưa đạt + lý do)." },
  0: { tag: "CN", title: "Ngày đệm & Báo cáo tổng kết tuần", who: "E · P · Core", desc: "Sửa lại các video chưa đạt; hệ thống tổng hợp báo cáo chỉ số tuần tự động." },
};

/* ---------------------------------------------------------------------
   HELPERS
--------------------------------------------------------------------- */
const iso = (d: any) => new Date(d).toISOString().slice(0, 10);
const today = new Date();
const todayIso = iso(today);
const fmtDate = (s: any) => { if (!s) return "—"; const d = new Date(s); return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`; };
const fmtDateFull = (s: any) => { if (!s) return "—"; const d = new Date(s); return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`; };
const fmtDateTime = (s: any) => { if (!s) return "—"; const d = new Date(s); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")} · ${fmtDate(d)}`; };

export function overdueInfo(idea: Idea) {
  if (idea.status === "ASSIGNMENT" && idea.assignedAt) {
    const hrs = (Date.now() - new Date(idea.assignedAt).getTime()) / 36e5;
    if (hrs > 24) return { level: "yellow", msg: "Quá 1 ngày chưa nộp kịch bản" };
  }
  if (idea.status === "PRODUCTION" && idea.endDate) {
    const end = new Date(iso(idea.endDate) + "T23:59:59");
    const diffDays = (end.getTime() - today.getTime()) / 864e5;
    if (diffDays < 0) return { level: "red", msg: `Đã trễ hạn (${fmtDate(idea.endDate)})` };
    if (diffDays <= 1) return { level: "yellow", msg: `Còn ≤1 ngày (${fmtDate(idea.endDate)})` };
  }
  if (idea.status === "QA" && idea.videoSubmittedAt) {
    const hrs = (Date.now() - new Date(idea.videoSubmittedAt).getTime()) / 36e5;
    if (hrs > 24) return { level: "yellow", msg: "Quá 24 giờ chưa duyệt QA" };
  }
  return null;
}

/* ---------------------------------------------------------------------
   STUDIO LOGO COMPONENT
--------------------------------------------------------------------- */
function StudioLogo({ size = 38, className = "" }: { size?: number; className?: string }) {
  return (
    <div 
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 shadow-lg ${className}`}
      style={{ 
        width: size, 
        height: size,
        border: "1.5px solid rgba(229, 192, 88, 0.4)",
        boxShadow: "0 0 15px rgba(229, 192, 88, 0.15)"
      }}>
      <img 
        src="/logo.png" 
        alt="Ý Niệm Điện Ảnh" 
        className="w-full h-full object-cover"
      />
    </div>
  );
}

/* ---------------------------------------------------------------------
   UI PRIMITIVES
--------------------------------------------------------------------- */
function UserAvatar({ name, size = 26, className = "" }: { name: string; size?: number; className?: string }) {
  if (!name) return null;
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    { bg: "#1E2A42", text: "#60A5FA", border: "#3B82F644" },
    { bg: "#2E1A47", text: "#C084FC", border: "#8B5CF644" },
    { bg: "#2C2413", text: "#E5C058", border: "#E5C05844" },
    { bg: "#0D2B1F", text: "#34D399", border: "#10B98144" },
    { bg: "#381822", text: "#FB7185", border: "#F43F5E44" }
  ];
  const c = colors[hash % colors.length];
  return (
    <div 
      className={`inline-flex items-center justify-center rounded-full font-bold uppercase shrink-0 select-none shadow-sm ${className}`}
      style={{ 
        width: size, 
        height: size, 
        background: c.bg, 
        color: c.text, 
        border: `1px solid ${c.border}`,
        fontSize: Math.max(10, size * 0.42)
      }}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

function Badge({ children, tone = "muted", className = "" }: { children: React.ReactNode; tone?: "muted" | "teal" | "amber" | "red" | "green" | "blue" | "purple" | "gold"; className?: string }) {
  const tones: Record<string, { bg: string; fg: string; bd: string }> = {
    muted: { bg: "#182132", fg: "#94A3B8", bd: "#232F46" },
    gold: { bg: "#2A2312", fg: "#E5C058", bd: "#E5C05866" },
    teal: { bg: "#0D2B26", fg: "#2DD4BF", bd: "#14B8A666" },
    amber: { bg: "#332109", fg: "#FBBF24", bd: "#F59E0B66" },
    red: { bg: "#33141B", fg: "#FB7185", bd: "#F43F5E66" },
    green: { bg: "#0D2B1F", fg: "#34D399", bd: "#10B98166" },
    blue: { bg: "#13233E", fg: "#60A5FA", bd: "#3B82F666" },
    purple: { bg: "#2E1A47", fg: "#C084FC", bd: "#8B5CF666" }
  };
  const t = tones[tone] || tones.muted;
  return (
    <span 
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${className}`}
      style={{ background: t.bg, color: t.fg, border: `1px solid ${t.bd}`, fontFamily: "var(--font-mono, monospace)" }}>
      {children}
    </span>
  );
}

function RoleChip({ role }: { role: string }) {
  if (role === "Core") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider font-mono bg-[#E5C058]/15 text-[#E5C058] border border-[#E5C058]/40 shadow-sm">
        CORE TEAM
      </span>
    );
  }
  if (role === "E") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider font-mono bg-[#3B82F6]/15 text-[#60A5FA] border border-[#3B82F6]/40 shadow-sm">
        EDITOR
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider font-mono bg-[#8B5CF6]/15 text-[#C084FC] border border-[#8B5CF6]/40 shadow-sm">
      PRODUCER
    </span>
  );
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div 
        className="w-full flex flex-col rounded-xl border shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden"
        style={{ 
          maxWidth: wide ? 800 : 520, 
          maxHeight: "90vh", 
          background: "#111723", 
          borderColor: "#232F46", 
          boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 20px rgba(229, 192, 88, 0.08)"
        }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#182234] bg-[#0E141F]">
          <h3 className="text-base font-bold text-white tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E5C058]" />
            {title}
          </h3>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-[#94A3B8] hover:text-white hover:bg-[#182132] transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) { 
  return (
    <label className="block mb-1.5 text-xs font-semibold tracking-wide text-[#94A3B8]">
      {children} {required && <span className="text-[#F43F5E]">*</span>}
    </label>
  ); 
}

const inputStyle = { 
  background: "#0D121B", 
  border: "1px solid #232F46", 
  color: "#F8FAFC", 
  borderRadius: 8 
};

function TextInput(props: any) { 
  return <input {...props} className={"w-full px-3.5 py-2.5 text-sm outline-none transition-all focus:border-[#E5C058] focus:ring-1 focus:ring-[#E5C058]/30 placeholder:text-[#64748B] " + (props.className||"")} style={{ ...inputStyle, ...(props.style||{}) }} />; 
}
function Select(props: any) { 
  return <select {...props} className={"w-full px-3.5 py-2.5 text-sm outline-none transition-all focus:border-[#E5C058] focus:ring-1 focus:ring-[#E5C058]/30 " + (props.className||"")} style={{ ...inputStyle, ...(props.style||{}) }} />; 
}
function TextArea(props: any) { 
  return <textarea {...props} className={"w-full px-3.5 py-2.5 text-sm outline-none transition-all focus:border-[#E5C058] focus:ring-1 focus:ring-[#E5C058]/30 placeholder:text-[#64748B] " + (props.className||"")} style={{ ...inputStyle, ...(props.style||{}) }} />; 
}

function Btn({ children, onClick, tone = "default", disabled, type = "button", small, loading, className = "" }: any) {
  const tones: Record<string, { bg: string; fg: string; bd: string; hover: string; shadow?: string }> = {
    default: { bg: "#182132", fg: "#F8FAFC", bd: "#232F46", hover: "#1F2C42" },
    primary: { bg: "linear-gradient(135deg, #F3D079 0%, #E5C058 50%, #B8860B 100%)", fg: "#080B11", bd: "#E5C058", hover: "brightness-110", shadow: "0 4px 14px rgba(229, 192, 88, 0.25)" },
    danger: { bg: "#33141B", fg: "#FB7185", bd: "#F43F5E66", hover: "#451A24" },
    ghost: { bg: "transparent", fg: "#94A3B8", bd: "transparent", hover: "#182132" },
    amber: { bg: "#332109", fg: "#FBBF24", bd: "#F59E0B", hover: "#452C0D" }
  };
  const t = tones[tone] || tones.default;
  const isGradient = t.bg.startsWith("linear-gradient");

  return (
    <button 
      type={type} 
      onClick={onClick} 
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-all active:scale-[0.98] ${small ? "px-3 py-1.5 text-xs" : "px-4 py-2.5 text-sm"} ${disabled || loading ? "opacity-40 cursor-not-allowed" : "hover:opacity-95"} ${className}`}
      style={{ 
        background: isGradient ? undefined : t.bg, 
        backgroundImage: isGradient ? t.bg : undefined,
        color: t.fg, 
        border: `1px solid ${t.bd}`,
        boxShadow: t.shadow || "none"
      }}>
      {loading ? <RefreshCw size={14} className="animate-spin" /> : children}
    </button>
  );
}

/* ---------------------------------------------------------------------
   LOGIN SCREEN (Ý NIỆM ĐIỆN ẢNH PORTAL)
--------------------------------------------------------------------- */
function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await loginWithCredentialsAction(emailValue, passwordValue);
      if (res && res.error) {
        setErrorMsg(res.error);
        setLoading(false);
        return;
      }
      window.location.reload();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Đăng nhập thất bại");
      setLoading(false);
    }
  }

  const fillAccount = (email: string, pass: string = "123") => {
    setEmailValue(email);
    setPasswordValue(pass);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#080B11] text-[#F8FAFC] relative overflow-hidden">
      {/* Cinematic Star / Nebula Lighting */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-[#E5C058]/10 blur-[120px] pointer-events-none top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-[#3B82F6]/10 blur-[100px] pointer-events-none bottom-10 right-10" />

      <div 
        className="w-full max-w-md p-8 sm:p-10 rounded-2xl border shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-300"
        style={{ 
          background: "linear-gradient(180deg, #111723 0%, #0D121B 100%)", 
          borderColor: "rgba(229, 192, 88, 0.25)",
          boxShadow: "0 30px 80px rgba(0,0,0,0.8), 0 0 30px rgba(229, 192, 88, 0.1)"
        }}>
        
        {/* BRAND IDENTITY */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-full overflow-hidden p-1 bg-gradient-to-tr from-[#B8860B] via-[#E5C058] to-[#FFF0B3] shadow-lg shadow-[#E5C058]/30 flex items-center justify-center animate-pulse">
              <img src="/logo.png" alt="Ý Niệm Điện Ảnh" className="w-full h-full rounded-full object-cover" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E5C058] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-[#E5C058]"></span>
            </span>
          </div>

          <h1 className="text-2xl font-bold tracking-wider text-white uppercase" style={{ fontFamily: "var(--font-brand, serif)" }}>
            Ý NIỆM ĐIỆN ẢNH
          </h1>
          <p className="text-xs text-[#E5C058] font-medium tracking-widest uppercase mt-1">
            NƠI Ý TƯỞNG CẤT CÁNH • PRODUCTION STUDIO
          </p>
          <div className="h-0.5 w-16 bg-gradient-to-r from-transparent via-[#E5C058]/50 to-transparent mt-3" />
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 rounded-lg flex items-center gap-2.5 text-xs bg-[#33141B] text-[#FB7185] border border-[#F43F5E]/40 animate-in shake duration-200">
            <AlertTriangle size={16} className="shrink-0 text-[#F43F5E]" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <FieldLabel required>Email đăng nhập (hoặc tên tài khoản)</FieldLabel>
            <TextInput 
              id="email" 
              type="text" 
              required 
              value={emailValue}
              onChange={(e: any) => setEmailValue(e.target.value)}
              placeholder="admin@ynda.vn hoặc producer1@ynda.vn" 
              autoFocus 
            />
          </div>

          <div>
            <FieldLabel required>Mật khẩu (hoặc số điện thoại)</FieldLabel>
            <TextInput 
              id="password" 
              type="password" 
              required 
              value={passwordValue}
              onChange={(e: any) => setPasswordValue(e.target.value)}
              placeholder="Nhập mật khẩu..." 
            />
          </div>

          <Btn tone="primary" type="submit" loading={loading} className="w-full justify-center py-3 mt-2 text-sm uppercase tracking-wider">
            Vào Không Gian Sản Xuất
          </Btn>
        </form>

        {/* QUICK LOGIN PILLS */}
        <div className="mt-8 pt-5 border-t border-[#182234] text-center">
          <p className="text-[11px] text-[#64748B] mb-2 font-mono">Tài khoản mẫu thử nghiệm:</p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button 
              type="button" 
              onClick={() => fillAccount("admin@ynda.vn")}
              className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-[#182132] hover:bg-[#232F46] text-[#E5C058] border border-[#232F46] transition-colors">
              👑 admin@ynda.vn
            </button>
            <button 
              type="button" 
              onClick={() => fillAccount("producer1@ynda.vn")}
              className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-[#182132] hover:bg-[#232F46] text-[#60A5FA] border border-[#232F46] transition-colors">
              🎬 producer1@ynda.vn
            </button>
            <button 
              type="button" 
              onClick={() => fillAccount("editor1@ynda.vn")}
              className="px-2.5 py-1 rounded-md text-[11px] font-mono bg-[#182132] hover:bg-[#232F46] text-[#C084FC] border border-[#232F46] transition-colors">
              ✂️ editor1@ynda.vn
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   MAIN APPLICATION
--------------------------------------------------------------------- */
interface ClientAppProps {
  initialMembers: Member[];
  initialPlatforms: Platform[];
  initialChannelGroups: ChannelGroup[];
  initialPlatformChannels: PlatformChannel[];
  initialIdeas: Idea[];
  initialComments: CommentItem[];
  initialAuditLogs: AuditLogItem[];
  initialNotifications: NotificationItem[];
  initialChecklists: ChecklistItem[];
  initialSettings: AppSettings;
  currentMemberId: string | null;
}

export default function ClientApp({
  initialMembers,
  initialPlatforms,
  initialChannelGroups,
  initialPlatformChannels,
  initialIdeas,
  initialComments,
  initialAuditLogs,
  initialNotifications,
  initialChecklists,
  initialSettings,
  currentMemberId
}: ClientAppProps) {
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => { 
    setToast(msg); 
    setTimeout(() => setToast(null), 3500); 
  };

  const members = initialMembers || [];
  const platforms = initialPlatforms || [];
  const channelGroups = initialChannelGroups || [];
  const platformChannels = initialPlatformChannels || [];
  const ideas = initialIdeas || [];
  const comments = initialComments || [];
  const auditLogs = initialAuditLogs || [];
  const notifications = initialNotifications || [];
  const checklists = initialChecklists || [];
  const settings = initialSettings || { discordWebhookUrl: '', externalCalendarUrl: '' };

  // Tab navigation
  const [tab, setTab] = useState("dashboard"); // Default: "Việc của tôi hôm nay"
  
  // Modals & Panels
  const [openIdea, setOpenIdea] = useState<Idea | null>(null);
  const [showNewIdea, setShowNewIdea] = useState(false);
  const [approveIdeaTarget, setApproveIdeaTarget] = useState<Idea | null>(null);
  const [qaRejectIdeaTarget, setQaRejectIdeaTarget] = useState<Idea | null>(null);
  const [qaCompleteIdeaTarget, setQaCompleteIdeaTarget] = useState<Idea | null>(null);
  const [cancelIdeaTarget, setCancelIdeaTarget] = useState<Idea | null>(null);
  const [schedulePostTarget, setSchedulePostTarget] = useState<Idea | null>(null);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [showNewPlatform, setShowNewPlatform] = useState(false);
  const [showNewMember, setShowNewMember] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [confirmDeleteChannel, setConfirmDeleteChannel] = useState<ChannelGroup | null>(null);
  const [showProfile, setShowProfile] = useState<Member | null>(null);
  const [editProfile, setEditProfile] = useState<Member | null>(null);
  const [showNotificationsFlyout, setShowNotificationsFlyout] = useState(false);
  const [notificationPage, setNotificationPage] = useState(1);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotificationsFlyout(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [submitScriptTarget, setSubmitScriptTarget] = useState<Idea | null>(null);
  const [submitVideoTarget, setSubmitVideoTarget] = useState<Idea | null>(null);
  const [reassignIdeaTarget, setReassignIdeaTarget] = useState<Idea | null>(null);
  const [editIdeaTarget, setEditIdeaTarget] = useState<Idea | null>(null);
  const [extendDeadlineTarget, setExtendDeadlineTarget] = useState<Idea | null>(null);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterChannelGroupId, setFilterChannelGroupId] = useState("ALL");
  const [filterPlatformId, setFilterPlatformId] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterAssignee, setFilterAssignee] = useState("ALL");
  const [filterOverdueOnly, setFilterOverdueOnly] = useState(false);
  const [sortMode, setSortMode] = useState("newest");
  const [boardSubTab, setBoardSubTab] = useState<"active" | "archived">("active");

  // Gantt & Calendar State
  const [ganttChannelId, setGanttChannelId] = useState<string | null>(
    channelGroups.find(c => !c.archived)?.id || null
  );
  const [ganttMonthOffset, setGanttMonthOffset] = useState(0);
  const [portfolioMemberId, setPortfolioMemberId] = useState<string | null>(currentMemberId);
  const [commentInput, setCommentInput] = useState("");

  // Sync openIdea when ideas change
  useEffect(() => {
    if (openIdea) {
      const updated = ideas.find(i => i.id === openIdea.id);
      if (updated) setOpenIdea(updated);
    }
  }, [ideas]);

  if (!currentMemberId) {
    return <LoginScreen />;
  }

  const actor = members.find(m => m.id === currentMemberId);

  // CRON CLIENT TRIGGER (E1, E3)
  useEffect(() => {
    if (actor) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const lastRun = localStorage.getItem(`cron_${actor.id}`);
      if (lastRun !== todayStr) {
        try {
          runAction(triggerDailyCronAction);
          localStorage.setItem(`cron_${actor.id}`, todayStr);
        } catch (err) {
          console.error("Cron failed", err);
        }
      }
    }
  }, [actor]);

  if (!actor) {
    return <LoginScreen />;
  }

  // Lookup maps
  const memberById = useMemo(() => Object.fromEntries(members.map(m => [m.id, m])), [members]);
  const platformById = useMemo(() => Object.fromEntries(platforms.map(p => [p.id, p])), [platforms]);
  const channelGroupById = useMemo(() => Object.fromEntries(channelGroups.map(cg => [cg.id, cg])), [channelGroups]);
  const pcById = useMemo(() => Object.fromEntries(platformChannels.map(pc => [pc.id, pc])), [platformChannels]);
  
  const activeChannels = channelGroups.filter(c => !c.archived);
  const trashedChannels = channelGroups.filter(c => c.archived);

  // Unread notifications count
  const unreadNotifications = notifications.filter(n => n.memberId === actor.id && !n.read);

  // Hotkeys handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNewIdea(false);
        setApproveIdeaTarget(null);
        setQaCompleteIdeaTarget(null);
        setQaRejectIdeaTarget(null);
        setSchedulePostTarget(null);
        setCancelIdeaTarget(null);
        setShowNewChannel(false);
        setShowNewPlatform(false);
        setShowNewMember(false);
        setShowSettingsModal(false);
        setConfirmDeleteChannel(null);
        setShowProfile(null);
        setEditProfile(null);
        setShowNotificationsFlyout(false);
        setShowChangePassword(false);
        setSubmitScriptTarget(null);
        setSubmitVideoTarget(null);
        setReassignIdeaTarget(null);
        setEditIdeaTarget(null);
        setExtendDeadlineTarget(null);
      }
      if (e.ctrlKey && e.key === 'n') {
        e.preventDefault();
        setShowNewIdea(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const router = useRouter();

  // Auto-refresh polling every 30s
  useEffect(() => {
    const id = setInterval(() => {
      router.refresh();
    }, 30000);
    return () => clearInterval(id);
  }, [router]);

  // Action runner
  const runAction = (fn: any, ...args: any) => {
    startTransition(async () => {
      try {
        const res = await fn(...args);
        if (res && res.error) {
          alert(res.error);
          return;
        }
        router.refresh();
      } catch (err: any) {
        alert(err.message || "Có lỗi xảy ra");
      }
    });
  };

  const handleLogout = async () => {
    await logoutAction();
    window.location.reload();
  };

  const TABS = [
    { id: "dashboard", label: "Việc của tôi hôm nay", icon: Clock },
    { id: "board", label: "Bảng ý tưởng", icon: LayoutGrid },
    { id: "gantt", label: "Gantt theo Kênh", icon: Calendar },
    { id: "timeline", label: "Timeline Tổng", icon: Layers },
    { id: "calendar", label: "Lịch đăng bài", icon: CalendarDays },
    { id: "reports", label: "Báo cáo tuần", icon: BarChart3 },
    { id: "members", label: "Đội ngũ & Audit Log", icon: Users },
    { id: "portfolio", label: "Portfolio Cá Nhân", icon: Award },
  ];

  return (
    <div className="min-h-screen bg-[#080B11] text-[#F8FAFC]" style={{ fontFamily: "var(--font-sans, sans-serif)" }}>

      {/* TOP HEADER */}
      <header className="sticky top-0 z-40 bg-[#0A0E17]/95 backdrop-blur-md border-b border-[#1A2436] px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* BRAND LOGO & TITLE */}
          <div className="flex items-center gap-3">
            <StudioLogo size={36} />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-wider text-base sm:text-lg" style={{ fontFamily: "var(--font-brand, serif)" }}>
                  Ý NIỆM ĐIỆN ẢNH
                </span>
                <span className="hidden md:inline-flex px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#E5C058]/15 text-[#E5C058] border border-[#E5C058]/30">
                  STUDIO HUB V4
                </span>
              </div>
              <div className="text-[11px] text-[#64748B] font-mono hidden sm:block">
                Hệ thống quản lý quy trình sản xuất nội dung
              </div>
            </div>
          </div>

          {/* ACTIONS & USER BAR */}
          <div className="flex items-center gap-2 sm:gap-3">
            {isPending && (
              <span className="flex items-center gap-1.5 text-xs text-[#E5C058] font-mono animate-pulse">
                <RefreshCw size={12} className="animate-spin" /> Đang đồng bộ...
              </span>
            )}

            {/* Discord Status Indicator */}
            {settings.discordWebhookUrl ? (
              <span className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Discord Connected
              </span>
            ) : (
              actor.role === "Core" && (
                <button onClick={() => setShowSettingsModal(true)} className="hidden lg:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono text-[#E5C058] bg-[#E5C058]/10 border border-[#E5C058]/30 hover:bg-[#E5C058]/20 transition-colors">
                  <Plus size={12} /> Cài Discord Webhook
                </button>
              )
            )}

            {/* Notifications Bell */}
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={() => setShowNotificationsFlyout(!showNotificationsFlyout)}
                className="relative p-2 rounded-lg hover:bg-[#182132] transition-colors text-[#94A3B8] hover:text-white">
                <Bell size={18} />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#F43F5E] text-[10px] font-bold text-white flex items-center justify-center shadow-md animate-bounce">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>

              {/* Notification Flyout */}
              {showNotificationsFlyout && (
                <div 
                  className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 border shadow-2xl"
                  style={{ background: "#111723", borderColor: "#232F46" }}>
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#182234]">
                    <span className="text-xs font-bold font-mono text-white flex items-center gap-2">
                      <Bell size={14} className="text-[#E5C058]" />
                      THÔNG BÁO ({unreadNotifications.length})
                    </span>
                    {unreadNotifications.length > 0 && (
                      <button onClick={() => runAction(markAllNotificationsAsReadAction)} className="text-[11px] text-[#E5C058] hover:underline font-medium">
                        Đã đọc tất cả
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-[#64748B] py-6 text-center italic">Chưa có thông báo nào.</p>
                    ) : (
                      notifications.slice((notificationPage - 1) * 15, notificationPage * 15).map(n => {
                        const isUnread = !n.read;
                        return (
                          <div key={n.id} 
                            onClick={() => {
                              if (!n.read) runAction(markNotificationAsReadAction, n.id);
                              if (n.relatedIdeaId) {
                                const found = ideas.find(i => i.id === n.relatedIdeaId);
                                if (found) setOpenIdea(found);
                              }
                              setShowNotificationsFlyout(false);
                            }}
                            className={`p-3 rounded-lg cursor-pointer transition-all text-xs ${isUnread ? 'bg-[#182132] border-l-2 border-[#E5C058]' : 'bg-[#0D121B] hover:bg-[#161E2E]'}`}>
                            <div className="text-[#F8FAFC] leading-relaxed">{n.message}</div>
                            <div className="text-[10px] text-[#64748B] font-mono mt-1">{fmtDateTime(n.createdAt)}</div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {notifications.length > 15 && (
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#182234] text-xs text-[#94A3B8]">
                      <button 
                        onClick={() => setNotificationPage(p => Math.max(1, p - 1))}
                        disabled={notificationPage === 1}
                        className="disabled:opacity-30 hover:text-white"
                      >Trước</button>
                      <span className="font-mono text-[11px]">Trang {notificationPage} / {Math.ceil(notifications.length / 15)}</span>
                      <button 
                        onClick={() => setNotificationPage(p => Math.min(Math.ceil(notifications.length / 15), p + 1))}
                        disabled={notificationPage === Math.ceil(notifications.length / 15)}
                        className="disabled:opacity-30 hover:text-white"
                      >Sau</button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Pill */}
            <div className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full bg-[#111723] border border-[#232F46] shadow-sm">
              <UserAvatar name={actor.name} size={24} />
              <span className="text-xs font-semibold text-white truncate max-w-[120px]">{actor.name}</span>
              <RoleChip role={actor.role} />
            </div>

            {/* Change Password */}
            <button onClick={() => setShowChangePassword(true)} title="Đổi mật khẩu" className="p-2 rounded-lg hover:bg-[#182132] text-[#94A3B8] hover:text-white transition-colors">
              <Lock size={17} />
            </button>

            {/* Settings button for Core */}
            {actor.role === "Core" && (
              <button onClick={() => setShowSettingsModal(true)} title="Cài đặt hệ thống" className="p-2 rounded-lg hover:bg-[#182132] text-[#94A3B8] hover:text-white transition-colors">
                <SettingsIcon size={17} />
              </button>
            )}

            {/* Logout */}
            <button onClick={handleLogout} title="Đăng xuất" className="p-2 rounded-lg hover:bg-[#182132] text-[#94A3B8] hover:text-[#F43F5E] transition-colors">
              <LogOut size={17} />
            </button>
          </div>

        </div>
      </header>

      {/* FILMSTRIP PRODUCTION SCHEDULE STRIP (T2 - CN) */}
      <div className="px-4 sm:px-6 py-3.5 bg-[#0C101A] border-b border-[#1A2436]">
        <div className="flex flex-col lg:flex-row items-stretch gap-3">
          
          {/* Day Selector Pills */}
          <div className="flex gap-1.5 items-center shrink-0 overflow-x-auto pb-1 lg:pb-0 no-scrollbar">
            {[1, 2, 3, 4, 5, 6, 0].map((d) => {
              const active = d === today.getDay();
              return (
                <div key={d} 
                  className={`flex flex-col items-center justify-center transition-all px-2.5 py-1.5 rounded-lg border ${active ? 'bg-gradient-to-b from-[#E5C058] to-[#B8860B] text-[#080B11] border-[#FFF0B3] shadow-lg shadow-[#E5C058]/20 scale-105' : 'bg-[#111723] text-[#94A3B8] border-[#232F46] hover:border-[#334155]'}`}
                  style={{ minWidth: 44, minHeight: 46 }}>
                  <span className={`font-mono text-xs font-extrabold ${active ? 'text-[#080B11]' : 'text-white'}`}>
                    {WEEKDAY_INFO[d].tag}
                  </span>
                  <span className={`text-[9px] font-mono mt-0.5 ${active ? 'text-[#080B11]/80 font-bold' : 'text-[#64748B]'}`}>
                    {d === today.getDay() ? "Hôm nay" : `T.${d === 0 ? 8 : d + 1}`}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Today Phase Slate Banner */}
          <div className="flex-1 flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-[#111723] border border-[#232F46]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#E5C058]/15 flex items-center justify-center text-[#E5C058] shrink-0 border border-[#E5C058]/30">
                <Clapperboard size={18} />
              </div>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-bold text-sm sm:text-base text-white tracking-wide">
                    {WEEKDAY_INFO[today.getDay()].title.toUpperCase()}
                  </span>
                  <span className="text-xs font-mono text-[#E5C058]">
                    · {fmtDateFull(todayIso)}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#182132] text-[#94A3B8] border border-[#232F46]">
                    Phụ trách: {WEEKDAY_INFO[today.getDay()].who}
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8] mt-0.5 truncate">{WEEKDAY_INFO[today.getDay()].desc}</p>
              </div>
            </div>

            {/* Quick action helper on T2/T3 for Core */}
            {actor.role === "Core" && (
              <div className="hidden sm:flex items-center gap-2">
                <Btn small tone="default" onClick={() => runAction(archiveUnselectedIdeasAction)}>
                  Lưu trữ idea cũ
                </Btn>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* NAVIGATION TABS */}
      <nav className="flex items-center gap-1 px-4 sm:px-6 pt-1.5 overflow-x-auto no-scrollbar bg-[#080B11] border-b border-[#1A2436]">
        {TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <button 
              key={t.id} 
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold transition-all whitespace-nowrap border-b-2 relative ${isActive ? 'text-[#E5C058] border-[#E5C058]' : 'text-[#94A3B8] border-transparent hover:text-white hover:border-[#334155]'}`}
              style={{ marginBottom: -1 }}>
              <t.icon size={16} className={isActive ? "text-[#E5C058]" : "text-[#64748B]"} /> 
              <span>{t.label}</span>
            </button>
          );
        })}
      </nav>

      {/* TAB CONTENT VIEWPORT */}
      <main className="p-4 sm:p-6 max-w-7xl mx-auto">
        {tab === "dashboard" && (
          <DashboardView 
            ideas={ideas}
            channelGroupById={channelGroupById}
            platformById={platformById}
            pcById={pcById}
            memberById={memberById}
            actor={actor}
            onOpen={setOpenIdea}
            onNewIdea={() => setShowNewIdea(true)}
            onApprove={setApproveIdeaTarget}
            onQaComplete={setQaCompleteIdeaTarget}
            onQaReject={setQaRejectIdeaTarget}
            onSubmitScript={setSubmitScriptTarget}
            onSubmitVideo={setSubmitVideoTarget}
            runAction={runAction}
          />
        )}

        {tab === "board" && (
          <BoardView 
            ideas={ideas}
            channelGroups={channelGroups}
            platforms={platforms}
            platformChannels={platformChannels}
            channelGroupById={channelGroupById}
            platformById={platformById}
            pcById={pcById}
            memberById={memberById}
            actor={actor}
            onOpen={setOpenIdea}
            onNewIdea={() => setShowNewIdea(true)}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            filterChannelGroupId={filterChannelGroupId}
            setFilterChannelGroupId={setFilterChannelGroupId}
            filterPlatformId={filterPlatformId}
            setFilterPlatformId={setFilterPlatformId}
            filterStatus={filterStatus}
            setFilterStatus={setFilterStatus}
            filterAssignee={filterAssignee}
            setFilterAssignee={setFilterAssignee}
            filterOverdueOnly={filterOverdueOnly}
            setFilterOverdueOnly={setFilterOverdueOnly}
            boardSubTab={boardSubTab}
            setBoardSubTab={setBoardSubTab}
            sortMode={sortMode}
            setSortMode={setSortMode}
            runAction={runAction}
          />
        )}

        {tab === "gantt" && (
          <ChannelGanttView 
            channelGroups={activeChannels}
            trashedChannelGroups={trashedChannels}
            platforms={platforms}
            platformChannels={platformChannels}
            ideas={ideas}
            channelGroupById={channelGroupById}
            platformById={platformById}
            pcById={pcById}
            memberById={memberById}
            actor={actor}
            ganttChannelId={ganttChannelId}
            setGanttChannelId={setGanttChannelId}
            monthOffset={ganttMonthOffset}
            setMonthOffset={setGanttMonthOffset}
            onNewChannel={() => setShowNewChannel(true)}
            onNewPlatform={() => setShowNewPlatform(true)}
            onDeleteChannel={setConfirmDeleteChannel}
            onRestoreChannel={(c: any) => runAction(restoreChannelGroupAction, c.id)}
            onOpenIdea={setOpenIdea}
          />
        )}

        {tab === "timeline" && (
          <MasterTimelineView 
            channelGroups={activeChannels}
            platforms={platforms}
            platformChannels={platformChannels}
            ideas={ideas}
            channelGroupById={channelGroupById}
            platformById={platformById}
            pcById={pcById}
            memberById={memberById}
            monthOffset={ganttMonthOffset}
            setMonthOffset={setGanttMonthOffset}
            onOpenIdea={setOpenIdea}
          />
        )}

        {tab === "calendar" && (
          <ContentCalendarView 
            ideas={ideas}
            channelGroupById={channelGroupById}
            platformById={platformById}
            pcById={pcById}
            memberById={memberById}
            actor={actor}
            settings={settings}
            onOpenIdea={setOpenIdea}
            onSchedulePost={setSchedulePostTarget}
          />
        )}

        {tab === "reports" && (
          <WeeklyReportView 
            ideas={ideas}
            channelGroups={channelGroups}
            platforms={platforms}
            platformChannels={platformChannels}
            members={members}
            channelGroupById={channelGroupById}
            actor={actor}
            runAction={runAction}
            showToast={showToast}
          />
        )}

        {tab === "members" && (
          <MembersAndAuditView 
            members={members}
            ideas={ideas}
            auditLogs={auditLogs}
            checklists={checklists}
            channelGroupById={channelGroupById}
            actor={actor}
            onShowProfile={setShowProfile}
            onAddMember={() => setShowNewMember(true)}
            onRemoveMember={(m: any) => { if (window.confirm("Bạn có chắc muốn xoá thành viên " + m.name + "?")) runAction(removeMemberAction, m.id); }}
            onToggleActive={(m: any, val: boolean) => runAction(toggleMemberActiveAction, m.id, val)}
            runAction={runAction}
          />
        )}

        {tab === "portfolio" && (
          <PortfolioView 
            members={members}
            ideas={ideas}
            channelGroupById={channelGroupById}
            platformById={platformById}
            pcById={pcById}
            selected={portfolioMemberId}
            setSelected={setPortfolioMemberId}
            showToast={showToast}
          />
        )}
      </main>

      {/* -------------------------------------------------------------
         MODALS
      ------------------------------------------------------------- */}

      {/* 1. NEW IDEA MODAL */}
      {showNewIdea && (
        <Modal title="Nộp ý tưởng mới (Pitching)" onClose={() => setShowNewIdea(false)}>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => { 
            e.preventDefault(); 
            const form = e.currentTarget;
            const title = (form.elements.namedItem("title") as HTMLInputElement).value;
            const description = (form.elements.namedItem("description") as HTMLTextAreaElement).value;
            const platformChannelId = (form.elements.namedItem("platformChannel") as HTMLSelectElement).value;

            if (!description.trim()) {
              alert("Mô tả ý tưởng là bắt buộc.");
              return;
            }

            runAction(submitIdeaAction, title, description, platformChannelId);
            setShowNewIdea(false);
            showToast(`Đã nộp ý tưởng "${title}"`);
          }}>
            <div className="space-y-4">
              <div>
                <FieldLabel required>Tên ý tưởng ngắn gọn</FieldLabel>
                <TextInput id="title" autoFocus required placeholder="VD: 5 mẹo góc máy điện ảnh..." />
              </div>

              <div>
                <FieldLabel required>Mô tả chi tiết nội dung</FieldLabel>
                <TextArea id="description" required rows={3} placeholder="Nói về gì, góc quay/tone dự kiến, link tham khảo (bắt buộc mô tả rõ ràng để Core duyệt)..." />
              </div>

              <div>
                <FieldLabel required>Kênh & Nền tảng</FieldLabel>
                <Select id="platformChannel" required>
                  {platformChannels.map((pc) => {
                    const ch = channelGroupById[pc.channelGroupId];
                    const pl = platformById[pc.platformId];
                    return (
                      <option key={pc.id} value={pc.id}>
                        {ch?.name || "Kênh"} — {pl?.name || "Nền tảng"} ({pl?.defaultDurationDays || 2} ngày)
                      </option>
                    );
                  })}
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-[#182234]">
              <Btn onClick={() => setShowNewIdea(false)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Nộp ý tưởng</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* 2. APPROVE IDEA MODAL */}
      {approveIdeaTarget && (
        <Modal title={`Duyệt ý tưởng — "${approveIdeaTarget.title}"`} onClose={() => setApproveIdeaTarget(null)}>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => { 
            e.preventDefault(); 
            const form = e.currentTarget;
            const days = parseInt((form.elements.namedItem("days") as HTMLInputElement).value, 10);
            const producer = (form.elements.namedItem("producer") as HTMLSelectElement).value;
            const pcId = (form.elements.namedItem("platformChannel") as HTMLSelectElement).value;

            const todayNum = new Date().getDay();
            if (todayNum !== 2) {
              const confirm = window.confirm("Hôm nay không phải thứ 3. Bạn có chắc chắn muốn duyệt ngoại lệ không?");
              if (!confirm) return;
            }

            runAction(approveIdeaAction, approveIdeaTarget.id, days, producer, pcId);
            setApproveIdeaTarget(null);
            showToast(`Đã duyệt "${approveIdeaTarget.title}"`);
          }}>
            <div className="space-y-4">
              <div>
                <FieldLabel>Kênh & Nền tảng</FieldLabel>
                <Select id="platformChannel" defaultValue={approveIdeaTarget.platformChannelId} required>
                  {platformChannels.map((pc) => {
                    const ch = channelGroupById[pc.channelGroupId];
                    const pl = platformById[pc.platformId];
                    return (
                      <option key={pc.id} value={pc.id}>
                        {ch?.name} — {pl?.name} (Mặc định {pl?.defaultDurationDays} ngày)
                      </option>
                    );
                  })}
                </Select>
              </div>

              <div>
                <FieldLabel required>Số ngày sản xuất</FieldLabel>
                <TextInput id="days" type="number" min={1} defaultValue={approveIdeaTarget.durationDays || 2} required />
              </div>

              <div>
                <FieldLabel required>Producer phụ trách (Bắt buộc)</FieldLabel>
                <Select id="producer" required defaultValue={approveIdeaTarget.assignedToEmail || ""}>
                  <option value="">-- Chọn 1 Producer --</option>
                  {members.filter(m => m.role === "P" && m.active).map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} {m.primaryExpertise ? `— [${m.primaryExpertise}]` : ""}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-[#182234]">
              <Btn onClick={() => setApproveIdeaTarget(null)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Xác nhận Duyệt</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* 3. QA COMPLETE MODAL */}
      {qaCompleteIdeaTarget && (
        <Modal title={`QA Đạt — "${qaCompleteIdeaTarget.title}"`} onClose={() => setQaCompleteIdeaTarget(null)}>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => { 
            e.preventDefault(); 
            const form = e.currentTarget;
            const link = (form.elements.namedItem("link") as HTMLInputElement).value;
            if (!link.trim()) {
              alert("Bắt buộc phải nhập link sản phẩm đã đăng thật.");
              return;
            }
            runAction(qaPassAction, qaCompleteIdeaTarget.id, link.trim());
            setQaCompleteIdeaTarget(null);
            showToast(`🎉 "${qaCompleteIdeaTarget.title}" đã hoàn thành!`);
          }}>
            <div className="space-y-4">
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Đánh dấu hoàn thành và ghi nhận credit chính thức cho đội ngũ. Bắt buộc cung cấp link video đã xuất bản công khai.
              </p>
              <div>
                <FieldLabel required>Link video đã đăng thật (YouTube / TikTok / Drive...)</FieldLabel>
                <TextInput id="link" required placeholder="https://youtube.com/watch?v=..." autoFocus />
              </div>
            </div>
            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-[#182234]">
              <Btn onClick={() => setQaCompleteIdeaTarget(null)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Hoàn tất QA</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* 4. QA REJECT MODAL */}
      {qaRejectIdeaTarget && (
        <Modal title={`QA Chưa Đạt — "${qaRejectIdeaTarget.title}"`} onClose={() => setQaRejectIdeaTarget(null)}>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => { 
            e.preventDefault(); 
            const form = e.currentTarget;
            const note = (form.elements.namedItem("note") as HTMLTextAreaElement).value;
            if (!note.trim()) {
              alert("Bắt buộc phải nhập lý do chưa đạt để Producer sửa.");
              return;
            }
            runAction(qaFailAction, qaRejectIdeaTarget.id, note.trim());
            setQaRejectIdeaTarget(null);
            showToast(`Đã trả về PRODUCTION: "${qaRejectIdeaTarget.title}"`);
          }}>
            <div className="space-y-4">
              <p className="text-xs text-[#FBBF24]">
                Ý tưởng sẽ quay lại trạng thái PRODUCTION kèm ghi chú sửa đổi cho Producer phụ trách.
              </p>
              <div>
                <FieldLabel required>Lý do & yêu cầu chỉnh sửa</FieldLabel>
                <TextArea id="note" required rows={3} placeholder="VD: Cắt ngắn đoạn mở đầu còn 3s, fix lại color grading cảnh phỏng vấn..." autoFocus />
              </div>
            </div>
            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-[#182234]">
              <Btn onClick={() => setQaRejectIdeaTarget(null)}>Huỷ</Btn>
              <Btn tone="danger" type="submit" loading={isPending}>Trả về PRODUCTION</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* 5. SCHEDULE POST DATE MODAL */}
      {schedulePostTarget && (
        <Modal title={`Lên lịch đăng bài — "${schedulePostTarget.title}"`} onClose={() => setSchedulePostTarget(null)}>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const form = e.currentTarget;
            const date = (form.elements.namedItem("postDate") as HTMLInputElement).value;
            runAction(updateScheduledPostDateAction, schedulePostTarget.id, date);
            setSchedulePostTarget(null);
            showToast("Đã cập nhật ngày đăng dự kiến.");
          }}>
            <div className="space-y-4">
              <div>
                <FieldLabel required>Ngày đăng bài dự kiến</FieldLabel>
                <TextInput id="postDate" type="date" defaultValue={schedulePostTarget.scheduledPostDate || todayIso} required />
              </div>
            </div>
            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-[#182234]">
              <Btn onClick={() => setSchedulePostTarget(null)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Lưu lịch</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* 6. CANCEL IDEA MODAL */}
      {cancelIdeaTarget && (
        <Modal title={`Huỷ ý tưởng — "${cancelIdeaTarget.title}"`} onClose={() => setCancelIdeaTarget(null)}>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => { 
            e.preventDefault(); 
            const form = e.currentTarget;
            const reason = (form.elements.namedItem("reason") as HTMLInputElement).value;
            runAction(cancelIdeaAction, cancelIdeaTarget.id, reason);
            setCancelIdeaTarget(null);
            showToast(`Đã huỷ "${cancelIdeaTarget.title}"`);
          }}>
            <p className="mb-3 text-xs text-[#94A3B8]">Ý tưởng sẽ được đưa vào danh sách Huỷ và lưu lại trong nhật ký hệ thống.</p>
            <FieldLabel>Lý do huỷ (không bắt buộc)</FieldLabel>
            <TextInput id="reason" placeholder="VD: Trùng format tuần trước..." className="mb-4" />
            <div className="flex justify-end gap-2.5 pt-3 border-t border-[#182234]">
              <Btn onClick={() => setCancelIdeaTarget(null)}>Đóng</Btn>
              <Btn tone="danger" type="submit" loading={isPending}>Xác nhận Huỷ</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* 7. CHANGE PASSWORD MODAL */}
      {showChangePassword && (
        <Modal title="Đổi Mật Khẩu" onClose={() => setShowChangePassword(false)}>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const form = e.currentTarget;
            const oldPass = (form.elements.namedItem("oldPass") as HTMLInputElement).value;
            const newPass = (form.elements.namedItem("newPass") as HTMLInputElement).value;
            runAction(changePasswordAction, oldPass, newPass);
            setShowChangePassword(false);
            showToast("Đã đổi mật khẩu thành công!");
          }}>
            <div className="space-y-4">
              <div>
                <FieldLabel required>Mật khẩu cũ (Hoặc SĐT)</FieldLabel>
                <TextInput id="oldPass" type="password" required autoFocus />
              </div>
              <div>
                <FieldLabel required>Mật khẩu mới</FieldLabel>
                <TextInput id="newPass" type="password" required />
              </div>
            </div>
            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-[#182234]">
              <Btn onClick={() => setShowChangePassword(false)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Lưu thay đổi</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* SUBMIT SCRIPT MODAL */}
      {submitScriptTarget && (
        <Modal title={`Nộp Kịch Bản — "${submitScriptTarget.title}"`} onClose={() => setSubmitScriptTarget(null)}>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const link = (e.currentTarget.elements.namedItem("link") as HTMLInputElement).value;
            runAction(submitScriptAction, submitScriptTarget.id, link);
            setSubmitScriptTarget(null);
            showToast("Đã nộp kịch bản!");
          }}>
            <div className="space-y-4">
              <div>
                <FieldLabel>Link kịch bản (Google Docs, Notion...)</FieldLabel>
                <TextInput id="link" type="url" placeholder="https://docs.google.com/..." autoFocus />
              </div>
            </div>
            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-[#182234]">
              <Btn onClick={() => setSubmitScriptTarget(null)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Nộp Kịch Bản</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* SUBMIT VIDEO MODAL */}
      {submitVideoTarget && (
        <Modal title={`Nộp Video (Draft) — "${submitVideoTarget.title}"`} onClose={() => setSubmitVideoTarget(null)}>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const link = (e.currentTarget.elements.namedItem("link") as HTMLInputElement).value;
            runAction(submitVideoAction, submitVideoTarget.id, link);
            setSubmitVideoTarget(null);
            showToast("Đã nộp video chờ QA!");
          }}>
            <div className="space-y-4">
              <div>
                <FieldLabel>Link video (Drive, Frame.io...)</FieldLabel>
                <TextInput id="link" type="url" placeholder="https://drive.google.com/..." autoFocus />
              </div>
            </div>
            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-[#182234]">
              <Btn onClick={() => setSubmitVideoTarget(null)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Nộp Video</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* CREATE CHANNEL GROUP MODAL */}
      {showNewChannel && (
        <Modal title="Tạo Kênh Dự Án Con Mới" onClose={() => setShowNewChannel(false)}>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => { 
            e.preventDefault(); 
            const form = e.currentTarget;
            const name = (form.elements.namedItem("name") as HTMLInputElement).value;
            const color = (form.elements.namedItem("color") as HTMLInputElement).value;
            
            const selectedPlats: string[] = [];
            platforms.forEach(p => {
              const el = form.elements.namedItem(`plat_${p.id}`) as HTMLInputElement;
              if (el && el.checked) selectedPlats.push(p.id);
            });

            runAction(createChannelGroupAction, name, color, selectedPlats);
            setShowNewChannel(false);
            showToast(`Đã tạo kênh "${name}"`);
          }}>
            <div className="space-y-4">
              <div>
                <FieldLabel required>Tên kênh</FieldLabel>
                <TextInput id="name" required placeholder="VD: Kênh Phim Ngắn..." autoFocus />
              </div>
              <div>
                <FieldLabel>Màu đại diện</FieldLabel>
                <div className="flex items-center gap-2">
                  <input type="color" id="color" defaultValue={CHANNEL_PALETTE[channelGroups.length % CHANNEL_PALETTE.length]} className="w-10 h-8 rounded border border-[#232F46] bg-transparent cursor-pointer" />
                  <span className="text-xs text-[#94A3B8]">Chọn màu nhận diện Gantt và thẻ bài.</span>
                </div>
              </div>
              <div>
                <FieldLabel>Chạy trên các nền tảng nào?</FieldLabel>
                <div className="space-y-2 mt-2">
                  {platforms.map(p => (
                    <label key={p.id} className="flex items-center gap-2.5 text-xs text-[#F8FAFC] cursor-pointer">
                      <input type="checkbox" id={`plat_${p.id}`} defaultChecked className="accent-[#E5C058] rounded" />
                      <span>{p.name}</span>
                      <span className="text-[11px] text-[#64748B] font-mono">({p.defaultDurationDays} ngày mặc định)</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-[#182234]">
              <Btn onClick={() => setShowNewChannel(false)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Tạo Kênh</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* CREATE PLATFORM MODAL */}
      {showNewPlatform && (
        <Modal title="Thêm Nền Tảng Mới" onClose={() => setShowNewPlatform(false)}>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const form = e.currentTarget;
            const name = (form.elements.namedItem("name") as HTMLInputElement).value;
            const days = parseInt((form.elements.namedItem("days") as HTMLInputElement).value, 10);
            runAction(createPlatformAction, name, days);
            setShowNewPlatform(false);
            showToast(`Đã thêm nền tảng "${name}"`);
          }}>
            <div className="space-y-4">
              <div>
                <FieldLabel required>Tên Nền tảng</FieldLabel>
                <TextInput id="name" required placeholder="VD: Shorts, Instagram Reels..." autoFocus />
              </div>
              <div>
                <FieldLabel required>Số ngày sản xuất mặc định</FieldLabel>
                <TextInput id="days" type="number" min={1} defaultValue={2} required />
              </div>
            </div>
            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-[#182234]">
              <Btn onClick={() => setShowNewPlatform(false)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Thêm Nền Tảng</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* ADD MEMBER MODAL */}
      {showNewMember && (
        <Modal title="Thêm Thành Viên Mới" onClose={() => setShowNewMember(false)}>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const form = e.currentTarget;
            const name = (form.elements.namedItem("name") as HTMLInputElement).value;
            const role = (form.elements.namedItem("role") as HTMLSelectElement).value;
            const email = (form.elements.namedItem("email") as HTMLInputElement).value;
            const password = (form.elements.namedItem("password") as HTMLInputElement).value;
            const phone = (form.elements.namedItem("phone") as HTMLInputElement).value;
            const facebook = (form.elements.namedItem("facebook") as HTMLInputElement).value;
            const primary = (form.elements.namedItem("primary") as HTMLSelectElement).value;
            const secondary = (form.elements.namedItem("secondary") as HTMLSelectElement).value;

            runAction(createMemberAction, name, role, email, password, phone, facebook, primary, secondary);
            setShowNewMember(false);
            showToast(`Đã thêm thành viên "${name}"`);
          }}>
            <div className="space-y-3">
              <div>
                <FieldLabel required>Họ và Tên</FieldLabel>
                <TextInput id="name" required placeholder="Nguyễn Văn A" autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel required>Vai trò</FieldLabel>
                  <Select id="role" required>
                    <option value="P">Producer (P)</option>
                    <option value="E">Editor (E)</option>
                    <option value="Core">Core Team</option>
                  </Select>
                </div>
                <div>
                  <FieldLabel required>Mật khẩu ban đầu</FieldLabel>
                  <TextInput id="password" defaultValue="123" required />
                </div>
              </div>
              <div>
                <FieldLabel required>Email đăng nhập (ID duy nhất)</FieldLabel>
                <TextInput id="email" type="email" required placeholder="vidu@ynda.vn" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Số điện thoại</FieldLabel>
                  <TextInput id="phone" placeholder="090..." />
                </div>
                <div>
                  <FieldLabel>Facebook link</FieldLabel>
                  <TextInput id="facebook" placeholder="https://fb.com/..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
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
            </div>
            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-[#182234]">
              <Btn onClick={() => setShowNewMember(false)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Tạo Thành Viên</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* SYSTEM SETTINGS MODAL */}
      {showSettingsModal && (
        <Modal title="Cài Đặt Hệ Thống" onClose={() => setShowSettingsModal(false)}>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const form = e.currentTarget;
            const discord = (form.elements.namedItem("discord") as HTMLInputElement).value;
            const calendar = (form.elements.namedItem("calendar") as HTMLInputElement).value;
            runAction(updateSettingsAction, discord, calendar);
            setShowSettingsModal(false);
            showToast("Đã lưu cài đặt hệ thống.");
          }}>
            <div className="space-y-4">
              <div>
                <FieldLabel>Discord Webhook URL (Kênh thông báo & Báo cáo tuần)</FieldLabel>
                <TextInput id="discord" defaultValue={settings.discordWebhookUrl} placeholder="https://discord.com/api/webhooks/..." />
                <span className="text-[11px] text-[#64748B] mt-1 block">
                  Tự động bắn thông báo khi nộp idea, giao việc, QA, bình luận và gửi báo cáo tuần vào Discord.
                </span>
              </div>
              <div>
                <FieldLabel>Link Nhúng Lịch Ngoài (Notion / Google Calendar Embed URL)</FieldLabel>
                <TextInput id="calendar" defaultValue={settings.externalCalendarUrl} placeholder="https://calendar.google.com/calendar/embed?..." />
              </div>
            </div>
            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-[#182234]">
              <Btn onClick={() => setShowSettingsModal(false)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Lưu Cài Đặt</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* IDEA DETAILS MODAL */}
      {openIdea && (
        <IdeaDetailModal 
          idea={openIdea}
          onClose={() => setOpenIdea(null)}
          actor={actor}
          channelGroupById={channelGroupById}
          platformById={platformById}
          pcById={pcById}
          memberById={memberById}
          comments={comments.filter(c => c.ideaId === openIdea.id)}
          commentInput={commentInput}
          setCommentInput={setCommentInput}
          onApprove={() => { setApproveIdeaTarget(openIdea); setOpenIdea(null); }}
          onQaComplete={() => { setQaCompleteIdeaTarget(openIdea); setOpenIdea(null); }}
          onQaReject={() => { setQaRejectIdeaTarget(openIdea); setOpenIdea(null); }}
          onCancel={() => { setCancelIdeaTarget(openIdea); setOpenIdea(null); }}
          onSchedule={() => { setSchedulePostTarget(openIdea); setOpenIdea(null); }}
          runAction={runAction}
          showToast={showToast}
        />
      )}

      {/* CONFIRM DELETE CHANNEL MODAL */}
      {confirmDeleteChannel && (
        <Modal title={`Xoá kênh "${confirmDeleteChannel.name}"?`} onClose={() => setConfirmDeleteChannel(null)}>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            Nếu kênh đã có bài viết/idea thật, kênh sẽ được đưa vào <b>Thùng rác</b> (có thể khôi phục lại bất cứ lúc nào). Nếu kênh trống, sẽ xoá vĩnh viễn.
          </p>
          <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-[#182234]">
            <Btn onClick={() => setConfirmDeleteChannel(null)}>Huỷ</Btn>
            <Btn tone="danger" onClick={() => { 
              runAction(archiveChannelGroupAction, confirmDeleteChannel.id); 
              setConfirmDeleteChannel(null); 
              showToast(`Đã xoá kênh "${confirmDeleteChannel.name}"`);
            }}>
              Đồng ý Xoá
            </Btn>
          </div>
        </Modal>
      )}

      {/* TOAST POPUP */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 z-50 animate-in slide-in-from-bottom-5 duration-200 rounded-xl bg-[#111723] border border-[#E5C058]/50 text-white text-xs font-medium shadow-2xl flex items-center gap-2">
          <Sparkles size={15} className="text-[#E5C058]" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   VIEW COMPONENTS
--------------------------------------------------------------------- */

/* TAB 1: DASHBOARD "VIỆC CỦA TÔI HÔM NAY" */
function DashboardView({
  ideas,
  channelGroupById,
  platformById,
  pcById,
  memberById,
  actor,
  onOpen,
  onNewIdea,
  onApprove,
  onQaComplete,
  onQaReject,
  runAction
}: any) {
  const myActionTasks = ideas.filter((i: Idea) => {
    if (i.assignedToEmail !== actor.id) return false;
    return i.status === "ASSIGNMENT" || i.status === "PRODUCTION" || (i.status === "QA" && i.qaFeedback);
  });

  const sortedMyTasks = [...myActionTasks].sort((a, b) => {
    const aOverdue = overdueInfo(a) ? 1 : 0;
    const bOverdue = overdueInfo(b) ? 1 : 0;
    return bOverdue - aOverdue;
  });

  const pendingPitchIdeas = ideas.filter((i: Idea) => i.status === "PITCH");
  const pendingQaIdeas = ideas.filter((i: Idea) => i.status === "QA");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E5C058]" />
            VIỆC CỦA TÔI HÔM NAY
          </h2>
          <p className="text-xs text-[#94A3B8] mt-1">Xin chào <b className="text-white">{actor.name}</b>, đây là các nhiệm vụ cần bạn xử lý trực tiếp.</p>
        </div>
        <Btn tone="primary" onClick={onNewIdea}><Plus size={15} /> Nộp ý tưởng mới</Btn>
      </div>

      {/* SECTION 1: MY ACTIVE TASKS */}
      <div className="p-5 rounded-xl border border-[#232F46] bg-[#111723] shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-[#E5C058]" />
            <h3 className="font-bold text-sm text-white uppercase tracking-wider">Nhiệm vụ trực tiếp của bạn ({sortedMyTasks.length})</h3>
          </div>
          {sortedMyTasks.length > 0 && <span className="text-xs text-[#FBBF24] font-mono">Đang chờ bạn thực hiện</span>}
        </div>

        {sortedMyTasks.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#64748B]">
            🎉 Tuyệt vời! Bạn không có ý tưởng nào bị trễ hạn hoặc đang chờ nộp bài.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedMyTasks.map((idea: Idea) => {
              const od = overdueInfo(idea);
              const pc = pcById[idea.platformChannelId];
              const ch = pc ? channelGroupById[pc.channelGroupId] : null;
              const pl = pc ? platformById[pc.platformId] : null;

              return (
                <div key={idea.id}
                  className={`p-4 rounded-xl border transition-all ${od?.level === 'red' ? 'border-[#F43F5E]/60 bg-[#33141B]/30' : 'border-[#232F46] bg-[#182132] hover:border-[#E5C058]/40'}`}
                  style={{ borderLeftWidth: 4, borderLeftColor: od?.level === 'red' ? '#F43F5E' : (ch?.color || '#E5C058') }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-mono text-[#94A3B8] truncate">{ch?.name} · {pl?.name}</span>
                    <Badge tone={idea.status === "ASSIGNMENT" ? "amber" : (idea.status === "PRODUCTION" ? "blue" : "purple")}>
                      {STATUS_LABEL[idea.status]}
                    </Badge>
                  </div>

                  <h4 onClick={() => onOpen(idea)} className="font-bold text-sm text-white mb-2 cursor-pointer hover:text-[#E5C058] line-clamp-2 leading-snug">
                    {idea.title}
                  </h4>

                  {od && (
                    <div className={`mb-3 text-xs font-mono flex items-center gap-1.5 ${od.level === 'red' ? 'text-[#FB7185] font-bold' : 'text-[#FBBF24]'}`}>
                      <AlertTriangle size={13} /> {od.msg}
                    </div>
                  )}

                  {idea.qaFeedback && (
                    <div className="mb-3 p-2.5 rounded-lg bg-[#33141B]/60 border border-[#F43F5E]/30 text-xs text-[#FB7185] leading-relaxed">
                      <b>Yêu cầu sửa:</b> {idea.qaFeedback}
                    </div>
                  )}

                  {/* Direct Action Buttons */}
                  <div className="mt-3 pt-3 border-t border-[#232F46] flex items-center justify-between gap-2">
                    <button onClick={() => onOpen(idea)} className="text-xs text-[#94A3B8] hover:text-white flex items-center gap-1">
                      <Eye size={13} /> Chi tiết
                    </button>
                    {idea.status === "ASSIGNMENT" && actor.role === "P" && (
                      <Btn small tone="primary" onClick={() => runAction(submitScriptAction, idea.id)}>
                        Nộp kịch bản
                      </Btn>
                    )}
                    {idea.status === "PRODUCTION" && actor.role === "P" && (
                      <Btn small tone="primary" onClick={() => runAction(submitVideoAction, idea.id)}>
                        Nộp video
                      </Btn>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: REVIEW QUEUES FOR CORE / EDITOR */}
      {(actor.role === "Core" || actor.role === "E") && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* PITCH REVIEW QUEUE (Core only) */}
          {actor.role === "Core" && (
            <div className="p-5 rounded-xl border border-[#232F46] bg-[#111723] shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Lightbulb size={17} className="text-[#E5C058]" />
                  <h3 className="font-bold text-sm text-white">Ý tưởng chờ duyệt Pitch ({pendingPitchIdeas.length})</h3>
                </div>
                <span className="text-xs text-[#64748B] font-mono">Thứ Ba duyệt</span>
              </div>
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {pendingPitchIdeas.length === 0 ? (
                  <p className="text-xs text-[#64748B] py-4 text-center italic">Không có ý tưởng nào đang chờ duyệt.</p>
                ) : (
                  pendingPitchIdeas.map((idea: Idea) => (
                    <div key={idea.id} className="p-3 rounded-lg bg-[#182132] border border-[#232F46] flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div onClick={() => onOpen(idea)} className="text-xs font-semibold text-white truncate cursor-pointer hover:text-[#E5C058]">
                          {idea.title}
                        </div>
                        <div className="text-[11px] text-[#64748B] mt-0.5">Bởi: {memberById[idea.submittedByEmail]?.name || idea.submittedByEmail}</div>
                      </div>
                      <Btn small tone="primary" onClick={() => onApprove(idea)}>Duyệt</Btn>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* QA REVIEW QUEUE (Editor + Core) */}
          <div className="p-5 rounded-xl border border-[#232F46] bg-[#111723] shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck size={17} className="text-[#34D399]" />
                <h3 className="font-bold text-sm text-white">Video chờ kiểm duyệt QA ({pendingQaIdeas.length})</h3>
              </div>
              <span className="text-xs text-[#64748B] font-mono">Thứ Bảy QA</span>
            </div>
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {pendingQaIdeas.length === 0 ? (
                <p className="text-xs text-[#64748B] py-4 text-center italic">Không có video nào đang chờ QA.</p>
              ) : (
                pendingQaIdeas.map((idea: Idea) => (
                  <div key={idea.id} className="p-3 rounded-lg bg-[#182132] border border-[#232F46] flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div onClick={() => onOpen(idea)} className="text-xs font-semibold text-white truncate cursor-pointer hover:text-[#E5C058]">
                        {idea.title}
                      </div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">Producer: {memberById[idea.assignedToEmail]?.name || idea.assignedToEmail}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Btn small tone="primary" onClick={() => onQaComplete(idea)}>Đạt</Btn>
                      <Btn small tone="danger" onClick={() => onQaReject(idea)}>Chưa đạt</Btn>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* TAB 2: KANBAN BOARD VIEW */
function BoardView({
  ideas,
  channelGroups,
  platforms,
  platformChannels,
  channelGroupById,
  platformById,
  pcById,
  memberById,
  actor,
  onOpen,
  onNewIdea,
  searchQuery,
  setSearchQuery,
  filterChannelGroupId,
  setFilterChannelGroupId,
  filterPlatformId,
  setFilterPlatformId,
  filterStatus,
  setFilterStatus,
  filterAssignee,
  setFilterAssignee,
  filterOverdueOnly,
  setFilterOverdueOnly,
  boardSubTab,
  setBoardSubTab,
  sortMode,
  setSortMode,
  runAction
}: any) {
  const filteredIdeas = useMemo(() => {
    return ideas.filter((idea: Idea) => {
      if (boardSubTab === "active") {
        if (idea.status === "ARCHIVED_IDEA" || idea.status === "CANCELLED") return false;
      } else {
        if (idea.status !== "ARCHIVED_IDEA") return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = idea.title?.toLowerCase().includes(q);
        const matchDesc = idea.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }

      const pc = pcById[idea.platformChannelId];
      if (filterChannelGroupId !== "ALL") {
        if (!pc || pc.channelGroupId !== filterChannelGroupId) return false;
      }

      if (filterPlatformId !== "ALL") {
        if (!pc || pc.platformId !== filterPlatformId) return false;
      }

      if (filterStatus !== "ALL") {
        if (idea.status !== filterStatus) return false;
      }

      if (filterAssignee !== "ALL") {
        if (idea.assignedToEmail !== filterAssignee) return false;
      }

      if (filterOverdueOnly) {
        if (!overdueInfo(idea)) return false;
      }

      return true;
    });
  }, [ideas, boardSubTab, searchQuery, filterChannelGroupId, filterPlatformId, filterStatus, filterAssignee, filterOverdueOnly, pcById]);

  return (
    <div>
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white tracking-wide">BẢNG Ý TƯỞNG (KANBAN)</h2>
          <div className="flex rounded-lg p-0.5 bg-[#111723] border border-[#232F46] text-xs">
            <button onClick={() => setBoardSubTab("active")} className={`px-3 py-1 rounded-md transition-all ${boardSubTab === "active" ? "bg-[#E5C058]/15 text-[#E5C058] font-bold" : "text-[#94A3B8] hover:text-white"}`}>
              Đang thực hiện ({ideas.filter((i: Idea) => i.status !== "ARCHIVED_IDEA" && i.status !== "CANCELLED").length})
            </button>
            <button onClick={() => setBoardSubTab("archived")} className={`px-3 py-1 rounded-md transition-all ${boardSubTab === "archived" ? "bg-[#F59E0B]/15 text-[#FBBF24] font-bold" : "text-[#94A3B8] hover:text-white"}`}>
              Lưu trữ ({ideas.filter((i: Idea) => i.status === "ARCHIVED_IDEA").length})
            </button>
          </div>
        </div>

        <Btn tone="primary" onClick={onNewIdea}><Plus size={15} /> Nộp ý tưởng</Btn>
      </div>

      {/* FILTER BAR */}
      <div className="p-3.5 rounded-xl bg-[#111723] border border-[#232F46] mb-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[220px] relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm theo tên ý tưởng hoặc mô tả..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-lg bg-[#0D121B] border border-[#232F46] text-white outline-none focus:border-[#E5C058]"
            />
          </div>

          {/* Channel Group Filter */}
          <select 
            value={filterChannelGroupId} 
            onChange={(e) => setFilterChannelGroupId(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg bg-[#0D121B] border border-[#232F46] text-[#F8FAFC] outline-none">
            <option value="ALL">Tất cả Kênh</option>
            {channelGroups.map((cg: ChannelGroup) => (
              <option key={cg.id} value={cg.id}>{cg.name}</option>
            ))}
          </select>

          {/* Platform Filter */}
          <select 
            value={filterPlatformId} 
            onChange={(e) => setFilterPlatformId(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg bg-[#0D121B] border border-[#232F46] text-[#F8FAFC] outline-none">
            <option value="ALL">Tất cả Nền tảng</option>
            {platforms.map((p: Platform) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Assignee Filter */}
          <select 
            value={filterAssignee} 
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg bg-[#0D121B] border border-[#232F46] text-[#F8FAFC] outline-none">
            <option value="ALL">Tất cả Phụ trách</option>
            {Object.values(memberById).map((m: any) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>

          {/* Overdue checkbox */}
          <label className="flex items-center gap-1.5 text-xs text-[#FB7185] font-medium cursor-pointer ml-auto">
            <input 
              type="checkbox" 
              checked={filterOverdueOnly} 
              onChange={(e) => setFilterOverdueOnly(e.target.checked)} 
              className="accent-[#F43F5E] rounded"
            />
            <span>Chỉ xem trễ hạn</span>
          </label>
        </div>
      </div>

      {/* KANBAN COLUMNS */}
      {boardSubTab === "active" ? (
        <div className="grid gap-3.5 overflow-x-auto pb-4" style={{ gridTemplateColumns: `repeat(${STATUS_ORDER.length}, minmax(240px, 1fr))` }}>
          {STATUS_ORDER.map((status) => {
            const colIdeas = filteredIdeas.filter((i: Idea) => i.status === status);
            const colStyle = STATUS_COLORS[status] || { bg: "#182132", fg: "#94A3B8", bd: "#232F46" };

            return (
              <div key={status} className="flex flex-col min-w-[240px] bg-[#111723]/80 p-3 rounded-xl border border-[#232F46]">
                <div className="flex items-center justify-between mb-3 px-1">
                  <span className="font-mono text-xs font-bold tracking-wider" style={{ color: colStyle.fg }}>
                    {STATUS_LABEL[status].toUpperCase()}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#182132] text-[#94A3B8] font-bold border border-[#232F46]">
                    {colIdeas.length}
                  </span>
                </div>

                <div className="space-y-2.5 overflow-y-auto max-h-[calc(100vh-320px)] pr-1 min-h-[120px]">
                  {colIdeas.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center py-8 px-2 text-center border border-dashed border-[#232F46] rounded-xl bg-[#0D121B]/40">
                      <p className="text-[11px] text-[#64748B] mb-2 font-mono italic">Chưa có thẻ nào</p>
                      {status === "PITCH" && (
                        <button onClick={onNewIdea} className="text-[11px] font-semibold text-[#E5C058] hover:underline flex items-center gap-1">
                          <Plus size={11} /> Nộp ý tưởng
                        </button>
                      )}
                    </div>
                  ) : (
                    colIdeas.map((idea: Idea) => {
                      const od = overdueInfo(idea);
                      const pc = pcById[idea.platformChannelId];
                      const ch = pc ? channelGroupById[pc.channelGroupId] : null;
                      const pl = pc ? platformById[pc.platformId] : null;
                      const assignee = memberById[idea.assignedToEmail];

                      return (
                        <div key={idea.id}
                          onClick={() => onOpen(idea)}
                          className={`p-3.5 rounded-xl cursor-pointer transition-all hover:scale-[1.01] hover:shadow-xl ${od?.level === 'red' ? 'border border-[#F43F5E] bg-[#33141B]/20' : 'border border-[#232F46] bg-[#182132] hover:border-[#E5C058]/50'}`}
                          style={{ borderLeftWidth: 4, borderLeftColor: od?.level === 'red' ? '#F43F5E' : (ch?.color || '#E5C058') }}>
                          
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <span className="text-[11px] font-mono text-[#94A3B8] truncate">{ch?.name || "Kênh"}</span>
                            {pl && <Badge tone="muted" className="text-[10px]">{pl.name}</Badge>}
                          </div>

                          <h4 className="text-sm font-bold text-white line-clamp-2 mb-1.5 leading-snug">
                            {idea.title}
                          </h4>

                          {idea.description && (
                            <p className="text-xs text-[#94A3B8] line-clamp-2 mb-2 leading-relaxed">
                              {idea.description}
                            </p>
                          )}

                          {od && (
                            <div className={`mb-2 text-[11px] font-mono flex items-center gap-1.5 ${od.level === 'red' ? 'text-[#FB7185] font-bold' : 'text-[#FBBF24]'}`}>
                              <AlertTriangle size={12} /> {od.msg}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-2.5 border-t border-[#232F46] mt-2">
                            <span className="truncate">
                              {assignee ? (
                                <span className="text-[#E2E8F0] font-medium flex items-center gap-1">
                                  <UserAvatar name={assignee.name} size={16} />
                                  <span className="truncate">{assignee.name}</span>
                                </span>
                              ) : (
                                <span className="text-[#64748B]">Chưa gán</span>
                              )}
                            </span>
                            {idea.endDate && <span className="font-mono text-[#94A3B8]">{fmtDate(idea.endDate)}</span>}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ARCHIVED IDEAS TAB */
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#332109]/40 border border-[#F59E0B]/30 text-xs text-[#FBBF24]">
            💡 Đây là danh sách các ý tưởng ở PITCH quá 2 tuần liên tiếp không được chọn, đã tự động chuyển sang lưu trữ để tránh dồn ứ bảng làm việc. Core có thể khôi phục lại bất kỳ lúc nào.
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIdeas.map((idea: Idea) => {
              const pc = pcById[idea.platformChannelId];
              const ch = pc ? channelGroupById[pc.channelGroupId] : null;
              const submitter = memberById[idea.submittedByEmail];

              return (
                <div key={idea.id} className="p-4 rounded-xl bg-[#111723] border border-[#232F46]">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <span className="text-xs text-[#94A3B8] font-mono">{ch?.name || "Kênh"}</span>
                    <Badge tone="amber">Lưu trữ</Badge>
                  </div>
                  <h4 className="font-bold text-sm text-white mb-1.5">{idea.title}</h4>
                  <p className="text-xs text-[#94A3B8] line-clamp-3 mb-3 leading-relaxed">{idea.description || "Không có mô tả"}</p>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-[#182234] text-xs text-[#64748B]">
                    <span>Nộp bởi: {submitter?.name || idea.submittedByEmail}</span>
                    {actor.role === "Core" && (
                      <Btn small tone="primary" onClick={() => runAction(restoreArchivedIdeaAction, idea.id)}>
                        <RotateCcw size={12} /> Khôi phục
                      </Btn>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* TAB 3: GANTT THEO KÊNH */
function ChannelGanttView({
  channelGroups,
  trashedChannelGroups,
  platforms,
  platformChannels,
  ideas,
  channelGroupById,
  platformById,
  pcById,
  memberById,
  actor,
  ganttChannelId,
  setGanttChannelId,
  monthOffset,
  setMonthOffset,
  onNewChannel,
  onNewPlatform,
  onDeleteChannel,
  onRestoreChannel,
  onOpenIdea
}: any) {
  const selectedChannel = channelGroups.find((c: ChannelGroup) => c.id === ganttChannelId) || channelGroups[0];

  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + monthOffset);
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = `Tháng ${month + 1}/${year}`;

  const channelPcs = platformChannels.filter((pc: PlatformChannel) => pc.channelGroupId === selectedChannel?.id);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">GANTT THEO KÊNH</h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">Tiến độ chi tiết từng nền tảng trong dự án con.</p>
        </div>
        <div className="flex items-center gap-2">
          {actor.role === "Core" && (
            <>
              <Btn tone="default" onClick={onNewPlatform}><Plus size={14} /> Thêm nền tảng</Btn>
              <Btn tone="primary" onClick={onNewChannel}><Plus size={14} /> Tạo kênh mới</Btn>
            </>
          )}
        </div>
      </div>

      {/* CHANNEL SELECTOR PILLS */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        {channelGroups.map((cg: ChannelGroup) => (
          <div key={cg.id} 
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border transition-all cursor-pointer ${selectedChannel?.id === cg.id ? 'bg-[#182132] border-[#E5C058] shadow-md' : 'bg-[#111723] border-[#232F46] hover:border-[#334155]'}`}
            onClick={() => setGanttChannelId(cg.id)}>
            <span style={{ width: 10, height: 10, borderRadius: 5, background: cg.color }} />
            <span className="text-xs font-bold text-white">{cg.name}</span>
            {actor.role === "Core" && (
              <button onClick={(e) => { e.stopPropagation(); onDeleteChannel(cg); }} className="ml-1 text-[#64748B] hover:text-[#F43F5E]">
                <Trash2 size={12} />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* MONTH NAVIGATION */}
      <div className="flex items-center justify-between bg-[#111723] p-3.5 rounded-xl border border-[#232F46] mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setMonthOffset(monthOffset - 1)} className="p-1.5 rounded-lg bg-[#182132] text-[#94A3B8] hover:text-white">
            <ChevronLeft size={16} />
          </button>
          <span className="font-mono text-sm font-bold text-white px-3">{monthLabel}</span>
          <button onClick={() => setMonthOffset(monthOffset + 1)} className="p-1.5 rounded-lg bg-[#182132] text-[#94A3B8] hover:text-white">
            <ChevronRight size={16} />
          </button>
          {monthOffset !== 0 && (
            <button onClick={() => setMonthOffset(0)} className="text-xs text-[#E5C058] ml-2 hover:underline font-mono font-bold">
              Hôm nay
            </button>
          )}
        </div>
        <div className="text-xs text-[#94A3B8] font-mono">
          {daysInMonth} ngày trong tháng
        </div>
      </div>

      {/* GANTT CANVAS */}
      <div className="overflow-x-auto rounded-xl border border-[#232F46] bg-[#111723]">
        <div style={{ minWidth: 900 }}>
          {/* Header Row */}
          <div className="flex border-b border-[#232F46] bg-[#0E141F] py-2.5 text-center text-xs font-mono font-bold text-[#94A3B8]">
            <div className="w-60 shrink-0 text-left px-4">Nền tảng & Ý tưởng</div>
            <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${daysInMonth}, 1fr)` }}>
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const d = new Date(year, month, dayNum);
                const isToday = d.toISOString().slice(0, 10) === todayIso;
                return (
                  <div key={dayNum} className={`py-1 text-[11px] ${isToday ? 'bg-[#E5C058]/20 text-[#E5C058] font-extrabold rounded' : ''}`}>
                    {dayNum}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Body Rows grouped by PlatformChannel */}
          {channelPcs.map((pc: PlatformChannel) => {
            const pl = platformById[pc.platformId];
            const pcIdeas = ideas.filter((i: Idea) => 
              i.platformChannelId === pc.id && 
              i.status !== "PITCH" && 
              i.status !== "ARCHIVED_IDEA" && 
              i.status !== "CANCELLED" &&
              i.startDate
            );

            return (
              <div key={pc.id} className="border-b border-[#182234]">
                <div className="px-4 py-2 bg-[#141B28] text-xs font-bold text-[#E5C058] font-mono flex items-center gap-2">
                  <Film size={13} /> {pl?.name || "Nền tảng"} ({pcIdeas.length} sản phẩm)
                </div>

                {pcIdeas.length === 0 ? (
                  <div className="py-4 px-4 text-xs text-[#64748B] italic">Chưa có ý tưởng nào trong giai đoạn sản xuất trên nền tảng này.</div>
                ) : (
                  pcIdeas.map((idea: Idea) => {
                    const start = new Date(idea.startDate || "");
                    const end = new Date(idea.endDate || idea.startDate || "");
                    const startDay = start.getMonth() === month && start.getFullYear() === year ? start.getDate() : 1;
                    const endDay = end.getMonth() === month && end.getFullYear() === year ? end.getDate() : daysInMonth;
                    const assignee = memberById[idea.assignedToEmail];

                    return (
                      <div key={idea.id} className="flex items-center py-2 hover:bg-[#182132]/60 transition-colors border-t border-[#182234]">
                        <div className="w-60 shrink-0 px-4 truncate cursor-pointer hover:text-[#E5C058]" onClick={() => onOpenIdea(idea)}>
                          <div className="text-xs font-semibold text-white truncate">{idea.title}</div>
                          <div className="text-[10px] text-[#64748B] font-mono">{assignee?.name || "Chưa gán"}</div>
                        </div>

                        <div className="flex-1 grid relative h-7" style={{ gridTemplateColumns: `repeat(${daysInMonth}, 1fr)` }}>
                          <div 
                            onClick={() => onOpenIdea(idea)}
                            className="absolute top-1 bottom-1 rounded-md flex items-center px-2 text-[11px] font-semibold text-white truncate shadow-md cursor-pointer hover:opacity-90 transition-opacity"
                            style={{ 
                              left: `${((startDay - 1) / daysInMonth) * 100}%`,
                              width: `${Math.max(1, ((endDay - startDay + 1) / daysInMonth) * 100)}%`,
                              background: idea.status === "ASSIGNMENT" ? "#F59E0B" : 
                                          idea.status === "SCRIPT" ? "#3B82F6" : 
                                          idea.status === "PRODUCTION" ? "#8B5CF6" : 
                                          idea.status === "QA" ? "#F43F5E" : 
                                          idea.status === "COMPLETE" ? "#10B981" : "#E5C058"
                            }}>
                            {idea.title}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* TRASHED CHANNELS */}
      {trashedChannelGroups.length > 0 && (
        <div className="mt-8 pt-4 border-t border-[#182234]">
          <h3 className="text-xs font-mono font-bold text-[#64748B] uppercase mb-3">Thùng Rác Kênh</h3>
          <div className="flex flex-wrap gap-2">
            {trashedChannelGroups.map((cg: ChannelGroup) => (
              <div key={cg.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111723] border border-[#232F46] text-xs text-[#94A3B8]">
                <span>{cg.name}</span>
                {actor.role === "Core" && (
                  <button onClick={() => onRestoreChannel(cg)} className="text-[#E5C058] hover:underline flex items-center gap-1 font-semibold">
                    <RotateCcw size={11} /> Khôi phục
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* TAB 4: TIMELINE TỔNG DỰ ÁN */
function MasterTimelineView({
  channelGroups,
  platforms,
  platformChannels,
  ideas,
  channelGroupById,
  platformById,
  pcById,
  memberById,
  monthOffset,
  setMonthOffset,
  onOpenIdea
}: any) {
  const [filterCg, setFilterCg] = useState("ALL");
  const [filterPlat, setFilterPlat] = useState("ALL");

  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + monthOffset);
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = `Tháng ${month + 1}/${year}`;

  const activeIdeas = ideas.filter((i: Idea) => {
    if (i.status === "PITCH" || i.status === "ARCHIVED_IDEA" || i.status === "CANCELLED" || !i.startDate) return false;
    const pc = pcById[i.platformChannelId];
    if (filterCg !== "ALL" && pc?.channelGroupId !== filterCg) return false;
    if (filterPlat !== "ALL" && pc?.platformId !== filterPlat) return false;
    return true;
  });

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">TIMELINE TỔNG DỰ ÁN</h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">Khung nhìn toàn diện tất cả các kênh và nền tảng trên cùng 1 tháng.</p>
        </div>

        <div className="flex items-center gap-3">
          <select value={filterCg} onChange={(e) => setFilterCg(e.target.value)} className="px-3 py-2 text-xs rounded-lg bg-[#111723] border border-[#232F46] text-white outline-none">
            <option value="ALL">Tất cả Kênh</option>
            {channelGroups.map((cg: ChannelGroup) => <option key={cg.id} value={cg.id}>{cg.name}</option>)}
          </select>
          <select value={filterPlat} onChange={(e) => setFilterPlat(e.target.value)} className="px-3 py-2 text-xs rounded-lg bg-[#111723] border border-[#232F46] text-white outline-none">
            <option value="ALL">Tất cả Nền tảng</option>
            {platforms.map((p: Platform) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>

      {/* MONTH BAR */}
      <div className="flex items-center justify-between bg-[#111723] p-3.5 rounded-xl border border-[#232F46] mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setMonthOffset(monthOffset - 1)} className="p-1.5 rounded-lg bg-[#182132] text-[#94A3B8] hover:text-white">
            <ChevronLeft size={16} />
          </button>
          <span className="font-mono text-sm font-bold text-white px-3">{monthLabel}</span>
          <button onClick={() => setMonthOffset(monthOffset + 1)} className="p-1.5 rounded-lg bg-[#182132] text-[#94A3B8] hover:text-white">
            <ChevronRight size={16} />
          </button>
          {monthOffset !== 0 && (
            <button onClick={() => setMonthOffset(0)} className="text-xs text-[#E5C058] ml-2 hover:underline font-mono font-bold">
              Hôm nay
            </button>
          )}
        </div>
        <span className="text-xs text-[#94A3B8] font-mono">Đang hiển thị {activeIdeas.length} sản phẩm</span>
      </div>

      {/* GANTT CANVAS */}
      <div className="overflow-x-auto rounded-xl border border-[#232F46] bg-[#111723]">
        <div style={{ minWidth: 950 }}>
          <div className="flex border-b border-[#232F46] bg-[#0E141F] py-2.5 text-center text-xs font-mono font-bold text-[#94A3B8]">
            <div className="w-64 shrink-0 text-left px-4">Kênh / Nền tảng / Tên Video</div>
            <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${daysInMonth}, 1fr)` }}>
              {Array.from({ length: daysInMonth }).map((_, i) => (
                <div key={i + 1} className="py-1 text-[11px]">{i + 1}</div>
              ))}
            </div>
          </div>

          <div className="divide-y divide-[#182234]">
            {activeIdeas.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#64748B] italic">Không có sản phẩm nào trong tháng này.</div>
            ) : (
              activeIdeas.map((idea: Idea) => {
                const pc = pcById[idea.platformChannelId];
                const ch = pc ? channelGroupById[pc.channelGroupId] : null;
                const pl = pc ? platformById[pc.platformId] : null;
                const start = new Date(idea.startDate || "");
                const end = new Date(idea.endDate || idea.startDate || "");
                const startDay = start.getMonth() === month && start.getFullYear() === year ? start.getDate() : 1;
                const endDay = end.getMonth() === month && end.getFullYear() === year ? end.getDate() : daysInMonth;

                return (
                  <div key={idea.id} className="flex items-center py-2.5 hover:bg-[#182132]/60 transition-colors">
                    <div className="w-64 shrink-0 px-4 cursor-pointer hover:text-[#E5C058]" onClick={() => onOpenIdea(idea)}>
                      <div className="text-xs font-semibold text-white truncate">{idea.title}</div>
                      <div className="text-[10px] text-[#64748B] font-mono">{ch?.name} · {pl?.name}</div>
                    </div>

                    <div className="flex-1 grid relative h-7" style={{ gridTemplateColumns: `repeat(${daysInMonth}, 1fr)` }}>
                      <div 
                        onClick={() => onOpenIdea(idea)}
                        className="absolute top-1 bottom-1 rounded-md flex items-center px-2 text-[11px] font-semibold text-white truncate shadow-md cursor-pointer hover:opacity-90"
                        style={{ 
                          left: `${((startDay - 1) / daysInMonth) * 100}%`,
                          width: `${Math.max(1, ((endDay - startDay + 1) / daysInMonth) * 100)}%`,
                          background: idea.status === "ASSIGNMENT" ? "#F59E0B" : 
                                      idea.status === "SCRIPT" ? "#3B82F6" : 
                                      idea.status === "PRODUCTION" ? "#8B5CF6" : 
                                      idea.status === "QA" ? "#F43F5E" : 
                                      idea.status === "COMPLETE" ? "#10B981" : "#E5C058"
                        }}>
                        {idea.title}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* TAB 5: LỊCH ĐĂNG BÀI */
function ContentCalendarView({
  ideas,
  channelGroupById,
  platformById,
  pcById,
  memberById,
  actor,
  settings,
  onOpenIdea,
  onSchedulePost
}: any) {
  const [calendarMonthOffset, setCalendarMonthOffset] = useState(0);

  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + calendarMonthOffset);
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthLabel = `Tháng ${month + 1}/${year}`;

  const completedIdeas = ideas.filter((i: Idea) => i.status === "COMPLETE" && i.publishedLink);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">LỊCH ĐĂNG BÀI (CONTENT CALENDAR)</h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">Kế hoạch xuất bản sản phẩm hoàn thành theo ngày.</p>
        </div>

        {settings.externalCalendarUrl && (
          <a href={settings.externalCalendarUrl} target="_blank" rel="noreferrer" 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-[#182132] text-[#E5C058] border border-[#E5C058]/30 hover:bg-[#232F46] font-semibold transition-all">
            Mở Lịch Notion / Google <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* MONTH CONTROL */}
      <div className="flex items-center justify-between bg-[#111723] p-3.5 rounded-xl border border-[#232F46]">
        <div className="flex items-center gap-2">
          <button onClick={() => setCalendarMonthOffset(calendarMonthOffset - 1)} className="p-1.5 rounded-lg bg-[#182132] text-[#94A3B8] hover:text-white">
            <ChevronLeft size={16} />
          </button>
          <span className="font-mono text-sm font-bold text-white px-3">{monthLabel}</span>
          <button onClick={() => setCalendarMonthOffset(calendarMonthOffset + 1)} className="p-1.5 rounded-lg bg-[#182132] text-[#94A3B8] hover:text-white">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* CALENDAR MONTH GRID */}
      <div className="grid grid-cols-7 gap-2 bg-[#111723] p-4 rounded-xl border border-[#232F46]">
        {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((dayName) => (
          <div key={dayName} className="text-center font-mono text-xs font-bold text-[#64748B] py-1 border-b border-[#182234]">
            {dayName}
          </div>
        ))}

        {Array.from({ length: new Date(year, month, 1).getDay() === 0 ? 6 : new Date(year, month, 1).getDay() - 1 }).map((_, i) => (
          <div key={`empty-${i}`} className="min-h-[110px] p-2 rounded-lg bg-transparent"></div>
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const currentDayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
          const isToday = currentDayStr === todayIso;
          
          const dayIdeas = completedIdeas.filter((ci: Idea) => ci.scheduledPostDate === currentDayStr);

          return (
            <div key={dayNum} 
              className={`min-h-[110px] p-2.5 rounded-xl border flex flex-col justify-between transition-colors ${isToday ? 'bg-[#E5C058]/10 border-[#E5C058]/50' : 'bg-[#182132]/60 border-[#232F46] hover:border-[#334155]'}`}>
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-mono font-bold ${isToday ? 'text-[#E5C058]' : 'text-[#94A3B8]'}`}>
                  {dayNum}
                </span>
                {dayIdeas.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#10B981] text-[10px] font-bold text-white flex items-center justify-center">
                    {dayIdeas.length}
                  </span>
                )}
              </div>

              <div className="space-y-1 overflow-y-auto max-h-20">
                {dayIdeas.map((idea: Idea) => {
                  const pc = pcById[idea.platformChannelId];
                  const ch = pc ? channelGroupById[pc.channelGroupId] : null;

                  return (
                    <div key={idea.id} 
                      onClick={() => onOpenIdea(idea)}
                      className="p-1.5 rounded text-[11px] font-medium text-white truncate cursor-pointer hover:opacity-90 shadow-sm"
                      style={{ background: ch?.color || "#E5C058" }}>
                      {idea.title}
                    </div>
                  );
                })}
              </div>

              {actor.role === "Core" && (
                <div className="pt-1 text-right">
                  <button onClick={() => {
                    const available = completedIdeas.find((c: Idea) => !c.scheduledPostDate);
                    if (available) onSchedulePost(available);
                  }} className="text-[10px] text-[#64748B] hover:text-[#E5C058] font-mono">
                    + Xếp bài
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* TAB 6: BÁO CÁO TUẦN */
function WeeklyReportView({
  ideas,
  channelGroups,
  platforms,
  members,
  channelGroupById,
  actor,
  runAction,
  showToast
}: any) {
  const now = new Date();
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(now.getDate() - 7);

  const completedInWeek = ideas.filter((i: Idea) => {
    if (i.status !== "COMPLETE") return false;
    const d = new Date(i.endDate || i.createdAt);
    return d >= oneWeekAgo;
  });

  const overdueList = ideas.filter((i: Idea) => {
    if (i.status !== "PRODUCTION" || !i.endDate) return false;
    return new Date(i.endDate + "T23:59:59") < now;
  });

  const qaReturned = ideas.filter((i: Idea) => i.qaFeedback && i.qaFeedback.trim() !== "");

  const memberCounts: Record<string, number> = {};
  completedInWeek.forEach((i: Idea) => {
    if (i.assignedToEmail) {
      memberCounts[i.assignedToEmail] = (memberCounts[i.assignedToEmail] || 0) + 1;
    }
  });

  const exportMarkdown = () => {
    const lines = [
      "# BÁO CÁO TUẦN — Ý NIỆM ĐIỆN ẢNH",
      `Ngày tạo: ${new Date().toLocaleDateString('vi-VN')}`,
      "",
      "## 1. TỔNG QUAN",
      `- Hoàn thành: ${completedInWeek.length} video`,
      `- Đang trễ hạn: ${overdueList.length} video`,
      `- Bị QA trả lại: ${qaReturned.length} video`,
      "",
      "## 2. NĂNG SUẤT THEO NHÂN SỰ",
      ...Object.entries(memberCounts).sort((a,b)=>b[1]-a[1]).map(([email, count]) => {
         const m = members.find((x: Member) => x.id === email);
         return `- **${m?.name || email}**: ${count} video`;
      }),
      ""
    ];
    navigator.clipboard.writeText(lines.join("\n"));
    showToast("Đã sao chép báo cáo Markdown vào clipboard!");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">BÁO CÁO TUẦN TỰ ĐỘNG</h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">Tổng hợp chỉ số năng suất và chất lượng sản xuất tuần qua.</p>
        </div>

        <div className="flex gap-2">
          <Btn tone="default" onClick={exportMarkdown}>
            <Copy size={14} /> Xuất Markdown
          </Btn>
          {actor.role === "Core" && (
            <Btn tone="primary" onClick={async () => {
              try {
                await runAction(sendWeeklyReportToDiscordAction);
                showToast("Đã gửi báo cáo tuần vào Discord!");
              } catch (e: any) {
                console.log(e);
              }
            }}>
              <Send size={14} /> Gửi Báo Cáo Discord
            </Btn>
          )}
        </div>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl bg-[#111723] border border-[#232F46]">
          <div className="text-xs font-mono text-[#94A3B8] uppercase">Hoàn thành trong tuần</div>
          <div className="text-3xl font-extrabold text-[#34D399] mt-2">{completedInWeek.length}</div>
          <div className="text-[11px] text-[#64748B] mt-1">Sản phẩm có link xuất bản thật</div>
        </div>

        <div className="p-5 rounded-xl bg-[#111723] border border-[#232F46]">
          <div className="text-xs font-mono text-[#94A3B8] uppercase">Đang trễ hạn</div>
          <div className="text-3xl font-extrabold text-[#FB7185] mt-2">{overdueList.length}</div>
          <div className="text-[11px] text-[#64748B] mt-1">Cần đẩy nhanh tiến độ</div>
        </div>

        <div className="p-5 rounded-xl bg-[#111723] border border-[#232F46]">
          <div className="text-xs font-mono text-[#94A3B8] uppercase">Ca cần sửa lại qua QA</div>
          <div className="text-3xl font-extrabold text-[#FBBF24] mt-2">{qaReturned.length}</div>
          <div className="text-[11px] text-[#64748B] mt-1">Chỉ số chất lượng khâu quay/dựng</div>
        </div>
      </div>

      {/* MEMBER OUTPUT LEADERBOARD */}
      <div className="p-5 rounded-xl bg-[#111723] border border-[#232F46]">
        <h3 className="text-sm font-bold text-white uppercase font-mono mb-4 flex items-center gap-2">
          <Award size={16} className="text-[#E5C058]" />
          Năng suất sản xuất theo thành viên
        </h3>
        <div className="space-y-3">
          {Object.entries(memberCounts).length === 0 ? (
            <p className="text-xs text-[#64748B] italic py-2">Chưa có sản phẩm hoàn thành nào trong 7 ngày qua.</p>
          ) : (
            Object.entries(memberCounts).sort((a, b) => b[1] - a[1]).map(([email, count]) => {
              const mem = members.find((m: Member) => m.id === email);
              return (
                <div key={email} className="flex items-center justify-between p-3 rounded-lg bg-[#182132] border border-[#232F46]">
                  <div className="flex items-center gap-2.5">
                    <UserAvatar name={mem?.name || email} size={28} />
                    <span className="text-xs font-semibold text-white">{mem?.name || email}</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#E5C058]">{count} sản phẩm</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

/* TAB 7: THÀNH VIÊN & AUDIT LOG */
function MembersAndAuditView({
  members,
  ideas,
  auditLogs,
  checklists,
  channelGroupById,
  actor,
  onShowProfile,
  onAddMember,
  onRemoveMember,
  onToggleActive,
  runAction
}: any) {
  const [subTab, setSubTab] = useState<"members" | "audit" | "checklists">("members");

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-white tracking-wide">QUẢN LÝ ĐỘI NGŨ & AUDIT LOG</h2>
          <div className="flex rounded-lg p-0.5 bg-[#111723] border border-[#232F46] text-xs">
            <button onClick={() => setSubTab("members")} className={`px-3 py-1 rounded-md transition-all ${subTab === "members" ? "bg-[#E5C058]/15 text-[#E5C058] font-bold" : "text-[#94A3B8] hover:text-white"}`}>
              Thành viên ({members.length})
            </button>
            <button onClick={() => setSubTab("audit")} className={`px-3 py-1 rounded-md transition-all ${subTab === "audit" ? "bg-[#E5C058]/15 text-[#E5C058] font-bold" : "text-[#94A3B8] hover:text-white"}`}>
              Audit Log ({auditLogs.length})
            </button>
            <button onClick={() => setSubTab("checklists")} className={`px-3 py-1 rounded-md transition-all ${subTab === "checklists" ? "bg-[#E5C058]/15 text-[#E5C058] font-bold" : "text-[#94A3B8] hover:text-white"}`}>
              Checklist ({checklists.length})
            </button>
          </div>
        </div>

        {actor.role === "Core" && subTab === "members" && (
          <Btn tone="primary" onClick={onAddMember}><Plus size={14} /> Thêm thành viên</Btn>
        )}
      </div>

      {subTab === "members" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((m: Member) => (
            <div key={m.id} className="p-4 rounded-xl bg-[#111723] border border-[#232F46] flex flex-col justify-between shadow-md">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2.5">
                    <UserAvatar name={m.name} size={34} />
                    <div>
                      <h4 className="font-bold text-sm text-white">{m.name}</h4>
                      <div className="text-[11px] text-[#64748B] font-mono">{m.id}</div>
                    </div>
                  </div>
                  <RoleChip role={m.role} />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-[#94A3B8] my-3 pt-2 border-t border-[#182234]">
                  <div>Chuyên môn: <b className="text-white">{m.primaryExpertise || "—"}</b></div>
                  <div>Trạng thái: <b className={m.active ? "text-emerald-400" : "text-[#64748B]"}>{m.active ? "Hoạt động" : "Ngừng HĐ"}</b></div>
                </div>
              </div>

              {actor.role === "Core" && (
                <div className="flex items-center justify-between pt-3 border-t border-[#182234] text-xs">
                  <button onClick={() => onToggleActive(m, !m.active)} className="text-[#94A3B8] hover:text-[#E5C058] font-medium">
                    {m.active ? "Ngừng hoạt động" : "Kích hoạt lại"}
                  </button>
                  <button onClick={() => onRemoveMember(m)} className="text-[#FB7185] hover:underline font-medium">
                    Xoá
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {subTab === "audit" && (
        <div className="p-4 rounded-xl bg-[#111723] border border-[#232F46]">
          <h3 className="text-xs font-mono font-bold text-[#94A3B8] uppercase mb-4">Nhật ký thay đổi bất biến (Audit Logs)</h3>
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {auditLogs.length === 0 ? (
              <p className="text-xs text-[#64748B] italic py-4 text-center">Chưa có nhật ký nào được ghi nhận.</p>
            ) : (
              auditLogs.map((log: AuditLogItem) => (
                <div key={log.id} className="p-3 rounded-lg bg-[#182132] border border-[#232F46] flex items-start justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-[#E5C058]">{log.action}</span>
                    <span className="text-[#94A3B8] ml-2">bởi <b className="text-white">{log.memberId}</b></span>
                    {log.metadata && (
                      <div className="text-[11px] text-[#64748B] font-mono mt-1 break-all">{log.metadata}</div>
                    )}
                  </div>
                  <span className="text-[11px] font-mono text-[#64748B] shrink-0">{fmtDateTime(log.timestamp)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {subTab === "checklists" && (
        <ChecklistView checklists={checklists} actor={actor} runAction={runAction} />
      )}
    </div>
  );
}

function ChecklistView({ checklists, actor, runAction }: any) {
  const STATUSES = ["Chưa bắt đầu", "Đang thực hiện", "Done"];
  const handleStatusClick = (checklist: ChecklistItem) => {
    const idx = STATUSES.indexOf(checklist.status);
    const next = STATUSES[(idx + 1) % STATUSES.length];
    runAction(updateChecklistStatusAction, checklist.id, next);
  };

  return (
    <div className="space-y-4">
      <form className="flex gap-2" onSubmit={(e: React.FormEvent<HTMLFormElement>) => { 
        e.preventDefault(); 
        const form = e.currentTarget;
        const nameInput = form.elements.namedItem("name") as HTMLInputElement;
        runAction(createChecklistAction, nameInput.value); 
        form.reset(); 
      }}>
        <TextInput id="name" required placeholder="+ Thêm đầu việc chuẩn bị mới (Enter để lưu)" style={{ flex: 1, maxWidth: 450 }} />
        <Btn tone="primary" type="submit">Thêm</Btn>
      </form>

      <div className="grid gap-2">
        {checklists.map((c: ChecklistItem) => {
          let tone: any = "muted";
          if (c.status === "Đang thực hiện") tone = "amber";
          if (c.status === "Done") tone = "green";
          
          return (
            <div key={c.id} className="flex items-center justify-between p-3.5 bg-[#111723] border border-[#232F46] rounded-xl hover:bg-[#182132] transition-colors">
              <div className="flex items-center gap-3">
                <button onClick={() => handleStatusClick(c)}>
                  <Badge tone={tone}>{c.status}</Badge>
                </button>
                <span className={`text-sm ${c.status === "Done" ? "text-[#64748B] line-through" : "text-white font-medium"}`}>
                  {c.name}
                </span>
              </div>
              <button onClick={() => runAction(deleteChecklistAction, c.id)} className="text-[#64748B] hover:text-[#F43F5E] p-1">
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* TAB 8: PORTFOLIO CÁ NHÂN */
function PortfolioView({
  members,
  ideas,
  channelGroupById,
  platformById,
  pcById,
  selected,
  setSelected,
  showToast
}: any) {
  const member = members.find((m: Member) => m.id === selected) || members[0];
  
  const CREDIT_META = [
    { key: "creditsIdeaByEmail", label: "Idea gốc (Người đưa ra)", icon: Lightbulb },
    { key: "creditsApprovedByEmail", label: "Người điều hành (Core duyệt)", icon: ShieldCheck },
    { key: "creditsScriptByEmail", label: "Viết kịch bản", icon: PenLine },
    { key: "creditsEditedScriptByEmail", label: "Biên tập kịch bản", icon: Scissors },
    { key: "creditsProducedByEmail", label: "Sản xuất (Quay/Dựng)", icon: ClapIcon },
    { key: "creditsQaByEmail", label: "Kiểm duyệt QA", icon: ShieldCheck },
  ];

  const items = ideas.filter((i: Idea) => i.status === "COMPLETE" && i.publishedLink && 
    CREDIT_META.some(cm => (i as any)[cm.key] === member?.id)
  );

  const copyCvSummary = () => {
    const text = items.map((i: Idea, idx: number) => {
      const roles = CREDIT_META.filter(cm => (i as any)[cm.key] === member?.id).map(r => r.label).join(", ");
      return `${idx + 1}. ${i.title} (Vai trò: ${roles}) - Link: ${i.publishedLink}`;
    }).join("\n");

    navigator.clipboard.writeText(`PORTFOLIO Ý NIỆM ĐIỆN ẢNH — ${member.name} (${member.role}):\n\n${text}`);
    showToast("Đã sao chép tóm tắt Portfolio vào clipboard!");
  };

  const copyPublicLink = () => {
    const url = `${window.location.origin}/portfolio/${encodeURIComponent(member.id)}`;
    navigator.clipboard.writeText(url);
    showToast("Đã sao chép link Portfolio công khai!");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">PORTFOLIO CÁ NHÂN (XÁC THỰC MINH CHỨNG)</h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">Dữ liệu đóng góp thật được hệ thống tự động ghi nhận theo hành động xuất bản.</p>
        </div>

        <div className="flex items-center gap-2">
          <Btn tone="default" onClick={copyCvSummary}><Copy size={14} /> Sao chép CV</Btn>
          <Btn tone="primary" onClick={copyPublicLink}><LinkIcon size={14} /> Link Công Khai</Btn>
        </div>
      </div>

      {/* MEMBER SELECTOR PILLS */}
      <div className="flex flex-wrap gap-2">
        {members.map((m: Member) => (
          <button key={m.id} onClick={() => setSelected(m.id)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold transition-all ${m.id === member?.id ? 'bg-[#E5C058]/15 border-[#E5C058] text-[#E5C058] shadow-md' : 'bg-[#111723] border-[#232F46] text-[#94A3B8] hover:text-white'}`}>
            <span>{m.name}</span>
            <RoleChip role={m.role} />
          </button>
        ))}
      </div>

      {/* PORTFOLIO CARD */}
      <div className="p-6 rounded-xl bg-[#111723] border border-[#232F46] shadow-lg">
        <div className="flex items-center justify-between pb-4 border-b border-[#182234]">
          <div className="flex items-center gap-3">
            <UserAvatar name={member?.name || "U"} size={44} />
            <div>
              <h3 className="text-lg font-bold text-white">{member?.name}</h3>
              <span className="text-xs text-[#94A3B8] font-mono">{member?.id} · {items.length} sản phẩm xuất bản</span>
            </div>
          </div>
          <a href={`/portfolio/${encodeURIComponent(member?.id || '')}`} target="_blank" rel="noreferrer" 
            className="text-xs text-[#E5C058] hover:underline flex items-center gap-1 font-semibold">
            Xem trang công khai <ExternalLink size={12} />
          </a>
        </div>

        {items.length === 0 ? (
          <p className="text-xs text-[#64748B] py-8 text-center italic">Thành viên chưa có sản phẩm nào hoàn thành kèm link.</p>
        ) : (
          <div className="mt-5 space-y-3">
            {items.map((i: Idea, idx: number) => {
              const pc = pcById[i.platformChannelId];
              const ch = pc ? channelGroupById[pc.channelGroupId] : null;
              const pl = pc ? platformById[pc.platformId] : null;
              const roles = CREDIT_META.filter(cm => (i as any)[cm.key] === member.id);

              return (
                <div key={i.id} className="p-4 rounded-xl bg-[#182132] border border-[#232F46]" style={{ borderLeftWidth: 4, borderLeftColor: ch?.color || "#E5C058" }}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="font-bold text-sm text-white">{idx + 1}. {i.title}</h4>
                      <div className="text-[11px] text-[#94A3B8] font-mono">{ch?.name} · {pl?.name}</div>
                    </div>
                    <a href={i.publishedLink} target="_blank" rel="noreferrer" className="text-xs text-[#60A5FA] hover:underline flex items-center gap-1 font-medium shrink-0">
                      Xem video <ExternalLink size={12} />
                    </a>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {roles.map(r => (
                      <span key={r.key} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono text-[#E5C058] bg-[#E5C058]/10 border border-[#E5C058]/30">
                        <r.icon size={10} /> {r.label}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

/* MODAL: IDEA DETAIL WITH THREADED COMMENTS */
function IdeaDetailModal({
  idea,
  onClose,
  actor,
  channelGroupById,
  platformById,
  pcById,
  memberById,
  comments,
  commentInput,
  setCommentInput,
  onApprove,
  onQaComplete,
  onQaReject,
  onCancel,
  onSchedule,
  onSubmitScript,
  onSubmitVideo,
  onReassign,
  onEditIdea,
  onExtendDeadline,
  runAction,
  showToast
}: any) {
  const pc = pcById[idea.platformChannelId];
  const ch = pc ? channelGroupById[pc.channelGroupId] : null;
  const pl = pc ? platformById[pc.platformId] : null;
  const od = overdueInfo(idea);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    runAction(addCommentAction, idea.id, commentInput.trim());
    setCommentInput("");
    showToast("Đã gửi bình luận");
  };

  return (
    <Modal title={idea.title} onClose={onClose} wide>
      <div className="space-y-4">
        {/* BADGES */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge tone="gold">{STATUS_LABEL[idea.status]}</Badge>
          {ch && <span style={{ color: ch.color, fontSize: 12, fontFamily: "var(--font-mono)", fontWeight: 700 }}>{ch.name}</span>}
          {pl && <Badge tone="muted">{pl.name}</Badge>}
          {od && <Badge tone="red"><AlertTriangle size={11} /> {od.msg}</Badge>}
        </div>

        {/* DESCRIPTION */}
        {idea.description && (
          <div className="p-3.5 rounded-xl bg-[#0D121B] border border-[#232F46] text-xs text-[#94A3B8] leading-relaxed">
            <span className="font-bold text-white block mb-1 uppercase font-mono text-[10px]">Mô tả ý tưởng:</span>
            {idea.description}
          </div>
        )}

        {/* QA FEEDBACK */}
        {idea.qaFeedback && (
          <div className="p-3.5 rounded-xl bg-[#33141B]/60 border border-[#F43F5E]/40 text-xs text-[#FB7185] leading-relaxed">
            <b className="block mb-0.5 text-white">GHI CHÚ QA — CHƯA ĐẠT:</b>
            {idea.qaFeedback}
          </div>
        )}

        {/* PUBLISHED LINK */}
        {idea.publishedLink && (
          <div className="p-3.5 rounded-xl bg-[#0D2B1F]/40 border border-[#10B981]/40 text-xs flex items-center justify-between">
            <span className="text-[#34D399] font-medium">🔗 Minh chứng đã xuất bản:</span>
            <a href={idea.publishedLink} target="_blank" rel="noreferrer" className="text-[#60A5FA] hover:underline flex items-center gap-1 font-mono">
              {idea.publishedLink.slice(0, 40)}... <ExternalLink size={12} />
            </a>
          </div>
        )}

        {/* TIMELINE MILESTONES */}
        <div className="p-3.5 rounded-xl bg-[#0D121B] border border-[#232F46] space-y-1">
          <div className="text-[10px] font-mono font-bold text-[#E5C058] uppercase mb-2">Tiến độ quy trình (Timeline)</div>
          <div className="relative pl-3 border-l border-[#232F46] space-y-2 ml-1">
            <div className="relative">
              <div className="absolute w-2 h-2 bg-[#64748B] rounded-full -left-[17px] top-1"></div>
              <p className="text-[11px] text-[#94A3B8]">Nộp ý tưởng: <span className="text-white font-medium">{fmtDateTime(idea.createdAt)}</span></p>
            </div>
            {idea.assignedAt && (
              <div className="relative">
                <div className="absolute w-2 h-2 bg-[#3B82F6] rounded-full -left-[17px] top-1"></div>
                <p className="text-[11px] text-[#94A3B8]">Giao việc: <span className="text-white font-medium">{fmtDateTime(idea.assignedAt)}</span></p>
              </div>
            )}
            {idea.videoSubmittedAt && (
              <div className="relative">
                <div className="absolute w-2 h-2 bg-[#F59E0B] rounded-full -left-[17px] top-1"></div>
                <p className="text-[11px] text-[#94A3B8]">Nộp video (QA): <span className="text-white font-medium">{fmtDateTime(idea.videoSubmittedAt)}</span></p>
              </div>
            )}
            {idea.status === "COMPLETE" && (
              <div className="relative">
                <div className="absolute w-2 h-2 bg-[#10B981] rounded-full -left-[17px] top-1"></div>
                <p className="text-[11px] text-[#34D399] font-bold">Hoàn thành kiểm duyệt QA</p>
              </div>
            )}
            {idea.cancelledAt && (
              <div className="relative">
                <div className="absolute w-2 h-2 bg-[#F43F5E] rounded-full -left-[17px] top-1"></div>
                <p className="text-[11px] text-[#FB7185]">Đã huỷ: {fmtDateTime(idea.cancelledAt)}</p>
              </div>
            )}
          </div>
        </div>

        {/* CREDITS ATTRIBUTION */}
        <div className="p-3.5 rounded-xl bg-[#0D121B] border border-[#232F46] space-y-1">
          <div className="text-[10px] font-mono font-bold text-[#E5C058] uppercase mb-2">Ghi nhận đóng góp (Credits)</div>
          <CreditItem icon={Lightbulb} label="Idea gốc" member={memberById[idea.creditsIdeaByEmail]} />
          <CreditItem icon={ShieldCheck} label="Duyệt bởi (Core)" member={memberById[idea.creditsApprovedByEmail]} />
          <CreditItem icon={PenLine} label="Viết kịch bản" member={memberById[idea.creditsScriptByEmail]} />
          <CreditItem icon={Scissors} label="Biên tập kịch bản" member={memberById[idea.creditsEditedScriptByEmail]} />
          <CreditItem icon={ClapIcon} label="Sản xuất (Quay/Dựng)" member={memberById[idea.creditsProducedByEmail]} />
          <CreditItem icon={ShieldCheck} label="Kiểm duyệt QA" member={memberById[idea.creditsQaByEmail]} />
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#182234]">
          {idea.status === "PITCH" && actor.role === "Core" && (
            <Btn tone="primary" onClick={onApprove}><CheckCircle2 size={14} /> Duyệt ý tưởng</Btn>
          )}
          {idea.status === "ASSIGNMENT" && idea.assignedToEmail === actor.id && actor.role === "P" && (
            <Btn tone="primary" onClick={() => runAction(submitScriptAction, idea.id)}>Nộp kịch bản</Btn>
          )}
          {idea.status === "SCRIPT" && (actor.role === "E" || actor.role === "Core") && (
            <Btn tone="primary" onClick={() => runAction(startProductionAction, idea.id)}>Bắt đầu sản xuất</Btn>
          )}
          {idea.status === "PRODUCTION" && idea.assignedToEmail === actor.id && actor.role === "P" && (
            <Btn tone="primary" onClick={() => runAction(submitVideoAction, idea.id)}>Nộp video</Btn>
          )}
          {idea.status === "QA" && (actor.role === "E" || actor.role === "Core") && (
            <>
              <Btn tone="primary" onClick={onQaComplete}><CheckCircle2 size={14} /> QA Đạt</Btn>
              <Btn tone="danger" onClick={onQaReject}><XCircle size={14} /> QA Chưa đạt</Btn>
            </>
          )}
          {idea.status === "COMPLETE" && actor.role === "Core" && (
            <Btn tone="default" onClick={onSchedule}><CalendarDays size={14} /> Lên lịch đăng</Btn>
          )}

          <div className="flex-1" />
          {idea.status !== "COMPLETE" && (actor.role === "Core" || (idea.status === "PITCH" && idea.submittedByEmail === actor.id)) && (
            <Btn tone="ghost" onClick={onCancel}><XCircle size={13} /> Huỷ</Btn>
          )}
        </div>

        {/* THREADED COMMENTS SECTION */}
        <div className="pt-4 border-t border-[#182234]">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={15} className="text-[#E5C058]" />
            <h4 className="text-xs font-mono font-bold text-white uppercase">Trao đổi & Bình luận ({comments.length})</h4>
          </div>

          <div className="space-y-2.5 max-h-48 overflow-y-auto mb-3 pr-1">
            {comments.length === 0 ? (
              <p className="text-xs text-[#64748B] italic py-2">Chưa có bình luận nào trên ý tưởng này.</p>
            ) : (
              comments.map((cmt: CommentItem) => {
                const author = memberById[cmt.memberId];
                return (
                  <div key={cmt.id} className="p-3 rounded-xl bg-[#0D121B] border border-[#232F46] text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <UserAvatar name={author?.name || cmt.memberId} size={18} />
                        <span className="font-semibold text-white">{author?.name || cmt.memberId}</span>
                      </div>
                      <span className="text-[10px] text-[#64748B] font-mono">{fmtDateTime(cmt.createdAt)}</span>
                    </div>
                    <div className="text-[#94A3B8] leading-relaxed pl-6">{cmt.content}</div>
                  </div>
                );
              })
            )}
          </div>

          {/* Comment input form */}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <TextInput 
              value={commentInput} 
              onChange={(e: any) => setCommentInput(e.target.value)} 
              placeholder="Viết trao đổi / phản hồi cho ý tưởng này..." 
              className="text-xs"
            />
            <Btn tone="primary" type="submit" small><Send size={12} /> Gửi</Btn>
          </form>
        </div>
      </div>
    </Modal>
  );
}

function CreditItem({ icon: Icon, label, member }: any) {
  return (
    <div className="flex items-center justify-between py-1 text-xs">
      <div className="flex items-center gap-1.5 text-[#94A3B8]">
        <Icon size={13} className="text-[#64748B]" />
        <span>{label}</span>
      </div>
      <span className={`font-semibold ${member ? 'text-white' : 'text-[#64748B] font-normal'}`}>
        {member ? member.name : "—"}
      </span>
    </div>
  );
}
