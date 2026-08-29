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
  Inbox, Menu, ArrowUpRight, Hash, Flame, TrendingUp, Download, Upload
} from "lucide-react";

import { loginWithCredentialsAction, logoutAction, changePasswordAction } from "../../actions/auth-actions";
import { 
  submitIdeaAction, approveIdeaAction, submitScriptAction, startProductionAction, 
  submitVideoAction, qaPassAction, qaFailAction, deleteIdeaAction, cancelIdeaAction,
  archiveUnselectedIdeasAction, restoreArchivedIdeaAction, updateScheduledPostDateAction, 
  triggerDailyCronAction, reassignIdeaAction, updateIdeaDetailsAction, extendDeadlineAction,
  updateIdeaNoteAction, rateIdeaAction, cloneIdeaAction
} from "../../actions/idea-actions";
import { 
  createChannelGroupAction, updateChannelGroupAction, archiveChannelGroupAction, restoreChannelGroupAction, 
  createPlatformAction, deletePlatformAction, createMemberAction, removeMemberAction, updateMemberProfileAction, 
  toggleMemberActiveAction, updateSettingsAction, bulkImportMembersAction 
} from "../../actions/admin-actions";
import { addCommentAction } from "../../actions/comment-actions";
import { markNotificationAsReadAction, markAllNotificationsAsReadAction } from "../../actions/notification-actions";
import { sendWeeklyReportToDiscordAction } from "../../actions/report-actions";
import { createChecklistAction, updateChecklistStatusAction, deleteChecklistAction, updateChecklistDetailsAction } from "../../actions/checklist-actions";
import { createPitchingBatchAction, closePitchingBatchAction } from "../../actions/pitching-batch-actions";
import { Member, Platform, ChannelGroup, PlatformChannel, Idea, CommentItem, AuditLogItem, NotificationItem, ChecklistItem, AppSettings, PitchingBatch, Role } from "../../lib/types";

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

export const CONTENT_PILLARS = [
  { value: "Branding", label: "1. Branding — Làm sáng thương hiệu", desc: "Ý niệm điện ảnh là thương hiệu gì? Core là gì? Branding thuần cho kênh -> Khẳng định giá trị." },
  { value: "Trải nghiệm", label: "2. Trải nghiệm — Feedback & Tương tác", desc: "Feedback, trải nghiệm, tương tác giữa người xem và nhà sáng tạo. Phản hồi ý kiến người xem." },
  { value: "News", label: "3. News — Tin tức & Đu trend hot", desc: "Cập nhật tin tức chung của ngành, thông tin, luật pháp, nội dung mới & hot." },
  { value: "PR", label: "4. PR — Niềm tin & Kiến thức điện ảnh", desc: "Tạo mối quan hệ, niềm tin của người xem với ngành điện ảnh." },
  { value: "Personal Branding", label: "5. Personal Branding — Chuyên môn & Nhân vật", desc: "Chuyên môn -> Xây dựng nhân vật (tính cách, chuỗi phân tích hành vi)." },
  { value: "Content Đối tác", label: "6. Content cho đối tác — Hợp tác & Tài trợ", desc: "Nội dung hợp tác & tài trợ thương mại với các thương hiệu đối tác." }
];

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

function normalizeRole(r: string): 'Core' | 'E' | 'P' {
  const clean = (r || '').trim().toLowerCase();
  if (clean === 'core' || clean.includes('điều hành') || clean.includes('dieu hanh') || clean === 'quản lý' || clean === 'quan ly') return 'Core';
  if (clean === 'e' || clean === 'editor' || clean.includes('đào tạo') || clean.includes('dao tao') || clean.includes('biên tập') || clean.includes('bien tap')) return 'E';
  return 'P';
}

function RoleChip({ role }: { role: string }) {
  const norm = normalizeRole(role);
  if (norm === "Core") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
        CORE TEAM
      </span>
    );
  }
  if (norm === "E") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-[#DBEAFE] text-[#1E40AF] border border-[#BFDBFE]">
        EDITOR (ĐÀO TẠO)
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider bg-[#F3E8FF] text-[#6B21A8] border border-[#E9D5FF]">
      PRODUCER (DỰ ÁN)
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
              placeholder="Nhập email hoặc tên tài khoản..." 
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
  initialPitchingBatches?: PitchingBatch[];
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
  initialPitchingBatches,
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
  const pitchingBatches = initialPitchingBatches || [];

  // Mobile sidebar toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Tab navigation
  const [tab, setTab] = useState("dashboard"); // "dashboard" | "board" | "gantt" | "timeline" | "calendar" | "reports" | "members" | "portfolio"
  
  // Slide-over & Modals
  const [openIdea, setOpenIdea] = useState<Idea | null>(null);
  const [showNewIdea, setShowNewIdea] = useState(false);
  const [showNewPitchingBatchModal, setShowNewPitchingBatchModal] = useState(false);
  const [approveIdeaTarget, setApproveIdeaTarget] = useState<Idea | null>(null);
  const [qaRejectIdeaTarget, setQaRejectIdeaTarget] = useState<Idea | null>(null);
  const [qaCompleteIdeaTarget, setQaCompleteIdeaTarget] = useState<Idea | null>(null);
  const [cancelIdeaTarget, setCancelIdeaTarget] = useState<Idea | null>(null);
  const [schedulePostTarget, setSchedulePostTarget] = useState<Idea | null>(null);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [editChannelTarget, setEditChannelTarget] = useState<ChannelGroup | null>(null);
  const [selectedPcId, setSelectedPcId] = useState<string>("");
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

  // Auto-refresh polling (only when tab is active/visible)
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') {
        router.refresh();
      }
    }, 45000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        router.refresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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

      {/* MOBILE SIDEBAR OVERLAY BACKDROP */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 md:hidden" 
          onClick={() => setSidebarOpen(false)} 
        />
      )}

      {/* -------------------------------------------------------------
         FIXED LEFT SIDEBAR (Width: 240px, Background: #F1F5F9)
         On mobile: off-canvas overlay, toggled by hamburger
      ------------------------------------------------------------- */}
      <aside className={`w-60 shrink-0 bg-[#F1F5F9] border-r border-[#E2E8F0] flex flex-col h-screen select-none transition-transform duration-200 ease-out fixed top-0 left-0 z-50 md:sticky md:z-30 md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
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
                      setSidebarOpen(false);
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
                    onClick={() => { setTab(item.id); setSidebarOpen(false); }}
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
      <div className="flex-1 flex flex-col min-w-0 min-h-screen md:ml-0">
        
        {/* TOP HEADER (Height: 48px, Background: #FFFFFF) */}
        <header className="h-12 sticky top-0 z-20 bg-white border-b border-[#E2E8F0] px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Mobile Hamburger */}
          <button 
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shrink-0"
            aria-label="Mở menu">
            <Menu size={18} />
          </button>

          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-1.5 text-xs text-[#64748B] min-w-0">
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
            {searchQuery.trim() ? (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-400 hover:text-slate-700">
                <X size={12} />
              </button>
            ) : (
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-mono bg-white border border-slate-200 text-slate-500 px-1 py-0.5 rounded shadow-2xs">
                Ctrl K
              </kbd>
            )}

            {/* Instant Search Results Dropdown */}
            {searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto p-1.5 space-y-1 animate-in fade-in zoom-in-95 duration-150">
                {(() => {
                  const q = searchQuery.toLowerCase().trim();
                  const matches = ideas.filter((i: Idea) => 
                    i.title.toLowerCase().includes(q) || (i.description || "").toLowerCase().includes(q)
                  ).slice(0, 8);

                  if (matches.length === 0) {
                    return <div className="py-4 text-center text-xs text-slate-400 italic">Không tìm thấy ý tưởng phù hợp</div>;
                  }

                  return matches.map((idea: Idea) => {
                    const pc = pcById[idea.platformChannelId];
                    const ch = pc ? channelGroupById[pc.channelGroupId] : null;
                    const pl = pc ? platformById[pc.platformId] : null;
                    const statusStyle = STATUS_COLORS[idea.status] || STATUS_COLORS.PITCH;

                    return (
                      <div
                        key={idea.id}
                        onClick={() => {
                          setOpenIdea(idea);
                          setSearchQuery("");
                        }}
                        className="p-2 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-colors cursor-pointer flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-slate-500">
                            {ch && <span className="w-1.5 h-1.5 rounded-full" style={{ background: ch.color }} />}
                            <span className="font-semibold">{ch?.name || "Kênh"}</span>
                            <span>· {pl?.name}</span>
                          </div>
                          <div className="text-xs font-semibold text-slate-900 truncate">{idea.title}</div>
                        </div>
                        <span 
                          className="px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0"
                          style={{ background: statusStyle.bg, color: statusStyle.fg, border: `1px solid ${statusStyle.bd}` }}>
                          {STATUS_LABEL[idea.status]}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
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

            {actor.role === "Core" && (
              <Btn tone="default" onClick={() => setShowNewPitchingBatchModal(true)} small className="font-semibold !text-amber-800 !bg-amber-50 !border-amber-200 hover:!bg-amber-100 shadow-xs">
                <Flame size={13} className="text-amber-500" /> + Đợt Call Pitching
              </Btn>
            )}
            <Btn tone="primary" onClick={() => setShowNewIdea(true)} small className="font-bold shadow-xs">
              <Plus size={13} /> Ý tưởng mới
            </Btn>
          </div>

        </header>

        {/* -------------------------------------------------------------
           MAIN STAGE VIEWPORT (#F8FAFC)
        ------------------------------------------------------------- */}
        <main className="flex-1 p-3 sm:p-5 max-w-7xl w-full mx-auto">
          {tab === "dashboard" && (
            <DashboardView 
              ideas={ideas}
              pitchingBatches={pitchingBatches}
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
              showToast={showToast}
            />
          )}

          {tab === "board" && (
            <BoardView 
              ideas={ideas}
              pitchingBatches={pitchingBatches}
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
              showToast={showToast}
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
              onEditChannel={setEditChannelTarget}
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
            const logline = (form.elements.namedItem("logline") as HTMLInputElement)?.value || "";
            const referenceLinks = (form.elements.namedItem("referenceLinks") as HTMLInputElement)?.value || "";
            const angle = (form.elements.namedItem("angle") as HTMLInputElement)?.value || "";
            const keyMessage = (form.elements.namedItem("keyMessage") as HTMLInputElement)?.value || "";
            const contentPillar = (form.elements.namedItem("contentPillar") as HTMLSelectElement)?.value || "";
            const platformChannelId = (form.elements.namedItem("platformChannel") as HTMLSelectElement).value;

            if (!description.trim()) {
              alert("Mô tả ý tưởng là bắt buộc.");
              return;
            }

            runAction(submitIdeaAction, title, description, platformChannelId, logline, referenceLinks, angle, keyMessage, contentPillar);
            setShowNewIdea(false);
            showToast(`Đã nộp ý tưởng "${title}"`);
          }}>
            <div className="space-y-3">
              {(() => {
                const openBatch = pitchingBatches?.find((b: PitchingBatch) => b.status === "OPEN");
                if (!openBatch) return null;
                return (
                  <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 text-xs space-y-1.5 mb-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-amber-900 flex items-center gap-1 uppercase tracking-wider text-[11px]">
                        <Flame size={13} className="text-amber-500" /> Đợt Pitching Đang Mở: {openBatch.title}
                      </span>
                      {openBatch.category && (
                        <span className="bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded text-[10px] font-bold shrink-0">
                          🎯 {openBatch.category}
                        </span>
                      )}
                    </div>
                    {openBatch.description && (
                      <p className="text-slate-700"><span className="font-semibold text-slate-900">Yêu cầu:</span> {openBatch.description}</p>
                    )}
                    {openBatch.exampleAngles && (
                      <div className="text-slate-700 bg-amber-100/60 p-2 rounded-lg border border-amber-200/60 text-[11px]">
                        <span className="font-semibold text-amber-900 block mb-0.5">💡 Gợi ý đào sâu & Ví dụ từ Studio:</span>
                        <span className="italic">{openBatch.exampleAngles}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <FieldLabel required>Tên ý tưởng ngắn gọn</FieldLabel>
                <TextInput id="title" autoFocus required placeholder="VD: Phân tích tâm lý nhân vật Joker..." />
              </div>

              <div>
                <FieldLabel>Logline (tóm tắt nội dung pitch)</FieldLabel>
                <TextInput id="logline" placeholder="Tóm tắt ngắn gọn 1–2 câu về nội dung pitch..." />
              </div>

              <div>
                <FieldLabel required>Mô tả chi tiết nội dung (Content)</FieldLabel>
                <TextArea id="description" required rows={3} placeholder="Chi tiết kịch bản dự kiến, các ý chính cần khai thác..." />
              </div>

              <div>
                <FieldLabel>Link tham khảo (Reference)</FieldLabel>
                <TextInput id="referenceLinks" placeholder="Link video mẫu, bài viết, nhạc nền..." />
              </div>

              <div>
                <FieldLabel>Hướng triển khai (Angle)</FieldLabel>
                <TextInput id="angle" placeholder="Góc nhìn, hướng tiếp cận, phong cách kể chuyện..." />
              </div>

              <div>
                <FieldLabel>Key message</FieldLabel>
                <TextInput id="keyMessage" placeholder="Thông điệp chính muốn truyền tải..." />
              </div>

              <div>
                <FieldLabel>Tuyến bài nội dung (Content Pillar)</FieldLabel>
                <Select id="contentPillar">
                  <option value="">-- Chọn tuyến bài nội dung --</option>
                  {CONTENT_PILLARS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </Select>
              </div>

              <div>
                <FieldLabel required>Kênh & Nền tảng</FieldLabel>
                <Select 
                  id="platformChannel" 
                  required
                  value={selectedPcId || platformChannels[0]?.id}
                  onChange={(e: any) => setSelectedPcId(e.target.value)}
                >
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

                {(() => {
                  const activePcId = selectedPcId || platformChannels[0]?.id;
                  const currentPc = pcById[activePcId];
                  const currentCh = currentPc ? channelGroupById[currentPc.channelGroupId] : null;
                  if (!currentCh) return null;
                  if (!currentCh.description && !currentCh.videoFormat && !currentCh.referenceVideoLink) return null;
                  return (
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5 mt-2.5">
                      <div className="flex items-center gap-1.5 text-slate-800 font-semibold text-[11px] uppercase tracking-wider">
                        <Sparkles size={13} className="text-amber-500 shrink-0" />
                        <span>Định hướng & Reference Kênh: {currentCh.name}</span>
                      </div>
                      {currentCh.description && (
                        <p className="text-slate-700 leading-relaxed"><span className="font-semibold text-slate-900">Mô tả định hướng:</span> {currentCh.description}</p>
                      )}
                      {currentCh.videoFormat && (
                        <p className="text-slate-700"><span className="font-semibold text-slate-900">Dạng video làm:</span> {currentCh.videoFormat}</p>
                      )}
                      {currentCh.referenceVideoLink && (
                        <p className="text-slate-700 break-words">
                          <span className="font-semibold text-slate-900">Video mẫu tham khảo:</span>{" "}
                          <a href={currentCh.referenceVideoLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline inline-flex items-center gap-1">
                            {currentCh.referenceVideoLink} <ExternalLink size={11} />
                          </a>
                        </p>
                      )}
                    </div>
                  );
                })()}
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
            const discordIdeaWebhook = (form.elements.namedItem("discordIdeaWebhook") as HTMLInputElement)?.value || "";
            const externalCalendar = (form.elements.namedItem("externalCalendar") as HTMLInputElement).value;
            
            runAction(updateSettingsAction, discordWebhook, externalCalendar, discordIdeaWebhook);
            setShowSettingsModal(false);
            showToast("Đã lưu cài đặt");
          }}>
            <div className="space-y-3.5">
              <div>
                <FieldLabel>Discord Webhook Tổng (Giao việc, QA, Báo cáo tuần)</FieldLabel>
                <TextInput id="discordWebhook" defaultValue={settings.discordWebhookUrl} placeholder="VD: Webhook kênh #📋-task-giao-việc-tổng..." />
                <p className="text-[11px] text-[#64748B] mt-1">Dùng cho thông báo duyệt giao việc, nộp video, QA và báo cáo tổng hợp.</p>
              </div>

              <div>
                <FieldLabel>Discord Webhook Ý Tưởng Mặc Định (Kênh #💡-ý-tưởng)</FieldLabel>
                <TextInput id="discordIdeaWebhook" defaultValue={settings.discordIdeaWebhookUrl || ""} placeholder="VD: Webhook kênh #💡-ý-tưởng..." />
                <p className="text-[11px] text-[#64748B] mt-1">Dùng để thông báo nộp idea mới và đợt Call Pitching (nếu kênh không có chủ đề riêng).</p>
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

      {/* ADD CHANNEL MODAL */}
      {showNewChannel && (
        <Modal title="Thêm Kênh mới (Channel Group)" onClose={() => setShowNewChannel(false)}>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const form = e.currentTarget;
            const name = (form.elements.namedItem("channelName") as HTMLInputElement).value;
            const color = (form.elements.namedItem("channelColor") as HTMLInputElement).value;
            const description = (form.elements.namedItem("channelDescription") as HTMLTextAreaElement)?.value || "";
            const referenceVideoLink = (form.elements.namedItem("referenceVideoLink") as HTMLInputElement)?.value || "";
            const videoFormat = (form.elements.namedItem("videoFormat") as HTMLInputElement)?.value || "";
            const discordWebhookUrl = (form.elements.namedItem("channelDiscordWebhook") as HTMLInputElement)?.value || "";
            const selectedPlatformIds = Array.from(
              (form.elements.namedItem("platformIds") as HTMLSelectElement).selectedOptions
            ).map(o => o.value);
            
            runAction(createChannelGroupAction, name, color, selectedPlatformIds, description, referenceVideoLink, videoFormat, discordWebhookUrl);
            setShowNewChannel(false);
            showToast(`Đã tạo kênh "${name}"`);
          }}>
            <div className="space-y-3">
              <div>
                <FieldLabel required>Tên Kênh</FieldLabel>
                <TextInput id="channelName" autoFocus required placeholder="VD: YNDA Phim Ngắn, YNDA Tâm Lý..." />
              </div>

              <div>
                <FieldLabel>Màu đại diện</FieldLabel>
                <div className="flex items-center gap-2">
                  <input type="color" name="channelColor" defaultValue={CHANNEL_PALETTE[channelGroups.length % CHANNEL_PALETTE.length]} className="w-8 h-8 rounded border border-slate-200 cursor-pointer" />
                  <span className="text-[11px] text-slate-500">Chọn màu để phân biệt kênh trên bảng Gantt và Pipeline.</span>
                </div>
              </div>

              <div>
                <FieldLabel>Mô tả định hướng nội dung của Kênh</FieldLabel>
                <TextArea id="channelDescription" rows={3} placeholder="VD: Kênh phân tích tâm lý xã hội, văn học & phản biện hành vi nhân vật trong phim ảnh..." />
              </div>

              <div>
                <FieldLabel>Dạng video sẽ làm</FieldLabel>
                <TextInput id="videoFormat" placeholder="VD: Host nói + Voiceover phân tích phim, Review tác phẩm văn học, Phim ngắn..." />
              </div>

              <div>
                <FieldLabel>Link video mẫu tham khảo (Reference Video)</FieldLabel>
                <TextInput id="referenceVideoLink" placeholder="Link YouTube/TikTok mẫu để team tham khảo định hướng..." />
              </div>

              <div>
                <FieldLabel>Link Chủ đề Discord (Thread) hoặc Webhook riêng cho Kênh</FieldLabel>
                <TextInput id="channelDiscordWebhook" placeholder="VD: Link chủ đề Discord https://discord.com/channels/... hoặc ID Thread" />
                <p className="text-[11px] text-slate-500 mt-1">Chuột phải vào Chủ đề trên Discord -> <b>Sao chép liên kết</b> rồi dán vào đây để bot tự gửi tin vào đúng chủ đề kênh này.</p>
              </div>

              <div>
                <FieldLabel>Nền tảng phát hành (giữ Ctrl để chọn nhiều)</FieldLabel>
                <select name="platformIds" multiple className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs bg-white text-slate-700 focus:outline-none focus:border-slate-900 min-h-[80px]">
                  {platforms.map((p: Platform) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.defaultDurationDays} ngày)</option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 mt-1">Nếu không chọn, hệ thống sẽ tự gán các nền tảng mặc định.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <Btn onClick={() => setShowNewChannel(false)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Tạo Kênh</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* EDIT CHANNEL MODAL */}
      {editChannelTarget && (
        <Modal title={`Chỉnh sửa Kênh: ${editChannelTarget.name}`} onClose={() => setEditChannelTarget(null)}>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const form = e.currentTarget;
            const name = (form.elements.namedItem("editChannelName") as HTMLInputElement).value;
            const color = (form.elements.namedItem("editChannelColor") as HTMLInputElement).value;
            const description = (form.elements.namedItem("editChannelDescription") as HTMLTextAreaElement)?.value || "";
            const referenceVideoLink = (form.elements.namedItem("editReferenceVideoLink") as HTMLInputElement)?.value || "";
            const videoFormat = (form.elements.namedItem("editVideoFormat") as HTMLInputElement)?.value || "";
            const discordWebhookUrl = (form.elements.namedItem("editChannelDiscordWebhook") as HTMLInputElement)?.value || "";
            
            runAction(updateChannelGroupAction, editChannelTarget.id, name, color, description, referenceVideoLink, videoFormat, discordWebhookUrl);
            setEditChannelTarget(null);
            showToast(`Đã cập nhật kênh "${name}"`);
          }}>
            <div className="space-y-3">
              <div>
                <FieldLabel required>Tên Kênh</FieldLabel>
                <TextInput id="editChannelName" autoFocus required defaultValue={editChannelTarget.name} />
              </div>

              <div>
                <FieldLabel>Màu đại diện</FieldLabel>
                <div className="flex items-center gap-2">
                  <input type="color" name="editChannelColor" defaultValue={editChannelTarget.color || "#5B9EE8"} className="w-8 h-8 rounded border border-slate-200 cursor-pointer" />
                  <span className="text-[11px] text-slate-500">Chọn màu đại diện trên tiến độ sản xuất.</span>
                </div>
              </div>

              <div>
                <FieldLabel>Mô tả định hướng nội dung của Kênh</FieldLabel>
                <TextArea id="editChannelDescription" rows={3} defaultValue={editChannelTarget.description || ""} placeholder="Mô tả phong cách, đối tượng khán giả, chủ đề chính..." />
              </div>

              <div>
                <FieldLabel>Dạng video sẽ làm</FieldLabel>
                <TextInput id="editVideoFormat" defaultValue={editChannelTarget.videoFormat || ""} placeholder="VD: Cắt ghép, Host nói, Animation..." />
              </div>

              <div>
                <FieldLabel>Link video mẫu tham khảo (Reference Video)</FieldLabel>
                <TextInput id="editReferenceVideoLink" defaultValue={editChannelTarget.referenceVideoLink || ""} placeholder="Link YouTube / TikTok video mẫu..." />
              </div>

              <div>
                <FieldLabel>Link Chủ đề Discord (Thread) hoặc Webhook riêng cho Kênh</FieldLabel>
                <TextInput id="editChannelDiscordWebhook" defaultValue={editChannelTarget.discordWebhookUrl || ""} placeholder="VD: Link chủ đề Discord https://discord.com/channels/... hoặc ID Thread" />
                <p className="text-[11px] text-slate-500 mt-1">Chuột phải vào Chủ đề trên Discord -> <b>Sao chép liên kết</b> rồi dán vào đây để bot tự gửi tin vào đúng chủ đề kênh này.</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <Btn onClick={() => setEditChannelTarget(null)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Lưu thay đổi</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* PLATFORM MANAGER MODAL */}
      {showNewPlatform && (
        <Modal title="Quản lý Nền tảng phát hành" onClose={() => setShowNewPlatform(false)}>
          <div className="space-y-4">
            {/* EXISTING PLATFORMS LIST */}
            <div>
              <FieldLabel>Danh sách Nền tảng hiện có ({platforms.length})</FieldLabel>
              <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                {platforms.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Chưa có nền tảng nào.</p>
                ) : (
                  platforms.map((p: Platform) => (
                    <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                      <div>
                        <span className="font-semibold text-slate-800">{p.name}</span>
                        <span className="text-slate-500 ml-2">({p.defaultDurationDays} ngày làm)</span>
                      </div>
                      {actor.role === "Core" && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Bạn có chắc muốn xoá nền tảng "${p.name}"?`)) {
                              runAction(deletePlatformAction, p.id);
                              showToast(`Đã xoá nền tảng "${p.name}"`);
                            }
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                          title="Xoá nền tảng"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ADD NEW PLATFORM FORM */}
            <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
              e.preventDefault();
              const form = e.currentTarget;
              const name = (form.elements.namedItem("platName") as HTMLInputElement).value;
              const days = parseInt((form.elements.namedItem("platDays") as HTMLInputElement).value, 10);
              
              runAction(createPlatformAction, name, days);
              (form.elements.namedItem("platName") as HTMLInputElement).value = "";
              showToast(`Đã thêm nền tảng "${name}"`);
            }} className="pt-3 border-t border-slate-200 space-y-3">
              <span className="font-bold text-xs text-slate-900 uppercase tracking-wider block">Thêm Nền tảng mới</span>
              <div>
                <FieldLabel required>Tên Nền tảng</FieldLabel>
                <TextInput id="platName" required placeholder="VD: TikTok, YouTube, Facebook Reels..." />
              </div>

              <div>
                <FieldLabel required>Thời gian sản xuất mặc định (ngày)</FieldLabel>
                <TextInput id="platDays" type="number" min={1} max={30} defaultValue={2} required />
                <p className="text-[11px] text-slate-500 mt-1">Số ngày mặc định để Producer hoàn thành video trên nền tảng này.</p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Btn onClick={() => setShowNewPlatform(false)}>Đóng</Btn>
                <Btn tone="primary" type="submit" loading={isPending}>+ Thêm Nền tảng</Btn>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {/* NEW PITCHING BATCH MODAL */}
      {showNewPitchingBatchModal && (
        <Modal title="📢 Phát động Đợt Call Pitching Mới" onClose={() => setShowNewPitchingBatchModal(false)}>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const form = e.currentTarget;
            const title = (form.elements.namedItem("batchTitle") as HTMLInputElement).value;
            const category = (form.elements.namedItem("batchCategory") as HTMLSelectElement)?.value || "Branding / Nhân vật";
            const description = (form.elements.namedItem("batchDescription") as HTMLTextAreaElement)?.value || "";
            const exampleAngles = (form.elements.namedItem("batchExampleAngles") as HTMLTextAreaElement)?.value || "";
            const deadline = (form.elements.namedItem("batchDeadline") as HTMLInputElement).value;
            const channelGroupId = (form.elements.namedItem("batchChannelGroup") as HTMLSelectElement)?.value || "";
            
            runAction(createPitchingBatchAction, title, category, description, exampleAngles, deadline, channelGroupId);
            setShowNewPitchingBatchModal(false);
            showToast(`Đã phát động đợt Call Pitching "${title}" & gửi thông báo lên nhóm!`);
          }}>
            <div className="space-y-3">
              <div>
                <FieldLabel required>Tuyến bài & Giai đoạn định hướng đợt này</FieldLabel>
                <Select id="batchCategory" required>
                  <option value="5. Personal Branding (Chuyên môn & Nhân vật)">5. Personal Branding — Chuyên môn -> Xây dựng nhân vật (tính cách, phân tích hành vi)</option>
                  <option value="1. Branding (Làm sáng thương hiệu)">1. Branding — Làm sáng thương hiệu (Khẳng định giá trị core của Ý niệm điện ảnh)</option>
                  <option value="3. News (Tin tức ngành & Hot trend)">3. News — Cập nhật tin tức ngành, luật pháp, nội dung hot (Đào phim phân tích)</option>
                  <option value="4. PR (Niềm tin & Kiến thức ngành)">4. PR — Niềm tin người xem với ngành (Cung cấp thông tin điện ảnh)</option>
                  <option value="2. Trải nghiệm (Feedback & Tương tác)">2. Trải nghiệm — Feedback, tương tác & phản hồi ý kiến người xem</option>
                  <option value="6. Content cho đối tác">6. Content cho đối tác (Nội dung hợp tác & tài trợ)</option>
                  <option value="Tổng hợp / Nhiều tuyến bài">Tổng hợp / Nhiều tuyến bài</option>
                </Select>
              </div>

              <div>
                <FieldLabel required>Tiêu đề đợt Call Pitching</FieldLabel>
                <TextInput id="batchTitle" autoFocus required placeholder="VD: Săn Idea Tuần 35 — Chuỗi phân tích hành vi nhân vật" />
              </div>

              <div>
                <FieldLabel required>Hạn chót nộp ý tưởng (Deadline)</FieldLabel>
                <TextInput id="batchDeadline" required placeholder="VD: 23:59 ngày 31/08/2026" />
              </div>

              <div>
                <FieldLabel>Yêu cầu & Định hướng chi tiết đợt này</FieldLabel>
                <TextArea id="batchDescription" rows={2} placeholder="VD: Kênh đang trong giai đoạn xây dựng nhân vật, cần tập trung các bài phân tích tính cách..." />
              </div>

              <div>
                <FieldLabel>Gợi ý & Ví dụ cách đào sâu (Example Angles)</FieldLabel>
                <TextArea id="batchExampleAngles" rows={3} placeholder="VD: Tìm 1 bộ phim/tin tức hot -> Đào sâu phân tích hành vi nhân vật под góc nhìn chuyên gia; Chuyên môn -> Xây dựng tính cách nhân vật..." />
              </div>

              <div>
                <FieldLabel>Kênh áp dụng (Tuỳ chọn)</FieldLabel>
                <Select id="batchChannelGroup">
                  <option value="">-- Tất cả các Kênh trong Studio --</option>
                  {channelGroups.map(cg => (
                    <option key={cg.id} value={cg.id}>{cg.name}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <Btn onClick={() => setShowNewPitchingBatchModal(false)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>📢 Phát động & Gửi thông báo nhóm</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* ADD MEMBER MODAL */}
      {showNewMember && (
        <Modal title="Thêm thành viên mới vào Studio" onClose={() => setShowNewMember(false)}>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const form = e.currentTarget;
            const name = (form.elements.namedItem("memberName") as HTMLInputElement).value;
            const email = (form.elements.namedItem("memberEmail") as HTMLInputElement).value;
            const role = (form.elements.namedItem("memberRole") as HTMLSelectElement).value;
            const password = (form.elements.namedItem("memberPassword") as HTMLInputElement).value;
            const phone = (form.elements.namedItem("memberPhone") as HTMLInputElement).value;
            const facebook = (form.elements.namedItem("memberFacebook") as HTMLInputElement).value;
            const primaryExpertise = (form.elements.namedItem("memberPrimaryExpertise") as HTMLInputElement).value;
            const secondaryExpertise = (form.elements.namedItem("memberSecondaryExpertise") as HTMLInputElement).value;
            
            runAction(createMemberAction, name, role, email, password || undefined, phone, facebook, primaryExpertise, secondaryExpertise);
            setShowNewMember(false);
            showToast(`Đã thêm thành viên "${name}"`);
          }}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel required>Họ tên</FieldLabel>
                  <TextInput id="memberName" autoFocus required placeholder="Nguyễn Văn A" />
                </div>
                <div>
                  <FieldLabel required>Email đăng nhập</FieldLabel>
                  <TextInput id="memberEmail" type="email" required placeholder="name@example.com" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel required>Vai trò</FieldLabel>
                  <Select id="memberRole" required>
                    <option value="P">Producer / Ban Dự án (P)</option>
                    <option value="E">Editor / Ban Đào tạo (E)</option>
                    <option value="Core">Core Team / Ban Điều hành</option>
                  </Select>
                </div>
                <div>
                  <FieldLabel>Mật khẩu ban đầu</FieldLabel>
                  <TextInput id="memberPassword" placeholder="Nhập mật khẩu (mặc định: 123456)" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Số điện thoại</FieldLabel>
                  <TextInput id="memberPhone" placeholder="0909..." />
                </div>
                <div>
                  <FieldLabel>Facebook</FieldLabel>
                  <TextInput id="memberFacebook" placeholder="https://facebook.com/..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Chuyên môn chính</FieldLabel>
                  <TextInput id="memberPrimaryExpertise" placeholder="Quay, Dựng, Kịch bản..." />
                </div>
                <div>
                  <FieldLabel>Chuyên môn phụ</FieldLabel>
                  <TextInput id="memberSecondaryExpertise" placeholder="Đồ hoạ, MC..." />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <Btn onClick={() => setShowNewMember(false)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Thêm thành viên</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* CONFIRM DELETE CHANNEL MODAL */}
      {confirmDeleteChannel && (
        <Modal title={`Xoá / Lưu trữ kênh: ${confirmDeleteChannel.name}`} onClose={() => setConfirmDeleteChannel(null)}>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-rose-50 text-rose-800 text-xs border border-rose-200">
              ⚠️ Nếu kênh còn ý tưởng gắn liền, kênh sẽ được chuyển sang trạng thái <strong>Lưu trữ</strong> thay vì xoá hoàn toàn. Bạn có thể khôi phục lại sau.
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
            <Btn onClick={() => setConfirmDeleteChannel(null)}>Huỷ</Btn>
            <Btn tone="danger" loading={isPending} onClick={() => {
              runAction(archiveChannelGroupAction, confirmDeleteChannel.id);
              setConfirmDeleteChannel(null);
              showToast("Đã xoá / lưu trữ kênh");
            }}>Xác nhận xoá</Btn>
          </div>
        </Modal>
      )}

      {/* VIEW PROFILE MODAL */}
      {showProfile && (
        <Modal title={`Hồ sơ: ${showProfile.name}`} onClose={() => setShowProfile(null)}>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
              <UserAvatar name={showProfile.name} size={40} />
              <div>
                <div className="font-bold text-sm text-slate-900">{showProfile.name}</div>
                <div className="text-xs text-slate-500">{showProfile.id}</div>
                <RoleChip role={showProfile.role} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-0.5">Điện thoại</span>
                <span className="font-semibold text-slate-900">{showProfile.phone || "—"}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-0.5">Facebook</span>
                {showProfile.facebook ? (
                  <a href={showProfile.facebook} target="_blank" rel="noreferrer" className="font-semibold text-indigo-600 hover:underline">Mở Facebook</a>
                ) : (
                  <span className="font-semibold text-slate-900">—</span>
                )}
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-0.5">Chuyên môn chính</span>
                <span className="font-semibold text-slate-900">{showProfile.primaryExpertise || "—"}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-500 block mb-0.5">Chuyên môn phụ</span>
                <span className="font-semibold text-slate-900">{showProfile.secondaryExpertise || "—"}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
            {(actor.role === "Core" || actor.id === showProfile.id) && (
              <Btn tone="primary" onClick={() => { setEditProfile(showProfile); setShowProfile(null); }}>Chỉnh sửa hồ sơ</Btn>
            )}
            <Btn onClick={() => setShowProfile(null)}>Đóng</Btn>
          </div>
        </Modal>
      )}

      {/* EDIT PROFILE MODAL */}
      {editProfile && (
        <Modal title={`Chỉnh sửa hồ sơ: ${editProfile.name}`} onClose={() => setEditProfile(null)}>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const form = e.currentTarget;
            const name = (form.elements.namedItem("editName") as HTMLInputElement).value;
            const phone = (form.elements.namedItem("editPhone") as HTMLInputElement).value;
            const facebook = (form.elements.namedItem("editFacebook") as HTMLInputElement).value;
            const primaryExpertise = (form.elements.namedItem("editPrimaryExpertise") as HTMLInputElement).value;
            const secondaryExpertise = (form.elements.namedItem("editSecondaryExpertise") as HTMLInputElement).value;
            const role = actor.role === "Core" ? (form.elements.namedItem("editRole") as HTMLSelectElement)?.value : undefined;
            const password = actor.role === "Core" ? (form.elements.namedItem("editPassword") as HTMLInputElement)?.value : undefined;

            runAction(updateMemberProfileAction, editProfile.id, name, phone, facebook, primaryExpertise, secondaryExpertise, role, password);
            setEditProfile(null);
            showToast("Đã cập nhật hồ sơ thành viên");
          }}>
            <div className="space-y-3">
              <div>
                <FieldLabel required>Họ tên</FieldLabel>
                <TextInput id="editName" required defaultValue={editProfile.name} autoFocus />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Điện thoại</FieldLabel>
                  <TextInput id="editPhone" defaultValue={editProfile.phone || ""} />
                </div>
                <div>
                  <FieldLabel>Facebook</FieldLabel>
                  <TextInput id="editFacebook" defaultValue={editProfile.facebook || ""} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel>Chuyên môn chính</FieldLabel>
                  <TextInput id="editPrimaryExpertise" defaultValue={editProfile.primaryExpertise || ""} />
                </div>
                <div>
                  <FieldLabel>Chuyên môn phụ</FieldLabel>
                  <TextInput id="editSecondaryExpertise" defaultValue={editProfile.secondaryExpertise || ""} />
                </div>
              </div>
              {actor.role === "Core" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Vai trò</FieldLabel>
                    <Select id="editRole" defaultValue={editProfile.role}>
                      <option value="P">Producer / Ban Dự án (P)</option>
                      <option value="E">Editor / Ban Đào tạo (E)</option>
                      <option value="Core">Core Team / Ban Điều hành</option>
                    </Select>
                  </div>
                  <div>
                    <FieldLabel>Đặt mật khẩu mới</FieldLabel>
                    <TextInput id="editPassword" placeholder="Để trống nếu không đổi" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <Btn onClick={() => setEditProfile(null)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Lưu thay đổi</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* EDIT IDEA DETAILS MODAL */}
      {editIdeaTarget && (
        <Modal title={`Sửa chi tiết ý tưởng: ${editIdeaTarget.title}`} onClose={() => setEditIdeaTarget(null)}>
          <form onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const form = e.currentTarget;
            const title = (form.elements.namedItem("editIdeaTitle") as HTMLInputElement).value;
            const description = (form.elements.namedItem("editIdeaDescription") as HTMLTextAreaElement).value;
            const platformChannelId = (form.elements.namedItem("editPlatformChannelId") as HTMLSelectElement).value;
            const tags = (form.elements.namedItem("editTags") as HTMLInputElement)?.value || "";
            const internalNote = actor.role === "Core" ? (form.elements.namedItem("editInternalNote") as HTMLTextAreaElement)?.value || "" : "";
            const logline = (form.elements.namedItem("editLogline") as HTMLInputElement)?.value || "";
            const referenceLinks = (form.elements.namedItem("editReferenceLinks") as HTMLInputElement)?.value || "";
            const angle = (form.elements.namedItem("editAngle") as HTMLInputElement)?.value || "";
            const keyMessage = (form.elements.namedItem("editKeyMessage") as HTMLInputElement)?.value || "";
            const contentPillar = (form.elements.namedItem("editContentPillar") as HTMLSelectElement)?.value || "";

            runAction(updateIdeaDetailsAction, editIdeaTarget.id, title, description, platformChannelId, tags, internalNote, logline, referenceLinks, angle, keyMessage, contentPillar);
            setEditIdeaTarget(null);
            showToast("Đã cập nhật chi tiết ý tưởng");
          }}>
            <div className="space-y-3">
              <div>
                <FieldLabel required>Tiêu đề ý tưởng</FieldLabel>
                <TextInput id="editIdeaTitle" required defaultValue={editIdeaTarget.title} autoFocus placeholder="VD: Phân tích tâm lý nhân vật Joker..." />
              </div>
              <div>
                <FieldLabel>Logline (tóm tắt nội dung pitch)</FieldLabel>
                <TextInput id="editLogline" defaultValue={editIdeaTarget.logline || ""} placeholder="Tóm tắt ngắn gọn 1–2 câu về nội dung pitch..." />
              </div>
              <div>
                <FieldLabel>Mô tả chi tiết</FieldLabel>
                <TextArea id="editIdeaDescription" rows={3} defaultValue={editIdeaTarget.description || ""} placeholder="Chi tiết kịch bản dự kiến, các ý chính cần khai thác..." />
              </div>
              <div>
                <FieldLabel>Link tham khảo (Reference)</FieldLabel>
                <TextInput id="editReferenceLinks" defaultValue={editIdeaTarget.referenceLinks || ""} placeholder="Link video mẫu, bài viết, nhạc nền..." />
              </div>
              <div>
                <FieldLabel>Hướng triển khai (Angle)</FieldLabel>
                <TextInput id="editAngle" defaultValue={editIdeaTarget.angle || ""} placeholder="Góc nhìn, hướng tiếp cận, phong cách kể chuyện..." />
              </div>
              <div>
                <FieldLabel>Key message</FieldLabel>
                <TextInput id="editKeyMessage" defaultValue={editIdeaTarget.keyMessage || ""} placeholder="Thông điệp chính muốn truyền tải..." />
              </div>
              <div>
                <FieldLabel>Tuyến bài nội dung (Content Pillar)</FieldLabel>
                <Select id="editContentPillar" defaultValue={editIdeaTarget.contentPillar || ""}>
                  <option value="">-- Chọn tuyến bài nội dung --</option>
                  {CONTENT_PILLARS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </Select>
              </div>
              <div>
                <FieldLabel>Kênh & Nền tảng</FieldLabel>
                <Select id="editPlatformChannelId" defaultValue={editIdeaTarget.platformChannelId}>
                  {platformChannels.map(pc => (
                    <option key={pc.id} value={pc.id}>
                      {channelGroupById[pc.channelGroupId]?.name} — {platformById[pc.platformId]?.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <FieldLabel>Tags (cách nhau bằng dấu phẩy)</FieldLabel>
                <TextInput id="editTags" defaultValue={editIdeaTarget.tags || ""} />
              </div>
              {actor.role === "Core" && (
                <div>
                  <FieldLabel>Ghi chú nội bộ (Chỉ Core)</FieldLabel>
                  <TextArea id="editInternalNote" rows={2} defaultValue={editIdeaTarget.internalNote || ""} />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <Btn onClick={() => setEditIdeaTarget(null)}>Huỷ</Btn>
              <Btn tone="primary" type="submit" loading={isPending}>Lưu thay đổi</Btn>
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
  pitchingBatches,
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
  runAction,
  showToast
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

  const activeBatch = pitchingBatches?.find((b: PitchingBatch) => b.status === "OPEN");

  return (
    <div className="space-y-4">
      
      {/* ACTIVE CALL PITCHING BANNER */}
      {activeBatch && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white saas-shadow flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-white/20 backdrop-blur-xs text-white font-bold text-[10px] uppercase px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1">
                <Flame size={12} className="text-amber-200 animate-pulse" /> Đợt Call Pitching Đang Mở
              </span>
              {activeBatch.category && (
                <span className="bg-amber-900/30 text-amber-100 font-bold text-[10px] uppercase px-2 py-0.5 rounded-md border border-amber-200/30">
                  🎯 {activeBatch.category}
                </span>
              )}
              <span className="text-xs font-semibold bg-black/20 px-2.5 py-0.5 rounded-md text-amber-100 flex items-center gap-1">
                <Clock size={12} /> Hạn chót: {activeBatch.deadline}
              </span>
            </div>
            <h3 className="font-bold text-base text-white leading-tight">
              {activeBatch.title}
            </h3>
            {activeBatch.description && (
              <p className="text-xs text-amber-50/95 leading-relaxed">
                <span className="font-semibold text-white">Yêu cầu:</span> {activeBatch.description}
              </p>
            )}
            {activeBatch.exampleAngles && (
              <div className="text-xs bg-black/20 p-2 rounded-lg border border-white/10 text-amber-100 leading-relaxed">
                <span className="font-semibold text-white block text-[11px] uppercase tracking-wider mb-0.5">💡 Gợi ý & Ví dụ cách đào sâu:</span>
                <span className="italic">{activeBatch.exampleAngles}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Btn small tone="default" className="!bg-white !text-amber-900 !border-white font-bold hover:!bg-amber-50 shadow-xs" onClick={onNewIdea}>
              <Plus size={13} /> Nộp Ý Tưởng Cho Đợt Này
            </Btn>
            {actor.role === "Core" && (
              <Btn small tone="danger" className="!bg-black/30 !text-white !border-white/20 hover:!bg-black/40" onClick={() => {
                if (confirm(`Bạn có chắc muốn đóng đợt Call Pitching "${activeBatch.title}"?`)) {
                  runAction(closePitchingBatchAction, activeBatch.id);
                  showToast?.("Đã đóng đợt Call Pitching");
                }
              }}>
                Đóng đợt
              </Btn>
            )}
          </div>
        </div>
      )}

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
                        {idea.logline ? (
                          <div className="text-[11px] text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60 truncate max-w-md mt-1 font-medium flex items-center gap-1.5">
                            <span className="font-bold text-[9px] uppercase tracking-wider text-amber-700 bg-amber-100 px-1 rounded shrink-0">Logline</span>
                            <span className="truncate">{idea.logline}</span>
                          </div>
                        ) : idea.description ? (
                          <div className="text-[11px] text-[#64748B] truncate max-w-md mt-0.5">
                            {idea.description}
                          </div>
                        ) : null}

                        {(idea.contentPillar || idea.angle || idea.keyMessage || idea.referenceLinks) && (
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                            {idea.contentPillar && (
                              <span className="text-[10px] text-purple-700 bg-purple-50 px-1.5 py-0.2 rounded border border-purple-200/60 font-semibold truncate max-w-[180px]">
                                🎯 {idea.contentPillar}
                              </span>
                            )}
                            {idea.angle && (
                              <span className="text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-100 font-medium truncate max-w-[180px]">
                                <span className="font-bold">Angle:</span> {idea.angle}
                              </span>
                            )}
                            {idea.keyMessage && (
                              <span className="text-[10px] text-slate-700 bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200 font-medium truncate max-w-[180px]">
                                <span className="font-bold">Key Msg:</span> {idea.keyMessage}
                              </span>
                            )}
                            {idea.referenceLinks && (
                              <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100 font-medium inline-flex items-center gap-0.5">
                                <LinkIcon size={9} /> Ref
                              </span>
                            )}
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

  const [internalNote, setInternalNote] = useState(idea.internalNote || "");
  useEffect(() => {
    setInternalNote(idea.internalNote || "");
  }, [idea.id, idea.internalNote]);

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    runAction(addCommentAction, idea.id, commentInput.trim());
    setCommentInput("");
    showToast("Đã gửi bình luận");
  };

  const handleSaveNote = () => {
    runAction(updateIdeaNoteAction, idea.id, internalNote);
    showToast("Đã lưu ghi chú nội bộ");
  };

  const handleRate = (star: number) => {
    runAction(rateIdeaAction, idea.id, star);
    showToast(`Đã đánh giá ${star} sao cho sản phẩm`);
  };

  const handleClone = () => {
    runAction(cloneIdeaAction, idea.id);
    showToast("Đã nhân bản ý tưởng mới");
  };

  const handleRestore = () => {
    runAction(restoreArchivedIdeaAction, idea.id);
    showToast("Đã khôi phục ý tưởng về trạng thái ban đầu");
  };

  const handleDeletePermanent = () => {
    if (window.confirm(`Bạn có chắc chắn muốn xoá vĩnh viễn ý tưởng "${idea.title}"? Hành động này không thể hoàn tác.`)) {
      runAction(deleteIdeaAction, idea.id);
      onClose();
      showToast("Đã xoá vĩnh viễn ý tưởng");
    }
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

          {/* CLONE IDEA BUTTON */}
          <Btn small tone="default" onClick={handleClone} title="Tạo bản sao từ ý tưởng này">
            <Copy size={12} /> Nhân bản
          </Btn>

          {/* EDIT IDEA */}
          <Btn small tone="default" onClick={onEditIdea} title="Chỉnh sửa tên & mô tả">
            Sửa
          </Btn>

          {actor.role === "Core" && idea.status !== "COMPLETE" && idea.status !== "ARCHIVED_IDEA" && idea.status !== "CANCELLED" && (
            <Btn small tone="default" onClick={onReassign}>
              Đổi người
            </Btn>
          )}

          {actor.role === "Core" && idea.status === "PRODUCTION" && (
            <Btn small tone="default" onClick={onExtendDeadline}>
              Gia hạn
            </Btn>
          )}

          {/* RESTORE IF ARCHIVED OR CANCELLED */}
          {(idea.status === "ARCHIVED_IDEA" || idea.status === "CANCELLED") && (
            <Btn small tone="success" onClick={handleRestore}>
              <RotateCcw size={12} /> Khôi phục
            </Btn>
          )}

          {/* PERMANENT DELETE (CORE ONLY FOR ARCHIVED/CANCELLED) */}
          {actor.role === "Core" && (idea.status === "ARCHIVED_IDEA" || idea.status === "CANCELLED") && (
            <Btn small tone="danger" onClick={handleDeletePermanent}>
              <Trash2 size={12} /> Xoá hẳn
            </Btn>
          )}

          <div className="flex-1" />

          {idea.status !== "COMPLETE" && idea.status !== "ARCHIVED_IDEA" && idea.status !== "CANCELLED" && (actor.role === "Core" || (idea.status === "PITCH" && idea.submittedByEmail === actor.id)) && (
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

          {/* STAR RATING FOR COMPLETED VIDEO */}
          {idea.status === "COMPLETE" && (
            <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Star size={13} className="text-amber-500 fill-amber-500" />
                  Đánh giá chất lượng sản phẩm
                </div>
                {idea.rating && (
                  <span className="text-xs font-bold text-amber-800">{idea.rating} / 5 ⭐</span>
                )}
              </div>

              {actor.role === "Core" ? (
                <div className="flex items-center gap-1 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleRate(star)}
                      className="p-1 hover:scale-110 transition-transform">
                      <Star
                        size={20}
                        className={
                          (Number(idea.rating) || 0) >= star
                            ? "text-amber-500 fill-amber-400"
                            : "text-slate-300 hover:text-amber-300"
                        }
                      />
                    </button>
                  ))}
                  <span className="text-[11px] text-amber-700 ml-2">Click để chấm điểm Core</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 pt-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      size={18}
                      className={
                        (Number(idea.rating) || 0) >= star
                          ? "text-amber-500 fill-amber-400"
                          : "text-slate-200"
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* PITCHING DETAILS */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 leading-relaxed space-y-3">
            {idea.contentPillar && (
              <div>
                <span className="font-bold text-slate-900 block mb-0.5 text-[11px] uppercase tracking-wider">
                  Tuyến bài nội dung (Content Pillar):
                </span>
                <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200 text-xs">
                  🎯 {idea.contentPillar}
                </span>
              </div>
            )}

            {idea.logline && (
              <div>
                <span className="font-bold text-slate-900 block mb-0.5 text-[11px] uppercase tracking-wider">
                  Logline (tóm tắt):
                </span>
                <p className="text-slate-700 whitespace-pre-line">{idea.logline}</p>
              </div>
            )}
            
            {idea.description && (
              <div>
                <span className="font-bold text-slate-900 block mb-0.5 text-[11px] uppercase tracking-wider">
                  Nội dung chi tiết (Content):
                </span>
                <p className="text-slate-700 whitespace-pre-line">{idea.description}</p>
              </div>
            )}

            {idea.referenceLinks && (
              <div>
                <span className="font-bold text-slate-900 block mb-0.5 text-[11px] uppercase tracking-wider">
                  Link tham khảo (Reference):
                </span>
                <p className="text-blue-600 hover:underline break-words"><a href={idea.referenceLinks} target="_blank" rel="noreferrer">{idea.referenceLinks}</a></p>
              </div>
            )}

            {idea.angle && (
              <div>
                <span className="font-bold text-slate-900 block mb-0.5 text-[11px] uppercase tracking-wider">
                  Hướng triển khai (Angle):
                </span>
                <p className="text-slate-700 whitespace-pre-line">{idea.angle}</p>
              </div>
            )}

            {idea.keyMessage && (
              <div>
                <span className="font-bold text-slate-900 block mb-0.5 text-[11px] uppercase tracking-wider">
                  Key message:
                </span>
                <p className="text-slate-700 whitespace-pre-line">{idea.keyMessage}</p>
              </div>
            )}
          </div>

          {/* INTERNAL NOTES (FOR STUDIO / CORE) */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Lock size={12} className="text-slate-500" />
                Ghi chú nội bộ Studio
              </div>
              {actor.role === "Core" && (
                <span className="text-[10px] text-slate-400 font-medium">Chỉ Core chỉnh sửa</span>
              )}
            </div>

            {actor.role === "Core" ? (
              <div className="space-y-2">
                <TextArea
                  rows={2}
                  value={internalNote}
                  onChange={(e: any) => setInternalNote(e.target.value)}
                  placeholder="Ghi chú riêng của Core (VD: Cần lưu ý bản quyền nhạc, clip này chạy tài trợ...)"
                  className="text-xs"
                />
                <div className="flex justify-end">
                  <Btn small onClick={handleSaveNote}>Lưu ghi chú</Btn>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-600 italic whitespace-pre-line">
                {idea.internalNote || "Chưa có ghi chú nội bộ."}
              </p>
            )}
          </div>

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

                      {idea.logline ? (
                        <p className="text-[10px] text-amber-900 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200/50 line-clamp-2 font-medium">
                          <span className="font-bold text-amber-700">Logline:</span> "{idea.logline}"
                        </p>
                      ) : idea.description ? (
                        <p className="text-[10px] text-slate-500 line-clamp-2">
                          {idea.description}
                        </p>
                      ) : null}

                      {(idea.angle || idea.referenceLinks) && (
                        <div className="flex items-center gap-1">
                          {idea.angle && (
                            <span className="text-[9px] text-indigo-700 bg-indigo-50 px-1 py-0.2 rounded font-medium truncate max-w-[110px]">
                              Angle: {idea.angle}
                            </span>
                          )}
                          {idea.referenceLinks && (
                            <span className="text-[9px] text-blue-700 bg-blue-50 px-1 py-0.2 rounded font-medium inline-flex items-center gap-0.5">
                              <LinkIcon size={8} /> Ref
                            </span>
                          )}
                        </div>
                      )}

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
  onEditChannel,
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
            {currentChannel && (
              <>
                <Btn small tone="default" onClick={() => onEditChannel(currentChannel)}>
                  <PenLine size={12} /> Chỉnh sửa kênh
                </Btn>
                <Btn small tone="danger" onClick={() => onDeleteChannel(currentChannel)}>
                  <Trash2 size={12} /> Xoá kênh
                </Btn>
              </>
            )}
          </div>
        )}
      </div>

      {/* GANTT TIMELINE TABLE */}
      <div className="rounded-xl border border-[#E2E8F0] bg-white saas-shadow overflow-hidden">
        <div className="p-4 border-b border-[#E2E8F0] bg-slate-50 flex items-start justify-between">
          <div>
            <h3 className="font-bold text-xs text-slate-900 uppercase">
              Tiến độ sản xuất Kênh: {currentChannel?.name}
            </h3>
            {currentChannel?.description && (
              <p className="text-[11px] text-slate-600 mt-1">
                <span className="font-semibold text-slate-800">Mô tả định hướng:</span> {currentChannel.description}
              </p>
            )}
            {currentChannel?.videoFormat && (
              <p className="text-[11px] text-slate-600 mt-0.5">
                <span className="font-semibold text-slate-800">Dạng video làm:</span> {currentChannel.videoFormat}
              </p>
            )}
            {currentChannel?.referenceVideoLink && (
              <p className="text-[11px] text-slate-600 mt-0.5">
                <span className="font-semibold text-slate-800">Video mẫu tham khảo:</span>{" "}
                <a href={currentChannel.referenceVideoLink} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                  {currentChannel.referenceVideoLink}
                </a>
              </p>
            )}
          </div>
          <span className="text-xs text-slate-500 font-mono mt-1">Tháng {today.getMonth() + 1}/{today.getFullYear()}</span>
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

      {/* TRASHED / ARCHIVED CHANNELS SECTION */}
      {trashedChannelGroups && trashedChannelGroups.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white saas-shadow p-4">
          <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <FolderOpen size={14} className="text-slate-400" />
            Kênh đã lưu trữ ({trashedChannelGroups.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {trashedChannelGroups.map((c: any) => (
              <div key={c.id} className="p-2.5 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
                  <span className="text-xs font-semibold text-slate-700 truncate">{c.name}</span>
                </div>
                {actor.role === "Core" && (
                  <Btn small tone="success" onClick={() => onRestoreChannel(c)}>
                    <RotateCcw size={11} /> Khôi phục
                  </Btn>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
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
  const scheduledIdeas = ideas.filter((i: Idea) => 
    i.status !== "CANCELLED" && 
    i.status !== "ARCHIVED_IDEA" && 
    (Boolean(i.scheduledPostDate) || i.status === "COMPLETE")
  );

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
  const [showImportPanel, setShowImportPanel] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [importError, setImportError] = useState("");
  const [importResult, setImportResult] = useState<{imported:number;skipped:number;errors:string[]}|null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // EXPORT CSV
  const handleExportCSV = () => {
    const header = "Họ tên,Email,Vai trò,Mật khẩu,SĐT,Facebook,Chuyên môn chính,Chuyên môn phụ";
    const csvRows = members.map((m: Member) =>
      [m.name, m.id, m.role, "", m.phone || "", m.facebook || "", m.primaryExpertise || "", m.secondaryExpertise || ""].map(v => `"${(v || '').replace(/"/g, '""')}"`).join(",")
    );
    const csv = "\uFEFF" + header + "\n" + csvRows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ynda_members_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // DOWNLOAD TEMPLATE
  const handleDownloadTemplate = () => {
    const header = "Họ tên,Email,Vai trò,Mật khẩu,SĐT,Facebook,Chuyên môn chính,Chuyên môn phụ";
    const example1 = '"Nguyễn Văn A","nguyenvana@example.com","P","123456","0909000111","","Quay phim","Dựng phim"';
    const example2 = '"Trần Thị B","tranthib@example.com","Editor","123456","","","Biên tập",""';
    const example3 = '"Lê Văn C","levanc@example.com","Core","123456","0909000333","https://facebook.com/levanc","Quản lý","Kịch bản"';
    const csv = "\uFEFF" + [header, example1, example2, example3].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mau_import_thanh_vien.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  // PARSE CSV FILE
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError("");
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split(/\r?\n/).filter(l => l.trim());
        if (lines.length < 2) {
          setImportError("File phải có ít nhất 1 dòng header và 1 dòng dữ liệu.");
          return;
        }

        // Parse CSV (handle quoted fields)
        const parseLine = (line: string): string[] => {
          const result: string[] = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (inQuotes) {
              if (ch === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') { current += '"'; i++; }
                else { inQuotes = false; }
              } else { current += ch; }
            } else {
              if (ch === '"') { inQuotes = true; }
              else if (ch === ',') { result.push(current.trim()); current = ''; }
              else { current += ch; }
            }
          }
          result.push(current.trim());
          return result;
        };

        // Skip header row
        const dataRows = lines.slice(1).map(parseLine);
        const parsed = dataRows.map(cols => ({
          name: cols[0] || '',
          email: cols[1] || '',
          role: normalizeRole(cols[2] || 'P'),
          password: cols[3] || '123456',
          phone: cols[4] || '',
          facebook: cols[5] || '',
          primaryExpertise: cols[6] || '',
          secondaryExpertise: cols[7] || ''
        })).filter(r => r.name && r.email);

        if (parsed.length === 0) {
          setImportError("Không tìm thấy dữ liệu hợp lệ trong file. Đảm bảo cột Họ tên và Email không trống.");
          return;
        }

        setImportData(parsed);
        setShowImportPanel(true);
      } catch (err: any) {
        setImportError("Lỗi đọc file: " + (err.message || "Không xác định"));
      }
    };
    reader.readAsText(file, 'UTF-8');
    // Reset file input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // SUBMIT IMPORT
  const handleImportSubmit = async () => {
    try {
      const res = await bulkImportMembersAction(importData);
      setImportResult(res);
      setImportData([]);
      // Trigger refresh
      runAction(async () => {});
    } catch (err: any) {
      setImportError(err.message || "Lỗi import");
    }
  };

  return (
    <div className="space-y-5">
      {/* TEAM DIRECTORY */}
      <div className="rounded-xl border border-slate-200 bg-white saas-shadow p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 pb-2 border-b border-slate-100 gap-2">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Đội Ngũ Nhân Sự Studio ({members.length})</h3>
            <p className="text-xs text-slate-500">Danh sách các thành viên Core, Editor và Producer trong hệ thống.</p>
          </div>
          {actor.role === "Core" && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Btn small tone="primary" onClick={onAddMember}><Plus size={12} /> Thêm</Btn>
              <Btn small onClick={() => fileInputRef.current?.click()}><Upload size={12} /> Import CSV</Btn>
              <Btn small onClick={handleExportCSV}><Download size={12} /> Xuất CSV</Btn>
              <Btn small onClick={handleDownloadTemplate}><Download size={12} /> Tải mẫu</Btn>
              <input ref={fileInputRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleFileUpload} />
            </div>
          )}
        </div>

        {/* IMPORT ERROR */}
        {importError && (
          <div className="mb-3 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <span>⚠️ {importError}</span>
            <button onClick={() => setImportError("")} className="text-rose-600 hover:text-rose-900"><X size={14} /></button>
          </div>
        )}

        {/* IMPORT SUCCESS RESULT */}
        {importResult && (
          <div className="mb-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
            <div className="font-bold mb-1">✅ Kết quả Import:</div>
            <div>• Đã thêm thành công: <strong>{importResult.imported}</strong> thành viên</div>
            <div>• Bỏ qua (trùng hoặc thiếu dữ liệu): <strong>{importResult.skipped}</strong></div>
            {importResult.errors.length > 0 && (
              <div className="mt-1 text-amber-700">
                • Chi tiết bỏ qua: {importResult.errors.join(", ")}
              </div>
            )}
            <button onClick={() => setImportResult(null)} className="mt-1.5 text-emerald-700 hover:underline font-semibold">Đóng</button>
          </div>
        )}

        {/* IMPORT PREVIEW TABLE */}
        {showImportPanel && importData.length > 0 && (
          <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-900">📋 Xem trước dữ liệu Import ({importData.length} thành viên)</span>
              <div className="flex items-center gap-1.5">
                <Btn small tone="primary" onClick={handleImportSubmit}>✓ Xác nhận Import</Btn>
                <Btn small onClick={() => { setShowImportPanel(false); setImportData([]); }}>Huỷ</Btn>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-amber-300 text-[10px] font-bold text-amber-800">
                    <th className="py-1.5 pr-2">#</th>
                    <th className="py-1.5 pr-2">Họ tên</th>
                    <th className="py-1.5 pr-2">Email</th>
                    <th className="py-1.5 pr-2">Vai trò</th>
                    <th className="py-1.5 pr-2">SĐT</th>
                    <th className="py-1.5 pr-2">Chuyên môn</th>
                    <th className="py-1.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-200">
                  {importData.map((r: any, idx: number) => (
                    <tr key={idx} className="text-amber-900">
                      <td className="py-1.5 pr-2 text-amber-600 font-mono">{idx + 1}</td>
                      <td className="py-1.5 pr-2 font-semibold">{r.name}</td>
                      <td className="py-1.5 pr-2 font-mono">{r.email}</td>
                      <td className="py-1.5 pr-2"><RoleChip role={r.role} /></td>
                      <td className="py-1.5 pr-2">{r.phone || "—"}</td>
                      <td className="py-1.5 pr-2">{r.primaryExpertise || "—"}</td>
                      <td className="py-1.5">
                        <button onClick={() => setImportData(prev => prev.filter((_: any, i: number) => i !== idx))} className="text-rose-500 hover:text-rose-700"><X size={13} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {members.map((m: Member) => (
            <div 
              key={m.id} 
              onClick={() => onShowProfile(m)}
              className="p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center justify-between gap-2 hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-pointer">
              <div className="flex items-center gap-2 min-w-0">
                <UserAvatar name={m.name} size={28} />
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-slate-900 truncate">{m.name}</div>
                  <div className="text-[10px] text-slate-500 truncate">{m.id}</div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <RoleChip role={m.role} />
                {!m.active && (
                  <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">Ngừng HĐ</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FORMAT INFO CARD */}
      {actor.role === "Core" && (
        <div className="rounded-xl border border-slate-200 bg-white saas-shadow p-4">
          <h3 className="font-bold text-xs text-slate-900 mb-2 flex items-center gap-1.5">
            <FileText size={14} className="text-slate-600" />
            Hướng dẫn định dạng file Import CSV
          </h3>
          <div className="bg-slate-50 rounded-lg border border-slate-200 p-3 text-xs text-slate-700 font-mono overflow-x-auto">
            <div className="text-slate-500 mb-1">// Dòng 1 (Header):</div>
            <div>Họ tên,Email,Vai trò,Mật khẩu,SĐT,Facebook,Chuyên môn chính,Chuyên môn phụ</div>
            <div className="text-slate-500 mt-2 mb-1">// Ví dụ dòng dữ liệu:</div>
            <div>"Nguyễn Văn A","nguyenvana@example.com","P","123456","0909000111","","Quay phim","Dựng phim"</div>
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            <strong>Vai trò:</strong> Core, Editor (hoặc E), Producer (hoặc P). Mật khẩu mặc định là "123456" nếu để trống.
            File phải mã hóa <strong>UTF-8</strong> để hỗ trợ tiếng Việt.
          </p>
        </div>
      )}

      {/* CHECKLISTS & TO-DO STUDIO */}
      <div className="rounded-xl border border-slate-200 bg-white saas-shadow p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
              <CheckSquare size={16} className="text-indigo-600" />
              Checklist & Việc Cần Làm Studio ({checklists.length})
            </h3>
            <p className="text-xs text-slate-500">To-do list nội bộ để điều phối các đầu việc chung trong studio.</p>
          </div>
        </div>

        {/* ADD CHECKLIST FORM */}
        <form 
          onSubmit={(e: React.FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const form = e.currentTarget;
            const titleInput = form.elements.namedItem("checklistTitle") as HTMLInputElement;
            const val = titleInput.value.trim();
            if (!val) return;
            runAction(createChecklistAction, val);
            titleInput.value = "";
          }}
          className="flex items-center gap-2">
          <input
            name="checklistTitle"
            type="text"
            placeholder="Nhập đầu việc mới (VD: Kiểm tra pin máy quay, Mua bản quyền nhạc tháng 9...)"
            required
            className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none"
          />
          <Btn tone="primary" small type="submit"><Plus size={12} /> Thêm việc</Btn>
        </form>

        {/* CHECKLIST LIST */}
        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1 divide-y divide-slate-100">
          {checklists.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400 italic">
              Chưa có checklist nào. Hãy thêm đầu việc đầu tiên!
            </div>
          ) : (
            checklists.map((item: ChecklistItem) => {
              const isDone = item.status === "Hoàn thành";
              return (
                <div key={item.id} className="pt-2 flex items-center justify-between gap-3 text-xs">
                  <label className="flex items-center gap-2.5 min-w-0 cursor-pointer select-none flex-1">
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={() => runAction(updateChecklistStatusAction, item.id, isDone ? "Chưa bắt đầu" : "Hoàn thành")}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <span className={`truncate ${isDone ? 'line-through text-slate-400 font-normal' : 'text-slate-800 font-medium'}`}>
                      {item.name}
                    </span>
                  </label>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                      {item.status || "Chưa bắt đầu"}
                    </span>
                    <button
                      onClick={() => runAction(deleteChecklistAction, item.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      title="Xoá đầu việc">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
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
