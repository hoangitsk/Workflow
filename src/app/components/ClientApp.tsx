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
  Star, Video, Play, ArrowRight, Compass, ShieldAlert, Sparkle, UserCheck,
  FileText, CheckSquare, MessageCircle, MoreVertical, ChevronDown, CheckCheck,
  Inbox, Menu, ArrowUpRight, Hash, Flame, TrendingUp
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
   LIGHT WORKSPACE DESIGN TOKENS (CLEAN & MODERN SAAS)
--------------------------------------------------------------------- */
const C = {
  bg: "#F8FAFC",        // Slate 50 (App background)
  bgSoft: "#F1F5F9",    // Slate 100
  panel: "#FFFFFF",     // Pure White Surface
  panelRaised: "#FFFFFF",
  panelHover: "#F8FAFC",
  border: "#E2E8F0",    // Slate 200 Hairline border
  borderSoft: "#F1F5F9",
  text: "#0F172A",      // Slate 900 (High contrast charcoal)
  textMuted: "#334155", // Slate 700 (Body text)
  textFaint: "#64748B", // Slate 500 (Subtext / Metadata)
  slate900: "#0F172A",
  indigo: "#4F46E5",
  indigoDim: "#EEF2FF",
  amber: "#D97706",
  amberDim: "#FEF3C7",
  emerald: "#16A34A",
  emeraldDim: "#DCFCE7",
  rose: "#E11D48",
  roseDim: "#FEE2E2",
  blue: "#2563EB",
  blueDim: "#DBEAFE",
  purple: "#9333EA",
  purpleDim: "#F3E8FF"
};

const CHANNEL_PALETTE = ["#2563EB", "#7C3AED", "#DB2777", "#D97706", "#059669", "#0891B2"];

const STATUS_ORDER = ["PITCH", "ASSIGNMENT", "SCRIPT", "PRODUCTION", "QA", "COMPLETE"] as const;
const STATUS_LABEL: Record<string, string> = {
  PITCH: "Chờ duyệt Pitch",
  ASSIGNMENT: "Đã giao việc",
  SCRIPT: "Soạn kịch bản",
  PRODUCTION: "Đang sản xuất",
  QA: "Chờ duyệt QA",
  COMPLETE: "Đã duyệt / Xong",
  ARCHIVED_IDEA: "Lưu trữ",
  CANCELLED: "Đã huỷ"
};

const STATUS_COLORS: Record<string, { bg: string; fg: string; bd: string }> = {
  PITCH: { bg: "#FEF3C7", fg: "#92400E", bd: "#FDE68A" },         // Vàng kem / Nâu hổ phách
  ASSIGNMENT: { bg: "#DBEAFE", fg: "#1E40AF", bd: "#BFDBFE" },    // Xanh biển nhạt
  SCRIPT: { bg: "#E0E7FF", fg: "#3730A3", bd: "#C7D2FE" },        // Indigo nhạt
  PRODUCTION: { bg: "#F3E8FF", fg: "#6B21A8", bd: "#E9D5FF" },    // Tím nhạt
  QA: { bg: "#FEE2E2", fg: "#991B1B", bd: "#FECACA" },            // Đỏ nhạt / Đỏ đô
  COMPLETE: { bg: "#DCFCE7", fg: "#166534", bd: "#BBF7D0" },      // Xanh lá nhạt / Xanh rừng
  ARCHIVED_IDEA: { bg: "#F1F5F9", fg: "#475569", bd: "#E2E8F0" }, // Xám nhạt
  CANCELLED: { bg: "#FEE2E2", fg: "#991B1B", bd: "#FECACA" }      // Đỏ nhạt
};

const ROLE_LABEL: Record<string, string> = { Core: "Core Team", E: "Editor", P: "Producer" };

const WEEKDAY_INFO: Record<number, { tag: string; title: string; who: string; desc: string }> = {
  1: { tag: "T2", title: "Mở nộp ý tưởng & Lên lịch tuần", who: "Core Team", desc: "Core mở cổng nhận ý tưởng mới và chuẩn bị kế hoạch tuần." },
  2: { tag: "T3", title: "Nộp ý tưởng & Duyệt Top ý tưởng", who: "E · P · Core", desc: "Editor & Producer pitch idea; Core duyệt top ý tưởng." },
  3: { tag: "T4", title: "Nộp & Chỉnh sửa kịch bản", who: "P → E", desc: "Producer nộp kịch bản; Editor biên tập và duyệt bấm máy." },
  4: { tag: "T5", title: "Sản xuất & Quay dựng (Production)", who: "Producer", desc: "Quay dựng video theo số ngày đã chốt theo từng nền tảng." },
  5: { tag: "T6", title: "Sản xuất & Hậu kỳ (Production)", who: "Producer", desc: "Hoàn thiện bản dựng, âm thanh và color grading." },
  6: { tag: "T7", title: "Nộp video & Kiểm duyệt QA", who: "P → E", desc: "Producer nộp video; Editor đánh giá QA (Đạt / Chưa đạt)." },
  0: { tag: "CN", title: "Ngày đệm & Báo cáo tổng kết tuần", who: "E · P · Core", desc: "Sửa lại các video chưa đạt; hệ thống tổng hợp báo cáo chỉ số." },
};

/* ---------------------------------------------------------------------
   HELPERS
--------------------------------------------------------------------- */
const iso = (d: any) => new Date(d).toISOString().slice(0, 10);
const today = new Date();
const todayIso = iso(today);
const fmtDate = (s: any) => { if (!s) return "—"; const d = new Date(s); if (isNaN(d.getTime())) return "—"; return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`; };
const fmtDateFull = (s: any) => { if (!s) return "—"; const d = new Date(s); if (isNaN(d.getTime())) return "—"; return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`; };
const fmtDateTime = (s: any) => { if (!s) return "—"; const d = new Date(s); if (isNaN(d.getTime())) return "—"; return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")} · ${fmtDate(d)}`; };

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
function StudioLogo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <div 
      className={`relative inline-flex items-center justify-center rounded-lg overflow-hidden shrink-0 border border-slate-200 shadow-xs bg-white ${className}`}
      style={{ width: size, height: size }}>
      <img 
        src="/logo.png" 
        alt="Ý Niệm Điện Ảnh" 
        className="w-full h-full object-cover"
      />
    </div>
  );
}

/* ---------------------------------------------------------------------
   UI PRIMITIVES (LIGHT SAAS)
--------------------------------------------------------------------- */
function UserAvatar({ name, size = 24, className = "" }: { name: string; size?: number; className?: string }) {
  if (!name) return null;
  const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    { bg: "#DBEAFE", text: "#1D4ED8", border: "#BFDBFE" },
    { bg: "#F3E8FF", text: "#7E22CE", border: "#E9D5FF" },
    { bg: "#FEF3C7", text: "#B45309", border: "#FDE68A" },
    { bg: "#DCFCE7", text: "#15803D", border: "#BBF7D0" },
    { bg: "#FEE2E2", text: "#B91C1C", border: "#FECACA" }
  ];
  const c = colors[hash % colors.length];
  return (
    <div 
      className={`inline-flex items-center justify-center rounded-full font-bold uppercase shrink-0 select-none shadow-xs ${className}`}
      style={{ 
        width: size, 
        height: size, 
        background: c.bg, 
        color: c.text, 
        border: `1px solid ${c.border}`,
        fontSize: Math.max(9, size * 0.42)
      }}>
      {name[0]?.toUpperCase()}
    </div>
  );
}

function Badge({ children, tone = "muted", className = "" }: { children: React.ReactNode; tone?: "muted" | "teal" | "amber" | "red" | "green" | "blue" | "purple" | "gold"; className?: string }) {
  const tones: Record<string, { bg: string; fg: string; bd: string }> = {
    muted: { bg: "#F1F5F9", fg: "#475569", bd: "#E2E8F0" },
    gold: { bg: "#FEF3C7", fg: "#92400E", bd: "#FDE68A" },
    teal: { bg: "#CCFBF1", fg: "#0F766E", bd: "#99F6E4" },
    amber: { bg: "#FEF3C7", fg: "#92400E", bd: "#FDE68A" },
    red: { bg: "#FEE2E2", fg: "#991B1B", bd: "#FECACA" },
    green: { bg: "#DCFCE7", fg: "#166534", bd: "#BBF7D0" },
    blue: { bg: "#DBEAFE", fg: "#1E40AF", bd: "#BFDBFE" },
    purple: { bg: "#F3E8FF", fg: "#6B21A8", bd: "#E9D5FF" }
  };
  const t = tones[tone] || tones.muted;
  return (
    <span 
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide ${className}`}
      style={{ background: t.bg, color: t.fg, border: `1px solid ${t.bd}`, fontFamily: "var(--font-sans, sans-serif)" }}>
      {children}
    </span>
  );
}

function RoleChip({ role }: { role: string }) {
  if (role === "Core") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
        CORE TEAM
      </span>
    );
  }
  if (role === "E") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-[#DBEAFE] text-[#1E40AF] border border-[#BFDBFE]">
        EDITOR
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-[#F3E8FF] text-[#6B21A8] border border-[#E9D5FF]">
      PRODUCER
    </span>
  );
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div 
        className="w-full flex flex-col rounded-xl border border-slate-200 bg-white shadow-2xl animate-in zoom-in-95 duration-150 overflow-hidden"
        style={{ maxWidth: wide ? 760 : 480, maxHeight: "90vh" }}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/80">
          <h3 className="text-sm font-bold text-slate-900 tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-900" />
            {title}
          </h3>
          <button 
            onClick={onClose} 
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) { 
  return (
    <label className="block mb-1 text-xs font-semibold tracking-wide text-slate-700">
      {children} {required && <span className="text-rose-500">*</span>}
    </label>
  ); 
}

const inputStyle = { 
  background: "#FFFFFF", 
  border: "1px solid #CBD5E1", 
  color: "#0F172A", 
  borderRadius: 8 
};

function TextInput(props: any) { 
  return <input {...props} className={"w-full px-3 py-2 text-xs outline-none transition-all focus:border-slate-900 focus:ring-1 focus:ring-slate-900/20 placeholder:text-slate-400 " + (props.className||"")} style={{ ...inputStyle, ...(props.style||{}) }} />; 
}
function Select(props: any) { 
  return <select {...props} className={"w-full px-3 py-2 text-xs outline-none transition-all focus:border-slate-900 focus:ring-1 focus:ring-slate-900/20 bg-white " + (props.className||"")} style={{ ...inputStyle, ...(props.style||{}) }} />; 
}
function TextArea(props: any) { 
  return <textarea {...props} className={"w-full px-3 py-2 text-xs outline-none transition-all focus:border-slate-900 focus:ring-1 focus:ring-slate-900/20 placeholder:text-slate-400 " + (props.className||"")} style={{ ...inputStyle, ...(props.style||{}) }} />; 
}

function Btn({ children, onClick, tone = "default", disabled, type = "button", small, loading, className = "" }: any) {
  const tones: Record<string, { bg: string; fg: string; bd: string; hover: string }> = {
    default: { bg: "#FFFFFF", fg: "#334155", bd: "#E2E8F0", hover: "hover:bg-slate-50 hover:text-slate-900" },
    primary: { bg: "#0F172A", fg: "#FFFFFF", bd: "#0F172A", hover: "hover:bg-slate-800" },
    indigo: { bg: "#4F46E5", fg: "#FFFFFF", bd: "#4F46E5", hover: "hover:bg-indigo-700" },
    danger: { bg: "#FEE2E2", fg: "#991B1B", bd: "#FECACA", hover: "hover:bg-rose-100" },
    ghost: { bg: "transparent", fg: "#475569", bd: "transparent", hover: "hover:bg-slate-100 hover:text-slate-900" },
    amber: { bg: "#FEF3C7", fg: "#92400E", bd: "#FDE68A", hover: "hover:bg-amber-100" },
    success: { bg: "#DCFCE7", fg: "#166534", bd: "#BBF7D0", hover: "hover:bg-emerald-100" }
  };
  const t = tones[tone] || tones.default;

  return (
    <button 
      type={type} 
      onClick={onClick} 
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg transition-all select-none active:scale-[0.98] ${t.hover} ${small ? "px-2.5 py-1 text-xs" : "px-3.5 py-2 text-xs"} ${disabled || loading ? "opacity-40 cursor-not-allowed" : ""} ${className}`}
      style={{ 
        background: t.bg, 
        color: t.fg, 
        border: `1px solid ${t.bd}`
      }}>
      {loading && <RefreshCw size={12} className="animate-spin" />}
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------------
   LOGIN SCREEN (LIGHT SAAS)
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
      if (res && typeof res === "object" && "error" in res && res.error) {
        setErrorMsg(res.error as string);
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8FAFC] text-[#0F172A] relative">
      <div className="w-full max-w-md p-8 rounded-2xl border border-[#E2E8F0] bg-white saas-shadow-lg relative z-10">
        
        {/* BRAND IDENTITY */}
        <div className="flex flex-col items-center text-center mb-6">
          <StudioLogo size={52} className="mb-3" />
          <h1 className="text-xl font-bold tracking-tight text-[#0F172A] uppercase">
            Ý NIỆM ĐIỆN ẢNH
          </h1>
          <p className="text-xs text-[#64748B] font-medium tracking-wide uppercase mt-0.5">
            Không Gian Quản Lý Sản Xuất
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg flex items-center gap-2 text-xs bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle size={15} className="shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3.5">
          <div>
            <FieldLabel required>Email hoặc Tên tài khoản</FieldLabel>
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
            <FieldLabel required>Mật khẩu</FieldLabel>
            <TextInput 
              id="password" 
              type="password" 
              required 
              value={passwordValue}
              onChange={(e: any) => setPasswordValue(e.target.value)}
              placeholder="Nhập mật khẩu..." 
            />
          </div>

          <Btn tone="primary" type="submit" loading={loading} className="w-full justify-center py-2.5 mt-2 text-xs font-bold uppercase tracking-wider">
            Vào Không Gian Làm Việc
          </Btn>
        </form>

        {/* QUICK LOGIN PILLS */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <p className="text-[11px] text-[#64748B] mb-2">Tài khoản demo:</p>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <button 
              type="button" 
              onClick={() => fillAccount("admin@ynda.vn")}
              className="px-2.5 py-1 rounded-md text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors">
              👑 admin@ynda.vn
            </button>
            <button 
              type="button" 
              onClick={() => fillAccount("producer1@ynda.vn")}
              className="px-2.5 py-1 rounded-md text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors">
              🎬 producer1@ynda.vn
            </button>
            <button 
              type="button" 
              onClick={() => fillAccount("editor1@ynda.vn")}
              className="px-2.5 py-1 rounded-md text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors">
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
  const [tab, setTab] = useState("dashboard"); // "dashboard" | "board" | "gantt" | "timeline" | "calendar" | "reports" | "members" | "portfolio"
  
  // Slide-over & Modals
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
  const searchInputRef = useRef<HTMLInputElement>(null);

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

  // Filters & Search
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

  // CRON CLIENT TRIGGER
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

  // Direct tasks for actor
  const myActionTasks = ideas.filter((i: Idea) => {
    if (i.assignedToEmail !== actor.id) return false;
    return i.status === "ASSIGNMENT" || i.status === "PRODUCTION" || (i.status === "QA" && i.qaFeedback);
  });

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
        setOpenIdea(null);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
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

  const NAV_PERSONAL = [
    { id: "dashboard", label: "Việc của tôi", icon: CheckSquare, count: myActionTasks.length },
    { id: "notifications_tab", label: "Inbox (Thông báo)", icon: Inbox, count: unreadNotifications.length },
  ];

  const NAV_PRODUCTION = [
    { id: "board", label: "Pipeline Ý tưởng (Pitch)", icon: LayoutGrid },
    { id: "calendar", label: "Lịch phát hành", icon: CalendarDays },
    { id: "gantt", label: "Gantt theo Kênh", icon: Calendar },
    { id: "timeline", label: "Timeline Tổng", icon: Layers },
    { id: "reports", label: "Báo cáo tuần", icon: BarChart3 },
    { id: "members", label: "Đội ngũ & Audit Log", icon: Users },
    { id: "portfolio", label: "Portfolio cá nhân", icon: Award },
  ];

  const activeTabTitle = [...NAV_PERSONAL, ...NAV_PRODUCTION].find(t => t.id === tab)?.label || "Bàn làm việc";

  return (
    <div className="min-h-screen flex bg-[#F8FAFC] text-[#0F172A]" style={{ fontFamily: "var(--font-sans, sans-serif)" }}>

      {/* -------------------------------------------------------------
         FIXED LEFT SIDEBAR (Width: 240px, Background: #F1F5F9)
      ------------------------------------------------------------- */}
      <aside className="w-60 shrink-0 bg-[#F1F5F9] border-r border-[#E2E8F0] flex flex-col h-screen sticky top-0 z-30 select-none">
        
        {/* TOP SIDEBAR: LOGO + WORKSPACE NAME */}
        <div className="px-4 py-3.5 border-b border-[#E2E8F0] flex items-center gap-2.5 bg-[#F1F5F9]">
          <StudioLogo size={32} />
          <div className="min-w-0 flex-1">
            <div className="font-bold text-xs text-[#0F172A] tracking-wide truncate uppercase">
              Ý NIỆM ĐIỆN ẢNH
            </div>
            <div className="text-[10px] text-[#64748B] font-medium flex items-center gap-1.5">
              <span>Production Hub</span>
              <span className="w-1 h-1 rounded-full bg-slate-400" />
              <RoleChip role={actor.role} />
            </div>
          </div>
        </div>

        {/* NAVIGATION LIST (2 GROUPS) */}
        <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-5">
          
          {/* GROUP 1: CÁ NHÂN */}
          <div>
            <div className="px-2.5 mb-1.5 text-[10px] font-bold text-[#64748B] tracking-wider uppercase">
              Cá nhân
            </div>
            <div className="space-y-0.5">
              {NAV_PERSONAL.map((item) => {
                const isActive = tab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      if (item.id === "notifications_tab") {
                        setShowNotificationsFlyout(true);
                      } else {
                        setTab(item.id);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive 
                        ? "bg-white text-[#0F172A] saas-shadow font-semibold" 
                        : "text-[#334155] hover:bg-slate-200/60 hover:text-[#0F172A]"
                    }`}>
                    <div className="flex items-center gap-2">
                      <item.icon size={15} className={isActive ? "text-[#0F172A]" : "text-[#64748B]"} />
                      <span>{item.label}</span>
                    </div>
                    {item.count > 0 && (
                      <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                        item.id === "notifications_tab" ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-800"
                      }`}>
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* GROUP 2: QUY TRÌNH SẢN XUẤT */}
          <div>
            <div className="px-2.5 mb-1.5 text-[10px] font-bold text-[#64748B] tracking-wider uppercase">
              Quy trình sản xuất
            </div>
            <div className="space-y-0.5">
              {NAV_PRODUCTION.map((item) => {
                const isActive = tab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setTab(item.id)}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive 
                        ? "bg-white text-[#0F172A] saas-shadow font-semibold" 
                        : "text-[#334155] hover:bg-slate-200/60 hover:text-[#0F172A]"
                    }`}>
                    <item.icon size={15} className={isActive ? "text-[#0F172A]" : "text-[#64748B]"} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>

        {/* BOTTOM SIDEBAR: USER PROFILE & DISCORD SYNC */}
        <div className="p-3 border-t border-[#E2E8F0] bg-white/70 space-y-2">
          {/* Discord Status */}
          {settings.discordWebhookUrl ? (
            <div className="flex items-center justify-between px-2 py-1 rounded-md text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Discord Connected
              </span>
              <Check size={12} className="text-emerald-600" />
            </div>
          ) : (
            actor.role === "Core" && (
              <button 
                onClick={() => setShowSettingsModal(true)}
                className="w-full flex items-center justify-center gap-1.5 px-2 py-1 rounded-md text-[11px] bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors font-medium">
                <Plus size={12} /> Cài Discord Webhook
              </button>
            )
          )}

          {/* User Row */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2 min-w-0">
              <UserAvatar name={actor.name} size={26} />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-[#0F172A] truncate">{actor.name}</div>
                <div className="text-[10px] text-[#64748B] truncate">{actor.id}</div>
              </div>
            </div>

            <div className="flex items-center gap-0.5">
              {actor.role === "Core" && (
                <button 
                  onClick={() => setShowSettingsModal(true)} 
                  title="Cài đặt hệ thống" 
                  className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors">
                  <SettingsIcon size={14} />
                </button>
              )}
              <button 
                onClick={() => setShowChangePassword(true)} 
                title="Đổi mật khẩu" 
                className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors">
                <Lock size={14} />
              </button>
              <button 
                onClick={handleLogout} 
                title="Đăng xuất" 
                className="p-1 rounded text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>

      </aside>

      {/* -------------------------------------------------------------
         RIGHT MAIN CONTAINER (Header 48px + Content Stage)
      ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* TOP HEADER (Height: 48px, Background: #FFFFFF) */}
        <header className="h-12 sticky top-0 z-20 bg-white border-b border-[#E2E8F0] px-5 flex items-center justify-between gap-4">
          
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-1.5 text-xs text-[#64748B]">
            <span className="font-medium text-slate-500">Ý Niệm Điện Ảnh</span>
            <ChevronRight size={13} className="text-slate-400" />
            <span className="font-bold text-[#0F172A]">{activeTabTitle}</span>
          </div>

          {/* Search / Command Bar (Ctrl + K) */}
          <div className="relative flex-1 max-w-sm hidden sm:block">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm ý tưởng, kịch bản... (Ctrl + K)"
              className="w-full pl-8 pr-14 py-1 text-xs rounded-lg border border-slate-200 bg-[#F8FAFC] text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-900 focus:outline-none transition-all"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono bg-white border border-slate-200 text-slate-500 px-1 py-0.5 rounded shadow-2xs">
              Ctrl K
            </kbd>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-2.5">
            {isPending && (
              <span className="flex items-center gap-1 text-[11px] text-amber-700 font-mono">
                <RefreshCw size={11} className="animate-spin" /> Đồng bộ...
              </span>
            )}

            {/* Notification Bell */}
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={() => setShowNotificationsFlyout(!showNotificationsFlyout)}
                className="relative p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                <Bell size={16} />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>

              {/* Notification Flyout */}
              {showNotificationsFlyout && (
                <div 
                  className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-150 border border-slate-200 bg-white shadow-2xl">
                  <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Bell size={13} className="text-amber-600" />
                      Thông báo ({unreadNotifications.length})
                    </span>
                    {unreadNotifications.length > 0 && (
                      <button onClick={() => runAction(markAllNotificationsAsReadAction)} className="text-[11px] text-indigo-600 hover:underline font-medium">
                        Đã đọc tất cả
                      </button>
                    )}
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-xs text-slate-400 py-6 text-center italic">Chưa có thông báo nào.</p>
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
                            className={`p-2.5 rounded-lg cursor-pointer transition-all text-xs ${isUnread ? 'bg-amber-50/70 border-l-2 border-amber-500' : 'bg-slate-50 hover:bg-slate-100'}`}>
                            <div className="text-slate-900 leading-snug">{n.message}</div>
                            <div className="text-[10px] text-slate-500 mt-1">{fmtDateTime(n.createdAt)}</div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Primary Action Button: + Ý tưởng mới */}
            <Btn tone="primary" onClick={() => setShowNewIdea(true)} small className="font-bold shadow-xs">
              <Plus size={13} /> Ý tưởng mới
            </Btn>
          </div>

        </header>

        {/* -------------------------------------------------------------
           MAIN STAGE VIEWPORT (#F8FAFC)
        ------------------------------------------------------------- */}
        <main className="flex-1 p-5 max-w-7xl w-full mx-auto">
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

      </div>

      {/* -------------------------------------------------------------
         SLIDE-OVER PANEL (DRAWER 500px) FOR IDEA DETAILS
      ------------------------------------------------------------- */}
      {openIdea && (
        <IdeaSlideOverDrawer
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
          onApprove={() => setApproveIdeaTarget(openIdea)}
          onQaComplete={() => setQaCompleteIdeaTarget(openIdea)}
          onQaReject={() => setQaRejectIdeaTarget(openIdea)}
          onCancel={() => setCancelIdeaTarget(openIdea)}
          onSchedule={() => setSchedulePostTarget(openIdea)}
          onSubmitScript={() => setSubmitScriptTarget(openIdea)}
          onSubmitVideo={() => setSubmitVideoTarget(openIdea)}
          onReassign={() => setReassignIdeaTarget(openIdea)}
          onEditIdea={() => setEditIdeaTarget(openIdea)}
          onExtendDeadline={() => setExtendDeadlineTarget(openIdea)}
          runAction={runAction}
          showToast={showToast}
        />
      )}

      {/* -------------------------------------------------------------
         MODALS & ACTION DIALOGS (LIGHT SAAS)
      ------------------------------------------------------------- */}

      {/* NEW IDEA MODAL */}
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
            <div className="space-y-3">
              <div>
                <FieldLabel required>Tên ý tưởng ngắn gọn</FieldLabel>
                <TextInput id="title" autoFocus required placeholder="VD: 5 mẹo góc máy điện ảnh..." />
              </div>

              <div>
                <FieldLabel required>Mô tả chi tiết nội dung & link tham khảo</FieldLabel>
                <TextArea id="description" required rows={3} placeholder="Nói về gì, góc quay/tone dự kiến, link tư liệu..." />
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

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <Btn onClick={() => setShowNewIdea(false)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Nộp ý tưởng</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* APPROVE IDEA MODAL */}
      {approveIdeaTarget && (
        <Modal title={`Duyệt ý tưởng: ${approveIdeaTarget.title}`} onClose={() => setApproveIdeaTarget(null)}>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const form = e.currentTarget;
            const assigneeEmail = (form.elements.namedItem("assignee") as HTMLSelectElement).value;
            const days = parseInt((form.elements.namedItem("durationDays") as HTMLInputElement).value, 10);
            
            runAction(approveIdeaAction, approveIdeaTarget.id, assigneeEmail, days);
            setApproveIdeaTarget(null);
            showToast("Đã duyệt ý tưởng và giao việc");
          }}>
            <div className="space-y-3">
              <div>
                <FieldLabel required>Giao cho ai phụ trách?</FieldLabel>
                <Select id="assignee" required defaultValue={approveIdeaTarget.submittedByEmail}>
                  {members.filter(m => m.active).map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role}) — {m.id}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <FieldLabel required>Số ngày sản xuất quy định</FieldLabel>
                <TextInput id="durationDays" type="number" min={1} max={30} defaultValue={approveIdeaTarget.durationDays || 2} required />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <Btn onClick={() => setApproveIdeaTarget(null)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Xác nhận duyệt</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* SUBMIT SCRIPT MODAL */}
      {submitScriptTarget && (
        <Modal title={`Nộp kịch bản: ${submitScriptTarget.title}`} onClose={() => setSubmitScriptTarget(null)}>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const form = e.currentTarget;
            const scriptLink = (form.elements.namedItem("scriptLink") as HTMLInputElement).value;
            
            runAction(submitScriptAction, submitScriptTarget.id, scriptLink);
            setSubmitScriptTarget(null);
            showToast("Đã nộp link kịch bản");
          }}>
            <div className="space-y-3">
              <div>
                <FieldLabel required>Link Kịch bản (Google Docs / Notion / File)</FieldLabel>
                <TextInput id="scriptLink" autoFocus required placeholder="https://docs.google.com/document/..." defaultValue={submitScriptTarget.scriptLink || ""} />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <Btn onClick={() => setSubmitScriptTarget(null)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Nộp kịch bản</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* SUBMIT VIDEO MODAL */}
      {submitVideoTarget && (
        <Modal title={`Nộp video kiểm duyệt QA: ${submitVideoTarget.title}`} onClose={() => setSubmitVideoTarget(null)}>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const form = e.currentTarget;
            const videoLink = (form.elements.namedItem("videoLink") as HTMLInputElement).value;
            
            runAction(submitVideoAction, submitVideoTarget.id, videoLink);
            setSubmitVideoTarget(null);
            showToast("Đã nộp link video vào hàng đợi QA");
          }}>
            <div className="space-y-3">
              <div>
                <FieldLabel required>Link Video Draft (Drive / YouTube Unlisted / Frame.io)</FieldLabel>
                <TextInput id="videoLink" autoFocus required placeholder="https://drive.google.com/file/..." defaultValue={submitVideoTarget.videoLink || ""} />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <Btn onClick={() => setSubmitVideoTarget(null)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Nộp kiểm duyệt</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* QA PASS MODAL */}
      {qaCompleteIdeaTarget && (
        <Modal title={`Kiểm duyệt ĐẠT: ${qaCompleteIdeaTarget.title}`} onClose={() => setQaCompleteIdeaTarget(null)}>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const form = e.currentTarget;
            const publishedLink = (form.elements.namedItem("publishedLink") as HTMLInputElement).value;
            
            runAction(qaPassAction, qaCompleteIdeaTarget.id, publishedLink);
            setQaCompleteIdeaTarget(null);
            showToast("Đã xác nhận QA ĐẠT và cập nhật link xuất bản");
          }}>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-200">
                🎉 Bạn đang xác nhận video đạt chuẩn chất lượng xuất bản. Vui lòng nhập link bài đăng thực tế (hoặc link lưu trữ sản phẩm cuối).
              </div>
              <div>
                <FieldLabel required>Link đăng video chính thức (TikTok / YouTube / FB / Drive)</FieldLabel>
                <TextInput id="publishedLink" autoFocus required placeholder="https://www.tiktok.com/@ynda/video/..." defaultValue={qaCompleteIdeaTarget.publishedLink || ""} />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <Btn onClick={() => setQaCompleteIdeaTarget(null)}>Huỷ</Btn>
              <Btn tone="success" type="submit" loading={isPending}>Xác nhận QA Đạt</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* QA REJECT MODAL */}
      {qaRejectIdeaTarget && (
        <Modal title={`Yêu cầu sửa lại video: ${qaRejectIdeaTarget.title}`} onClose={() => setQaRejectIdeaTarget(null)}>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const form = e.currentTarget;
            const feedback = (form.elements.namedItem("feedback") as HTMLTextAreaElement).value;

            if (!feedback.trim()) {
              alert("Bắt buộc ghi rõ lý do chưa đạt và yêu cầu chỉnh sửa.");
              return;
            }
            
            runAction(qaFailAction, qaRejectIdeaTarget.id, feedback);
            setQaRejectIdeaTarget(null);
            showToast("Đã gửi yêu cầu chỉnh sửa cho Producer");
          }}>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-rose-50 text-rose-800 text-xs border border-rose-200">
                Ghi chú chi tiết các điểm cần chỉnh sửa (âm thanh, text title, góc máy, nhịp dựng...) để Producer thực hiện lại.
              </div>
              <div>
                <FieldLabel required>Chi tiết nhận xét & yêu cầu sửa</FieldLabel>
                <TextArea id="feedback" autoFocus required rows={3} placeholder="VD: Âm lượng nhạc nền át tiếng voice ở giây 15-20, cần thêm phụ đề đoạn kết..." />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <Btn onClick={() => setQaRejectIdeaTarget(null)}>Huỷ</Btn>
              <Btn tone="danger" type="submit" loading={isPending}>Gửi yêu cầu sửa</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* SCHEDULE POST MODAL */}
      {schedulePostTarget && (
        <Modal title={`Lên lịch đăng bài: ${schedulePostTarget.title}`} onClose={() => setSchedulePostTarget(null)}>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const form = e.currentTarget;
            const postDate = (form.elements.namedItem("postDate") as HTMLInputElement).value;
            
            runAction(updateScheduledPostDateAction, schedulePostTarget.id, postDate);
            setSchedulePostTarget(null);
            showToast("Đã cập nhật lịch phát hành");
          }}>
            <div className="space-y-3">
              <div>
                <FieldLabel required>Ngày & Giờ dự kiến đăng bài</FieldLabel>
                <TextInput id="postDate" type="datetime-local" autoFocus required defaultValue={schedulePostTarget.scheduledPostDate || todayIso + "T20:00"} />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <Btn onClick={() => setSchedulePostTarget(null)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Lưu lịch đăng</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* REASSIGN MODAL */}
      {reassignIdeaTarget && (
        <Modal title={`Chuyển giao người phụ trách: ${reassignIdeaTarget.title}`} onClose={() => setReassignIdeaTarget(null)}>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const form = e.currentTarget;
            const newAssignee = (form.elements.namedItem("newAssignee") as HTMLSelectElement).value;
            
            runAction(reassignIdeaAction, reassignIdeaTarget.id, newAssignee);
            setReassignIdeaTarget(null);
            showToast("Đã đổi người phụ trách");
          }}>
            <div className="space-y-3">
              <div>
                <FieldLabel required>Chọn người phụ trách mới</FieldLabel>
                <Select id="newAssignee" required defaultValue={reassignIdeaTarget.assignedToEmail}>
                  {members.filter(m => m.active).map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.role}) — {m.id}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <Btn onClick={() => setReassignIdeaTarget(null)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Xác nhận chuyển</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* EXTEND DEADLINE MODAL */}
      {extendDeadlineTarget && (
        <Modal title={`Gia hạn Deadline: ${extendDeadlineTarget.title}`} onClose={() => setExtendDeadlineTarget(null)}>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const form = e.currentTarget;
            const newEndDate = (form.elements.namedItem("newEndDate") as HTMLInputElement).value;
            const reason = (form.elements.namedItem("reason") as HTMLInputElement).value;
            
            runAction(extendDeadlineAction, extendDeadlineTarget.id, newEndDate, reason);
            setExtendDeadlineTarget(null);
            showToast("Đã gia hạn deadline");
          }}>
            <div className="space-y-3">
              <div>
                <FieldLabel required>Ngày kết thúc mới (Deadline)</FieldLabel>
                <TextInput id="newEndDate" type="date" autoFocus required defaultValue={extendDeadlineTarget.endDate || todayIso} />
              </div>
              <div>
                <FieldLabel required>Lý do gia hạn</FieldLabel>
                <TextInput id="reason" required placeholder="VD: Khâu dựng cần thêm cảnh quay ngoại cảnh..." />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <Btn onClick={() => setExtendDeadlineTarget(null)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Gia hạn</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* CANCEL IDEA MODAL */}
      {cancelIdeaTarget && (
        <Modal title={`Huỷ ý tưởng: ${cancelIdeaTarget.title}`} onClose={() => setCancelIdeaTarget(null)}>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const form = e.currentTarget;
            const reason = (form.elements.namedItem("reason") as HTMLInputElement).value;
            
            runAction(cancelIdeaAction, cancelIdeaTarget.id, reason);
            setCancelIdeaTarget(null);
            showToast("Đã huỷ ý tưởng");
          }}>
            <div className="space-y-3">
              <div>
                <FieldLabel required>Lý do huỷ ý tưởng</FieldLabel>
                <TextInput id="reason" autoFocus required placeholder="VD: Không còn phù hợp định hướng nội dung tuần..." />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <Btn onClick={() => setCancelIdeaTarget(null)}>Huỷ</Btn>
              <Btn tone="danger" type="submit" loading={isPending}>Xác nhận huỷ</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {showChangePassword && (
        <Modal title="Đổi mật khẩu tài khoản" onClose={() => setShowChangePassword(false)}>
          <form onSubmit={async (e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const form = e.currentTarget;
            const oldPass = (form.elements.namedItem("oldPass") as HTMLInputElement).value;
            const newPass = (form.elements.namedItem("newPass") as HTMLInputElement).value;
            
            try {
              const res = await changePasswordAction(oldPass, newPass);
              if (res && typeof res === "object" && "error" in res && (res as any).error) {
                alert((res as any).error);
                return;
              }
              setShowChangePassword(false);
              showToast("Đã đổi mật khẩu thành công");
            } catch (err: any) {
              alert(err.message || "Lỗi đổi mật khẩu");
            }
          }}>
            <div className="space-y-3">
              <div>
                <FieldLabel required>Mật khẩu hiện tại</FieldLabel>
                <TextInput id="oldPass" type="password" required autoFocus />
              </div>
              <div>
                <FieldLabel required>Mật khẩu mới</FieldLabel>
                <TextInput id="newPass" type="password" required minLength={3} />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <Btn onClick={() => setShowChangePassword(false)}>Huỷ</Btn>
              <Btn tone="primary" type="submit">Lưu mật khẩu</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* SETTINGS MODAL (FOR CORE) */}
      {showSettingsModal && (
        <Modal title="Cài đặt hệ thống (Core Team)" onClose={() => setShowSettingsModal(false)}>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const form = e.currentTarget;
            const discordWebhook = (form.elements.namedItem("discordWebhook") as HTMLInputElement).value;
            const externalCalendar = (form.elements.namedItem("externalCalendar") as HTMLInputElement).value;
            
            runAction(updateSettingsAction, discordWebhook, externalCalendar);
            setShowSettingsModal(false);
            showToast("Đã lưu cài đặt");
          }}>
            <div className="space-y-3.5">
              <div>
                <FieldLabel>Discord Webhook URL (Nhận thông báo & Báo cáo tuần)</FieldLabel>
                <TextInput id="discordWebhook" defaultValue={settings.discordWebhookUrl} placeholder="https://discord.com/api/webhooks/..." />
                <p className="text-[11px] text-[#64748B] mt-1">Thông báo tự động gửi về kênh Discord mỗi khi có Pitch mới, QA, hoặc báo cáo tuần.</p>
              </div>

              <div>
                <FieldLabel>External Calendar URL (Google Calendar iCal / Notion)</FieldLabel>
                <TextInput id="externalCalendar" defaultValue={settings.externalCalendarUrl} placeholder="https://calendar.google.com/..." />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <Btn onClick={() => setShowSettingsModal(false)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Lưu cài đặt</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 px-4 py-2.5 rounded-lg bg-slate-900 text-white text-xs font-medium saas-shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 size={15} className="text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

    </div>
  );
}

/* ---------------------------------------------------------------------
   TAB 1: DASHBOARD VIEW (UNIFIED ACTION LIST)
--------------------------------------------------------------------- */
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
  onSubmitScript,
  onSubmitVideo,
  runAction
}: any) {
  // Tab Filter States for Unified Action List
  const [filterTab, setFilterTab] = useState<"ALL" | "PITCH" | "QA" | "MY_TASKS" | "OVERDUE">("ALL");

  // Filter groups
  const myTasks = ideas.filter((i: Idea) => {
    if (i.assignedToEmail !== actor.id) return false;
    return i.status === "ASSIGNMENT" || i.status === "PRODUCTION" || (i.status === "QA" && i.qaFeedback);
  });

  const pendingPitchIdeas = ideas.filter((i: Idea) => i.status === "PITCH");
  const pendingQaIdeas = ideas.filter((i: Idea) => i.status === "QA");
  const overdueIdeas = ideas.filter((i: Idea) => overdueInfo(i) !== null);

  // Filtered dataset according to active tab
  const displayIdeas = useMemo(() => {
    let result = [...ideas].filter(i => i.status !== "ARCHIVED_IDEA" && i.status !== "CANCELLED");
    
    if (filterTab === "PITCH") {
      result = pendingPitchIdeas;
    } else if (filterTab === "QA") {
      result = pendingQaIdeas;
    } else if (filterTab === "MY_TASKS") {
      result = myTasks;
    } else if (filterTab === "OVERDUE") {
      result = overdueIdeas;
    }

    return result.sort((a, b) => {
      const aOverdue = overdueInfo(a) ? 1 : 0;
      const bOverdue = overdueInfo(b) ? 1 : 0;
      if (bOverdue !== aOverdue) return bOverdue - aOverdue;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [ideas, filterTab, pendingPitchIdeas, pendingQaIdeas, myTasks, overdueIdeas]);

  const FORMAT_ICONS: Record<string, any> = {
    "TikTok": Video,
    "YouTube": Film,
    "Facebook": ClapIcon,
    "default": FileText
  };

  return (
    <div className="space-y-4">
      
      {/* HEADER ROW WITH ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h2 className="text-lg font-bold text-[#0F172A] tracking-tight flex items-center gap-2">
            Bảng danh sách công việc hợp nhất
          </h2>
          <p className="text-xs text-[#64748B]">
            Theo dõi toàn bộ luồng ý tưởng, kịch bản, sản xuất và kiểm duyệt QA trên một màn hình duy nhất.
          </p>
        </div>
      </div>

      {/* FILTER TABS (DYNAMIC COUNTS) */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar border-b border-slate-200 pb-2">
        <button
          onClick={() => setFilterTab("ALL")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filterTab === "ALL" 
              ? "bg-slate-900 text-white shadow-xs" 
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}>
          <span>Tất cả</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterTab === "ALL" ? "bg-slate-700 text-slate-200" : "bg-slate-100 text-slate-600"}`}>
            {ideas.filter((i: Idea) => i.status !== "ARCHIVED_IDEA" && i.status !== "CANCELLED").length}
          </span>
        </button>

        <button
          onClick={() => setFilterTab("PITCH")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filterTab === "PITCH" 
              ? "bg-slate-900 text-white shadow-xs" 
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}>
          <span>Cần duyệt Pitch</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterTab === "PITCH" ? "bg-slate-700 text-slate-200" : "bg-amber-100 text-amber-800"}`}>
            {pendingPitchIdeas.length}
          </span>
        </button>

        <button
          onClick={() => setFilterTab("QA")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filterTab === "QA" 
              ? "bg-slate-900 text-white shadow-xs" 
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}>
          <span>Chờ duyệt QA</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterTab === "QA" ? "bg-slate-700 text-slate-200" : "bg-rose-100 text-rose-800"}`}>
            {pendingQaIdeas.length}
          </span>
        </button>

        <button
          onClick={() => setFilterTab("MY_TASKS")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            filterTab === "MY_TASKS" 
              ? "bg-slate-900 text-white shadow-xs" 
              : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
          }`}>
          <span>Nhiệm vụ trực tiếp</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${filterTab === "MY_TASKS" ? "bg-slate-700 text-slate-200" : "bg-blue-100 text-blue-800"}`}>
            {myTasks.length}
          </span>
        </button>

        {overdueIdeas.length > 0 && (
          <button
            onClick={() => setFilterTab("OVERDUE")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterTab === "OVERDUE" 
                ? "bg-rose-700 text-white shadow-xs" 
                : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
            }`}>
            <span>Quá hạn</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-200 text-rose-900">
              {overdueIdeas.length}
            </span>
          </button>
        )}
      </div>

      {/* DATA TABLE CONTAINER */}
      <div className="bg-white border border-[#E2E8F0] rounded-xl saas-shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            {/* TABLE HEADER */}
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
                <th className="py-2.5 px-4 w-12 text-center">Loại</th>
                <th className="py-2.5 px-4">Tiêu đề nội dung</th>
                <th className="py-2.5 px-4 w-40">Kênh & Nền tảng</th>
                <th className="py-2.5 px-4 w-44">Phụ trách</th>
                <th className="py-2.5 px-4 w-48">Trạng thái & Hạn</th>
                <th className="py-2.5 px-4 w-32 text-right">Thao tác</th>
              </tr>
            </thead>

            {/* TABLE BODY */}
            <tbody className="divide-y divide-[#F1F5F9] text-xs">
              {displayIdeas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-xs text-[#64748B] italic">
                    Chưa có công việc nào chờ xử lý.
                  </td>
                </tr>
              ) : (
                displayIdeas.map((idea: Idea) => {
                  const od = overdueInfo(idea);
                  const pc = pcById[idea.platformChannelId];
                  const ch = pc ? channelGroupById[pc.channelGroupId] : null;
                  const pl = pc ? platformById[pc.platformId] : null;
                  const assignee = memberById[idea.assignedToEmail];
                  const submitter = memberById[idea.submittedByEmail];
                  const Icon = (pl && FORMAT_ICONS[pl.name]) || Film;
                  const statusStyle = STATUS_COLORS[idea.status] || STATUS_COLORS.PITCH;

                  return (
                    <tr 
                      key={idea.id} 
                      className={`hover:bg-[#F8FAFC] transition-colors group cursor-pointer ${
                        od?.level === 'red' ? 'bg-rose-50/40' : ''
                      }`}
                      onClick={() => onOpen(idea)}>
                      
                      {/* COL 1: FORMAT ICON */}
                      <td className="py-3 px-4 text-center" onClick={(e) => { e.stopPropagation(); onOpen(idea); }}>
                        <div className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-slate-200 transition-colors">
                          <Icon size={14} />
                        </div>
                      </td>

                      {/* COL 2: CONTENT TITLE */}
                      <td className="py-3 px-4 min-w-[240px]">
                        <div className="font-medium text-[#0F172A] group-hover:text-[#4F46E5] transition-colors line-clamp-1 leading-snug">
                          {idea.title}
                        </div>
                        {idea.description && (
                          <div className="text-[11px] text-[#64748B] truncate max-w-md mt-0.5">
                            {idea.description}
                          </div>
                        )}
                        {idea.qaFeedback && (
                          <div className="mt-1 text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-flex items-center gap-1 font-medium">
                            <AlertTriangle size={10} /> Yêu cầu sửa: {idea.qaFeedback}
                          </div>
                        )}
                      </td>

                      {/* COL 3: CHANNEL TAGS */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span 
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200"
                            style={{ borderLeftColor: ch?.color || "#64748B", borderLeftWidth: 3 }}>
                            {ch?.name || "Kênh"}
                          </span>
                          <span className="text-[10px] text-[#64748B] font-mono">
                            {pl?.name || "Nền tảng"} ({idea.durationDays || 2}d)
                          </span>
                        </div>
                      </td>

                      {/* COL 4: SUBMITTER / ASSIGNEE */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <UserAvatar name={assignee?.name || submitter?.name || "—"} size={20} />
                          <div className="truncate">
                            <div className="font-semibold text-slate-800 truncate text-[11px]">
                              {assignee?.name || submitter?.name || "Chưa giao"}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">
                              {assignee ? "Phụ trách" : "Người nộp"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* COL 5: STATUS & DEADLINE */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <span 
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
                            style={{ background: statusStyle.bg, color: statusStyle.fg, border: `1px solid ${statusStyle.bd}` }}>
                            {STATUS_LABEL[idea.status]}
                          </span>

                          {od ? (
                            <div className="text-[10px] font-mono text-rose-600 flex items-center gap-1 font-bold">
                              <AlertTriangle size={11} /> {od.msg}
                            </div>
                          ) : (
                            idea.endDate && (
                              <div className="text-[10px] text-slate-500 font-mono">
                                Hạn: {fmtDate(idea.endDate)}
                              </div>
                            )
                          )}
                        </div>
                      </td>

                      {/* COL 6: QUICK ACTIONS */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {/* PITCH APPROVE */}
                          {idea.status === "PITCH" && actor.role === "Core" && (
                            <button 
                              onClick={() => onApprove(idea)}
                              title="Duyệt ý tưởng"
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                              <Check size={14} />
                            </button>
                          )}

                          {/* SCRIPT SUBMIT */}
                          {idea.status === "ASSIGNMENT" && idea.assignedToEmail === actor.id && (
                            <button 
                              onClick={() => onSubmitScript(idea)}
                              title="Nộp kịch bản"
                              className="px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors text-[11px] font-bold">
                              Nộp kịch bản
                            </button>
                          )}

                          {/* PRODUCTION VIDEO SUBMIT */}
                          {idea.status === "PRODUCTION" && idea.assignedToEmail === actor.id && (
                            <button 
                              onClick={() => onSubmitVideo(idea)}
                              title="Nộp video"
                              className="px-2 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors text-[11px] font-bold">
                              Nộp video
                            </button>
                          )}

                          {/* QA PASS / FAIL */}
                          {idea.status === "QA" && (actor.role === "E" || actor.role === "Core") && (
                            <>
                              <button 
                                onClick={() => onQaComplete(idea)}
                                title="QA Đạt"
                                className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors">
                                <Check size={14} />
                              </button>
                              <button 
                                onClick={() => onQaReject(idea)}
                                title="QA Chưa đạt"
                                className="p-1.5 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors">
                                <X size={14} />
                              </button>
                            </>
                          )}

                          {/* DETAIL BUTTON */}
                          <button 
                            onClick={() => onOpen(idea)}
                            title="Xem chi tiết"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                            <ChevronRight size={15} />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

/* ---------------------------------------------------------------------
   SLIDE-OVER PANEL: IDEA DETAILS & THREADED COMMENTS (500px)
--------------------------------------------------------------------- */
function IdeaSlideOverDrawer({
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
  const statusStyle = STATUS_COLORS[idea.status] || STATUS_COLORS.PITCH;

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    runAction(addCommentAction, idea.id, commentInput.trim());
    setCommentInput("");
    showToast("Đã gửi bình luận");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-150">
      {/* BACKDROP */}
      <div 
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-2xs" 
        onClick={onClose} 
      />

      {/* DRAWER CONTAINER (500px) */}
      <div className="relative w-full max-w-[500px] h-full bg-white border-l border-[#E2E8F0] shadow-2xl z-50 flex flex-col animate-slide-in-right overflow-hidden">
        
        {/* DRAWER STICKY HEADER */}
        <div className="p-4 border-b border-[#E2E8F0] bg-slate-50/80 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              <span 
                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: statusStyle.bg, color: statusStyle.fg, border: `1px solid ${statusStyle.bd}` }}>
                {STATUS_LABEL[idea.status]}
              </span>
              {ch && (
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                  {ch.name}
                </span>
              )}
              {pl && (
                <span className="text-[10px] text-slate-500 font-mono">
                  · {pl.name}
                </span>
              )}
            </div>

            <h3 className="text-base font-bold text-slate-900 leading-snug">
              {idea.title}
            </h3>
          </div>

          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors">
            <X size={17} />
          </button>
        </div>

        {/* QUICK ACTION BAR */}
        <div className="px-4 py-2 bg-slate-100/60 border-b border-slate-200 flex items-center gap-1.5 flex-wrap">
          {idea.status === "PITCH" && actor.role === "Core" && (
            <Btn small tone="primary" onClick={onApprove}>
              <CheckCircle2 size={13} /> Duyệt ý tưởng
            </Btn>
          )}

          {idea.status === "ASSIGNMENT" && idea.assignedToEmail === actor.id && (
            <Btn small tone="primary" onClick={onSubmitScript}>
              <PenLine size={13} /> Nộp kịch bản
            </Btn>
          )}

          {idea.status === "SCRIPT" && (actor.role === "E" || actor.role === "Core") && (
            <Btn small tone="primary" onClick={() => runAction(startProductionAction, idea.id)}>
              <Play size={13} /> Bắt đầu sản xuất
            </Btn>
          )}

          {idea.status === "PRODUCTION" && idea.assignedToEmail === actor.id && (
            <Btn small tone="primary" onClick={onSubmitVideo}>
              <Video size={13} /> Nộp video
            </Btn>
          )}

          {idea.status === "QA" && (actor.role === "E" || actor.role === "Core") && (
            <>
              <Btn small tone="success" onClick={onQaComplete}>
                <CheckCircle2 size={13} /> QA Đạt
              </Btn>
              <Btn small tone="danger" onClick={onQaReject}>
                <XCircle size={13} /> QA Chưa đạt
              </Btn>
            </>
          )}

          {idea.status === "COMPLETE" && actor.role === "Core" && (
            <Btn small tone="default" onClick={onSchedule}>
              <CalendarDays size={13} /> Lên lịch đăng
            </Btn>
          )}

          {actor.role === "Core" && idea.status !== "COMPLETE" && (
            <Btn small tone="default" onClick={onReassign}>
              Đổi người
            </Btn>
          )}

          {actor.role === "Core" && idea.status === "PRODUCTION" && (
            <Btn small tone="default" onClick={onExtendDeadline}>
              Gia hạn
            </Btn>
          )}

          <div className="flex-1" />

          {idea.status !== "COMPLETE" && (actor.role === "Core" || (idea.status === "PITCH" && idea.submittedByEmail === actor.id)) && (
            <Btn small tone="ghost" onClick={onCancel}>
              Huỷ
            </Btn>
          )}
        </div>

        {/* DRAWER SCROLLABLE BODY */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-slate-700">

          {/* OVERDUE ALERT */}
          {od && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2 font-medium">
              <AlertTriangle size={14} className="text-rose-600" />
              <span>{od.msg}</span>
            </div>
          )}

          {/* QA FEEDBACK */}
          {idea.qaFeedback && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 leading-relaxed">
              <b className="block text-xs font-bold text-rose-800 uppercase mb-0.5">Yêu cầu chỉnh sửa QA:</b>
              {idea.qaFeedback}
            </div>
          )}

          {/* SCRIPT / VIDEO / PUBLISHED LINKS */}
          <div className="space-y-1.5">
            {idea.scriptLink && (
              <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-between">
                <span className="font-semibold text-blue-900 flex items-center gap-1.5">
                  <FileText size={13} /> Kịch bản:
                </span>
                <a href={idea.scriptLink} target="_blank" rel="noreferrer" className="text-blue-700 hover:underline flex items-center gap-1 font-mono">
                  Mở Google Docs <ExternalLink size={12} />
                </a>
              </div>
            )}

            {idea.videoLink && (
              <div className="p-2.5 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-between">
                <span className="font-semibold text-purple-900 flex items-center gap-1.5">
                  <Video size={13} /> Video Draft:
                </span>
                <a href={idea.videoLink} target="_blank" rel="noreferrer" className="text-purple-700 hover:underline flex items-center gap-1 font-mono">
                  Mở bản nháp <ExternalLink size={12} />
                </a>
              </div>
            )}

            {idea.publishedLink && (
              <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Minh chứng xuất bản:
                </span>
                <a href={idea.publishedLink} target="_blank" rel="noreferrer" className="text-emerald-700 hover:underline flex items-center gap-1 font-mono">
                  Xem video đã đăng <ExternalLink size={12} />
                </a>
              </div>
            )}
          </div>

          {/* DESCRIPTION */}
          {idea.description && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 leading-relaxed">
              <span className="font-bold text-slate-900 block mb-1 text-[11px] uppercase tracking-wider">
                Mô tả chi tiết & kịch bản:
              </span>
              <p className="text-slate-700 whitespace-pre-line">{idea.description}</p>
            </div>
          )}

          {/* TIMELINE MILESTONES */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
              Tiến độ quy trình (Workflow)
            </div>
            <div className="relative pl-3 border-l-2 border-slate-200 space-y-2 ml-1">
              <div className="relative">
                <div className="absolute w-2 h-2 bg-slate-400 rounded-full -left-[17px] top-1" />
                <p className="text-[11px] text-slate-600">Nộp ý tưởng: <span className="text-slate-900 font-medium">{fmtDateTime(idea.createdAt)}</span></p>
              </div>
              {idea.assignedAt && (
                <div className="relative">
                  <div className="absolute w-2 h-2 bg-blue-500 rounded-full -left-[17px] top-1" />
                  <p className="text-[11px] text-slate-600">Giao việc: <span className="text-slate-900 font-medium">{fmtDateTime(idea.assignedAt)}</span></p>
                </div>
              )}
              {idea.videoSubmittedAt && (
                <div className="relative">
                  <div className="absolute w-2 h-2 bg-purple-500 rounded-full -left-[17px] top-1" />
                  <p className="text-[11px] text-slate-600">Nộp video QA: <span className="text-slate-900 font-medium">{fmtDateTime(idea.videoSubmittedAt)}</span></p>
                </div>
              )}
              {idea.status === "COMPLETE" && (
                <div className="relative">
                  <div className="absolute w-2 h-2 bg-emerald-500 rounded-full -left-[17px] top-1" />
                  <p className="text-[11px] text-emerald-700 font-bold">Hoàn thành kiểm duyệt QA</p>
                </div>
              )}
            </div>
          </div>

          {/* CREDITS ATTRIBUTION */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
            <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wider mb-1">
              Ghi nhận đóng góp (Credits)
            </div>
            <CreditItem icon={Lightbulb} label="Idea gốc" member={memberById[idea.creditsIdeaByEmail]} />
            <CreditItem icon={ShieldCheck} label="Duyệt bởi (Core)" member={memberById[idea.creditsApprovedByEmail]} />
            <CreditItem icon={PenLine} label="Viết kịch bản" member={memberById[idea.creditsScriptByEmail]} />
            <CreditItem icon={Scissors} label="Biên tập" member={memberById[idea.creditsEditedScriptByEmail]} />
            <CreditItem icon={ClapIcon} label="Sản xuất (Quay/Dựng)" member={memberById[idea.creditsProducedByEmail]} />
            <CreditItem icon={ShieldCheck} label="Kiểm duyệt QA" member={memberById[idea.creditsQaByEmail]} />
          </div>

          {/* THREADED COMMENTS */}
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <div className="flex items-center gap-1.5">
              <MessageSquare size={14} className="text-slate-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase">Thảo luận & Bình luận ({comments.length})</h4>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">Chưa có bình luận nào trên ý tưởng này.</p>
              ) : (
                comments.map((cmt: CommentItem) => {
                  const author = memberById[cmt.memberId];
                  return (
                    <div key={cmt.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <UserAvatar name={author?.name || cmt.memberId} size={18} />
                          <span className="font-semibold text-slate-900">{author?.name || cmt.memberId}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{fmtDateTime(cmt.createdAt)}</span>
                      </div>
                      <div className="text-slate-700 leading-relaxed pl-6">{cmt.content}</div>
                    </div>
                  );
                })
              )}
            </div>

            {/* COMMENT INPUT */}
            <form onSubmit={handleAddComment} className="flex gap-1.5 pt-1">
              <TextInput 
                value={commentInput} 
                onChange={(e: any) => setCommentInput(e.target.value)} 
                placeholder="Viết trao đổi / nhận xét cho ý tưởng này..." 
                className="text-xs"
              />
              <Btn tone="primary" type="submit" small><Send size={12} /> Gửi</Btn>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}

function CreditItem({ icon: Icon, label, member }: any) {
  return (
    <div className="flex items-center justify-between py-0.5 text-xs">
      <div className="flex items-center gap-1.5 text-slate-500">
        <Icon size={12} className="text-slate-400" />
        <span>{label}</span>
      </div>
      <span className={`font-semibold ${member ? 'text-slate-900' : 'text-slate-400 font-normal'}`}>
        {member ? member.name : "—"}
      </span>
    </div>
  );
}

/* ---------------------------------------------------------------------
   TAB 2: KANBAN BOARD VIEW (PIPELINE Ý TƯỞNG)
--------------------------------------------------------------------- */
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
      if (boardSubTab === "active" && (idea.status === "ARCHIVED_IDEA" || idea.status === "CANCELLED")) return false;
      if (boardSubTab === "archived" && idea.status !== "ARCHIVED_IDEA" && idea.status !== "CANCELLED") return false;
      
      if (searchQuery && searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = idea.title.toLowerCase().includes(q);
        const matchDesc = (idea.description || "").toLowerCase().includes(q);
        if (!matchTitle && !matchDesc) return false;
      }

      if (filterChannelGroupId !== "ALL") {
        const pc = pcById[idea.platformChannelId];
        if (!pc || pc.channelGroupId !== filterChannelGroupId) return false;
      }

      if (filterPlatformId !== "ALL") {
        const pc = pcById[idea.platformChannelId];
        if (!pc || pc.platformId !== filterPlatformId) return false;
      }

      if (filterStatus !== "ALL" && idea.status !== filterStatus) return false;

      if (filterAssignee !== "ALL") {
        if (idea.assignedToEmail !== filterAssignee && idea.submittedByEmail !== filterAssignee) return false;
      }

      if (filterOverdueOnly && !overdueInfo(idea)) return false;

      return true;
    });
  }, [ideas, boardSubTab, searchQuery, filterChannelGroupId, filterPlatformId, filterStatus, filterAssignee, filterOverdueOnly, pcById]);

  return (
    <div className="space-y-4">
      {/* TOP CONTROLS & FILTER BAR */}
      <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white saas-shadow flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Subtabs: Active vs Archived */}
          <div className="flex p-0.5 bg-slate-100 rounded-lg border border-slate-200 text-xs">
            <button 
              onClick={() => setBoardSubTab("active")}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${boardSubTab === "active" ? "bg-white text-slate-900 saas-shadow" : "text-slate-600 hover:text-slate-900"}`}>
              Đang thực hiện
            </button>
            <button 
              onClick={() => setBoardSubTab("archived")}
              className={`px-3 py-1 rounded-md font-semibold transition-all ${boardSubTab === "archived" ? "bg-white text-slate-900 saas-shadow" : "text-slate-600 hover:text-slate-900"}`}>
              Lưu trữ / Đã huỷ
            </button>
          </div>
        </div>

        {/* Filter dropdowns */}
        <div className="flex items-center gap-2 flex-wrap">
          <select 
            value={filterChannelGroupId} 
            onChange={(e) => setFilterChannelGroupId(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 outline-none">
            <option value="ALL">Tất cả Kênh</option>
            {channelGroups.filter((c: any) => !c.archived).map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>

          <select 
            value={filterPlatformId} 
            onChange={(e) => setFilterPlatformId(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 outline-none">
            <option value="ALL">Tất cả Nền tảng</option>
            {platforms.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select 
            value={filterAssignee} 
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 outline-none">
            <option value="ALL">Tất cả Thành viên</option>
            {Object.values(memberById).map((m: any) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KANBAN BOARD COLUMNS */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3.5 overflow-x-auto pb-4">
        {STATUS_ORDER.map((statusKey) => {
          const colIdeas = filteredIdeas.filter((i: Idea) => i.status === statusKey);
          const colStyle = STATUS_COLORS[statusKey];

          return (
            <div key={statusKey} className="flex flex-col rounded-xl border border-slate-200 bg-[#F1F5F9]/60 p-2.5 min-h-[500px]">
              
              {/* COLUMN HEADER */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200 px-1">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ background: colStyle.fg }} />
                  {STATUS_LABEL[statusKey]}
                </span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white text-slate-600 border border-slate-200">
                  {colIdeas.length}
                </span>
              </div>

              {/* COLUMN CARDS */}
              <div className="flex-1 space-y-2 overflow-y-auto">
                {colIdeas.map((idea: Idea) => {
                  const pc = pcById[idea.platformChannelId];
                  const ch = pc ? channelGroupById[pc.channelGroupId] : null;
                  const pl = pc ? platformById[pc.platformId] : null;
                  const od = overdueInfo(idea);
                  const assignee = memberById[idea.assignedToEmail];

                  return (
                    <div
                      key={idea.id}
                      onClick={() => onOpen(idea)}
                      className={`p-3 rounded-lg border border-slate-200 bg-white hover:border-slate-400 saas-shadow transition-all cursor-pointer space-y-2 ${
                        od?.level === 'red' ? 'border-l-4 border-l-rose-500' : ''
                      }`}
                      style={{ borderLeftColor: od?.level === 'red' ? '#E11D48' : (ch?.color || '#CBD5E1'), borderLeftWidth: 3 }}>
                      
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-[10px] font-semibold text-slate-500 truncate">
                          {ch?.name} · {pl?.name}
                        </span>
                        {od && (
                          <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                            Trễ hạn
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                        {idea.title}
                      </h4>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-500">
                        <div className="flex items-center gap-1">
                          <UserAvatar name={assignee?.name || idea.submittedByEmail} size={16} />
                          <span className="truncate max-w-[80px]">{assignee?.name || "—"}</span>
                        </div>
                        <span>{fmtDate(idea.createdAt)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   TAB 3: GANTT CHART BY CHANNEL
--------------------------------------------------------------------- */
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
  const currentChannel = channelGroups.find((c: any) => c.id === ganttChannelId) || channelGroups[0];

  const channelIdeas = useMemo(() => {
    if (!currentChannel) return [];
    return ideas.filter((i: Idea) => {
      const pc = pcById[i.platformChannelId];
      return pc && pc.channelGroupId === currentChannel.id && i.status !== "ARCHIVED_IDEA" && i.status !== "CANCELLED";
    });
  }, [ideas, currentChannel, pcById]);

  return (
    <div className="space-y-4">
      {/* CHANNEL TABS & ACTIONS */}
      <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white saas-shadow flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {channelGroups.map((c: any) => (
            <button
              key={c.id}
              onClick={() => setGanttChannelId(c.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                ganttChannelId === c.id 
                  ? "bg-slate-900 text-white shadow-xs" 
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}>
              <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
              <span>{c.name}</span>
            </button>
          ))}
        </div>

        {actor.role === "Core" && (
          <div className="flex items-center gap-2">
            <Btn small onClick={onNewChannel}><Plus size={12} /> Thêm Kênh</Btn>
            <Btn small onClick={onNewPlatform}><Plus size={12} /> Thêm Nền tảng</Btn>
          </div>
        )}
      </div>

      {/* GANTT TIMELINE TABLE */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white saas-shadow overflow-hidden">
        <div className="p-4 border-b border-[#E2E8F0] bg-slate-50 flex items-center justify-between">
          <h3 className="font-bold text-xs text-slate-900 uppercase">
            Tiến độ sản xuất Kênh: {currentChannel?.name}
          </h3>
          <span className="text-xs text-slate-500 font-mono">Tháng {today.getMonth() + 1}/{today.getFullYear()}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500">
                <th className="py-2.5 px-4 w-60">Ý tưởng & Kịch bản</th>
                <th className="py-2.5 px-3 w-28">Phụ trách</th>
                <th className="py-2.5 px-3 w-28">Trạng thái</th>
                <th className="py-2.5 px-4">Timeline tiến độ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {channelIdeas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 italic">
                    Chưa có dự án nào đang chạy trên kênh này.
                  </td>
                </tr>
              ) : (
                channelIdeas.map((idea: Idea) => {
                  const assignee = memberById[idea.assignedToEmail];
                  const statusStyle = STATUS_COLORS[idea.status] || STATUS_COLORS.PITCH;

                  return (
                    <tr key={idea.id} onClick={() => onOpenIdea(idea)} className="hover:bg-slate-50 transition-colors cursor-pointer">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="line-clamp-1">{idea.title}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <UserAvatar name={assignee?.name || "—"} size={18} />
                          <span className="truncate text-[11px]">{assignee?.name || "Chưa giao"}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span 
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ background: statusStyle.bg, color: statusStyle.fg, border: `1px solid ${statusStyle.bd}` }}>
                          {STATUS_LABEL[idea.status]}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="h-4 rounded-full bg-slate-100 overflow-hidden relative border border-slate-200">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${Math.min(100, Math.max(15, (idea.durationDays || 2) * 20))}%`,
                              background: currentChannel?.color || "#4F46E5"
                            }} 
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   TAB 4: MASTER TIMELINE VIEW (TIMELINE TỔNG)
--------------------------------------------------------------------- */
function MasterTimelineView({
  channelGroups,
  platforms,
  platformChannels,
  ideas,
  channelGroupById,
  platformById,
  pcById,
  memberById,
  onOpenIdea
}: any) {
  const activeIdeas = ideas.filter((i: Idea) => i.status !== "ARCHIVED_IDEA" && i.status !== "CANCELLED");

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-xl border border-[#E2E8F0] bg-white saas-shadow">
        <h3 className="font-bold text-sm text-slate-900 mb-1">Timeline Tổng Quan Toàn Bộ Dự Án</h3>
        <p className="text-xs text-slate-500">Giám sát tổng thể các khâu sản xuất đa kênh trong studio.</p>
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-white saas-shadow divide-y divide-slate-100 overflow-hidden">
        {activeIdeas.map((idea: Idea) => {
          const pc = pcById[idea.platformChannelId];
          const ch = pc ? channelGroupById[pc.channelGroupId] : null;
          const pl = pc ? platformById[pc.platformId] : null;
          const assignee = memberById[idea.assignedToEmail];

          return (
            <div key={idea.id} onClick={() => onOpenIdea(idea)} className="p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">{ch?.name} · {pl?.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">({idea.durationDays || 2} ngày)</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 truncate">{idea.title}</h4>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center gap-1.5">
                  <UserAvatar name={assignee?.name || "—"} size={20} />
                  <span className="text-xs text-slate-700">{assignee?.name || "Chưa giao"}</span>
                </div>
                <Badge tone={idea.status === "COMPLETE" ? "green" : (idea.status === "QA" ? "red" : "amber")}>
                  {STATUS_LABEL[idea.status]}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   TAB 5: CONTENT CALENDAR VIEW (LỊCH PHÁT HÀNH)
--------------------------------------------------------------------- */
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
  const scheduledIdeas = ideas.filter((i: Idea) => i.scheduledPostDate || i.status === "COMPLETE");

  return (
    <div className="space-y-4">
      <div className="p-3.5 rounded-xl border border-[#E2E8F0] bg-white saas-shadow flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-sm text-slate-900">Lịch Phát Hành Nội Dung (Content Calendar)</h3>
          <p className="text-xs text-slate-500">Kế hoạch đăng tải video trên các kênh chính thức của Ý Niệm Điện Ảnh.</p>
        </div>
        {settings.externalCalendarUrl && (
          <a href={settings.externalCalendarUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline font-semibold">
            <span>Mở Lịch Ngoài</span> <ExternalLink size={12} />
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {scheduledIdeas.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400 italic bg-white border border-slate-200 rounded-xl">
            Chưa có bài đăng nào được lên lịch phát hành.
          </div>
        ) : (
          scheduledIdeas.map((idea: Idea) => {
            const pc = pcById[idea.platformChannelId];
            const ch = pc ? channelGroupById[pc.channelGroupId] : null;
            const pl = pc ? platformById[pc.platformId] : null;

            return (
              <div 
                key={idea.id} 
                onClick={() => onOpenIdea(idea)}
                className="p-4 rounded-xl border border-slate-200 bg-white saas-shadow hover:border-slate-400 transition-all cursor-pointer space-y-2.5"
                style={{ borderTopColor: ch?.color || "#4F46E5", borderTopWidth: 3 }}>
                
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-600">{ch?.name}</span>
                  <span className="font-mono text-indigo-600 font-bold">{fmtDateTime(idea.scheduledPostDate || idea.createdAt)}</span>
                </div>

                <h4 className="text-xs font-bold text-slate-900 leading-snug line-clamp-2">
                  {idea.title}
                </h4>

                {idea.publishedLink ? (
                  <a href={idea.publishedLink} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-[11px] text-emerald-700 font-semibold hover:underline flex items-center gap-1">
                    <CheckCircle2 size={12} /> Đã xuất bản <ExternalLink size={10} />
                  </a>
                ) : (
                  <div className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 inline-block font-medium">
                    Chờ lên sóng
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   TAB 6: WEEKLY REPORTS VIEW (BÁO CÁO TUẦN)
--------------------------------------------------------------------- */
function WeeklyReportView({
  ideas,
  channelGroups,
  platforms,
  platformChannels,
  members,
  channelGroupById,
  actor,
  runAction,
  showToast
}: any) {
  const completedCount = ideas.filter((i: Idea) => i.status === "COMPLETE").length;
  const inProductionCount = ideas.filter((i: Idea) => i.status === "PRODUCTION" || i.status === "QA").length;
  const overdueCount = ideas.filter((i: Idea) => overdueInfo(i) !== null).length;

  return (
    <div className="space-y-5">
      {/* SUMMARY STATS GRID */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl border border-slate-200 bg-white saas-shadow">
          <div className="text-[11px] font-bold text-slate-500 uppercase">Tổng Ý Tưởng</div>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{ideas.length}</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white saas-shadow">
          <div className="text-[11px] font-bold text-indigo-600 uppercase">Đang Sản Xuất / QA</div>
          <div className="text-2xl font-extrabold text-indigo-700 mt-1">{inProductionCount}</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white saas-shadow">
          <div className="text-[11px] font-bold text-emerald-600 uppercase">Hoàn Thành (Xuất bản)</div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-1">{completedCount}</div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-white saas-shadow">
          <div className="text-[11px] font-bold text-rose-600 uppercase">Dự Án Trễ Hạn</div>
          <div className="text-2xl font-extrabold text-rose-700 mt-1">{overdueCount}</div>
        </div>
      </div>

      {/* DISCORD SYNC REPORT BUTTON */}
      {actor.role === "Core" && (
        <div className="p-4 rounded-xl border border-slate-200 bg-white saas-shadow flex items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-xs text-slate-900">Gửi Báo Cáo Tuần lên Discord</h4>
            <p className="text-xs text-slate-500 mt-0.5">Tự động tổng kết số liệu và gửi tin nhắn formatted sang server Discord.</p>
          </div>
          <Btn tone="primary" onClick={() => {
            runAction(sendWeeklyReportToDiscordAction);
            showToast("Đã gửi báo cáo tuần sang Discord!");
          }}>
            <Send size={13} /> Gửi Báo Cáo Ngay
          </Btn>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------------
   TAB 7: MEMBERS & AUDIT LOG VIEW
--------------------------------------------------------------------- */
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
  return (
    <div className="space-y-5">
      {/* TEAM DIRECTORY */}
      <div className="rounded-xl border border-slate-200 bg-white saas-shadow p-4">
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Đội Ngũ Nhân Sự Studio ({members.length})</h3>
            <p className="text-xs text-slate-500">Danh sách các thành viên Core, Editor và Producer trong hệ thống.</p>
          </div>
          {actor.role === "Core" && (
            <Btn small tone="primary" onClick={onAddMember}><Plus size={12} /> Thêm Thành Viên</Btn>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {members.map((m: Member) => (
            <div key={m.id} className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <UserAvatar name={m.name} size={28} />
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-slate-900 truncate">{m.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{m.id}</div>
                </div>
              </div>
              <RoleChip role={m.role} />
            </div>
          ))}
        </div>
      </div>

      {/* AUDIT LOG TABLE */}
      <div className="rounded-xl border border-slate-200 bg-white saas-shadow p-4">
        <h3 className="font-bold text-sm text-slate-900 mb-3">Nhật Ký Thao Tác Hệ Thống (Audit Log)</h3>
        <div className="max-h-64 overflow-y-auto space-y-1.5 divide-y divide-slate-100 text-xs">
          {auditLogs.slice(0, 30).map((log: AuditLogItem) => (
            <div key={log.id} className="pt-1.5 flex items-center justify-between gap-2 text-slate-700">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">{log.memberId}</span>
                <span>{log.action}</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">{fmtDateTime(log.timestamp)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   TAB 8: PORTFOLIO VIEW
--------------------------------------------------------------------- */
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
  const selectedMember = members.find((m: any) => m.id === selected) || members[0];

  const completedWorks = useMemo(() => {
    if (!selectedMember) return [];
    return ideas.filter((i: Idea) => 
      i.status === "COMPLETE" && 
      i.publishedLink && 
      (i.assignedToEmail === selectedMember.id || i.submittedByEmail === selectedMember.id || (i as any).creditsProducedByEmail === selectedMember.id)
    );
  }, [ideas, selectedMember]);

  return (
    <div className="space-y-4">
      {/* MEMBER SELECTOR */}
      <div className="p-3.5 rounded-xl border border-slate-200 bg-white saas-shadow flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Award size={18} className="text-amber-600" />
          <span className="font-bold text-xs text-slate-900">Xem Portfolio của:</span>
          <select 
            value={selected} 
            onChange={(e) => setSelected(e.target.value)}
            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white font-semibold text-slate-800 outline-none">
            {members.map((m: any) => (
              <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
            ))}
          </select>
        </div>

        {selectedMember && (
          <a 
            href={`/portfolio/${encodeURIComponent(selectedMember.id)}`} 
            target="_blank" 
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:underline font-semibold">
            <span>Mở Trang Công Khai</span> <ExternalLink size={12} />
          </a>
        )}
      </div>

      {/* WORKS LIST */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {completedWorks.length === 0 ? (
          <div className="col-span-full py-12 text-center text-xs text-slate-400 italic bg-white border border-slate-200 rounded-xl">
            Chưa có video xuất bản nào được ghi nhận cho thành viên này.
          </div>
        ) : (
          completedWorks.map((idea: Idea) => (
            <div key={idea.id} className="p-4 rounded-xl border border-slate-200 bg-white saas-shadow space-y-2">
              <h4 className="text-xs font-bold text-slate-900 leading-snug">{idea.title}</h4>
              <p className="text-[11px] text-slate-500 line-clamp-2">{idea.description}</p>
              <a href={idea.publishedLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:underline">
                <span>Xem video đã đăng</span> <ExternalLink size={11} />
              </a>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
