import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  Film, Clapperboard, Users, LayoutGrid, Calendar, FolderOpen, Award,
  Plus, X, Trash2, RotateCcw, ChevronRight, ChevronLeft, AlertTriangle,
  CheckCircle2, XCircle, Link as LinkIcon, Copy, Lightbulb, PenLine,
  Scissors, Clapperboard as ClapIcon, ShieldCheck, Lock, ChevronDown
} from "lucide-react";

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
const STATUS_LABEL = {
  PITCH: "Ý tưởng",
  ASSIGNMENT: "Đã giao",
  SCRIPT: "Kịch bản",
  PRODUCTION: "Sản xuất",
  QA: "Kiểm duyệt",
  COMPLETE: "Hoàn thành",
};
const ROLE_LABEL = { Core: "Core", E: "Editor", P: "Producer" };
const PLATFORM_DEFAULT_DAYS = { TikTok: 2, YouTube: 4 };

const WEEKDAY_INFO = {
  1: { tag: "T2", title: "Mở nộp ý tưởng", who: "Core", desc: "Core mở lại cổng nhận ý tưởng mới cho tuần này." },
  2: { tag: "T3", title: "Nộp & duyệt ý tưởng", who: "E · P · Core", desc: "Editor/Producer nộp ý tưởng. Cuối ngày Core duyệt top 5–6, chốt nền tảng, số ngày và người phụ trách." },
  3: { tag: "T4", title: "Kịch bản & bắt đầu sản xuất", who: "P → E", desc: "Producer nộp kịch bản, Editor sửa, rồi bấm bắt đầu sản xuất." },
  4: { tag: "T5", title: "Sản xuất", who: "Producer", desc: "Quay dựng theo số ngày đã chốt — không cố định, tuỳ độ khó từng ý tưởng." },
  5: { tag: "T6", title: "Sản xuất", who: "Producer", desc: "Tiếp tục quay dựng. Sắp tới hạn sẽ có cảnh báo vàng/đỏ." },
  6: { tag: "T7", title: "Nộp video & kiểm duyệt", who: "P → E", desc: "Producer nộp video, Editor kiểm tra: Đạt → hoàn thành, Chưa đạt → quay lại sản xuất kèm ghi chú." },
  0: { tag: "CN", title: "Ngày đệm", who: "E · P", desc: "Thời gian dự phòng sửa lại idea bị trả, trước khi vào chu kỳ tuần mới." },
};

/* ---------------------------------------------------------------------
   HELPERS
--------------------------------------------------------------------- */
const iso = (d) => new Date(d).toISOString().slice(0, 10);
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const today = new Date();
const todayIso = iso(today);
const fmtDate = (s) => { if (!s) return "—"; const d = new Date(s); return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`; };
const fmtDateFull = (s) => { if (!s) return "—"; const d = new Date(s); return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`; };
const uid = (p) => `${p}_${Date.now().toString(36)}${Math.random().toString(36).slice(2,7)}`;

function overdueInfo(idea) {
  if (idea.status === "ASSIGNMENT" && idea.assignedAt) {
    const hrs = (Date.now() - idea.assignedAt) / 36e5;
    if (hrs > 24) return { level: "yellow", msg: "Quá 1 ngày chưa nộp kịch bản" };
  }
  if (idea.status === "PRODUCTION" && idea.endDate) {
    const end = new Date(idea.endDate + "T23:59:59");
    const diffDays = (end - today) / 864e5;
    if (diffDays < 0) return { level: "red", msg: `Đã trễ hạn sản xuất (${fmtDate(idea.endDate)})` };
    if (diffDays <= 1) return { level: "yellow", msg: `Còn ≤1 ngày tới hạn (${fmtDate(idea.endDate)})` };
  }
  if (idea.status === "QA" && idea.videoSubmittedAt) {
    const hrs = (Date.now() - idea.videoSubmittedAt) / 36e5;
    if (hrs > 24) return { level: "yellow", msg: "Quá 24 giờ chưa kiểm duyệt" };
  }
  return null;
}

function canApprove(role) { return role === "Core"; }
function canSubmitScript(actor, idea) { return idea.assignedTo === actor.id && (actor.role === "P"); }
function canStartProduction(actor, idea) { return actor.role === "E" || actor.role === "Core"; }
function canSubmitVideo(actor, idea) { return idea.assignedTo === actor.id && actor.role === "P"; }
function canQA(actor) { return actor.role === "E" || actor.role === "Core"; }
function canDeleteIdea(actor, idea) {
  if (actor.role === "Core" || actor.role === "E") return true;
  if (idea.status === "PITCH" && idea.submittedBy === actor.id) return true;
  return false;
}
function canManageChannels(actor) { return actor.role === "Core"; }
function canManageMembers(actor) { return actor.role === "Core"; }

/* ---------------------------------------------------------------------
   PERSISTENCE
--------------------------------------------------------------------- */
async function loadOrSeed(key, seedFn, shared) {
  try {
    const res = await window.storage.get(key, shared);
    return JSON.parse(res.value);
  } catch (e) {
    const seed = seedFn();
    try { await window.storage.set(key, JSON.stringify(seed), shared); } catch (e2) {}
    return seed;
  }
}
async function persist(key, value, shared) {
  try { await window.storage.set(key, JSON.stringify(value), shared); } catch (e) { console.error("storage set failed", key, e); }
}

function seedMembers() {
  return [
    { id: "m_mina", name: "Mina", role: "Core" },
    { id: "m_an", name: "An", role: "E" },
    { id: "m_khoa", name: "Khoa", role: "P" },
    { id: "m_linh", name: "Linh", role: "P" },
  ];
}
function seedChannels() {
  return [
    { id: "c_chinh", name: "Kênh Chính", color: CHANNEL_PALETTE[0], archived: false },
    { id: "c_phu", name: "Kênh Phụ", color: CHANNEL_PALETTE[1], archived: false },
  ];
}
function seedIdeas() {
  const mk = (o) => ({
    scriptLink: "", videoLink: "", qaFeedback: "", publishedLink: "",
    platform: null, durationDays: null, assignedTo: null,
    startDate: null, endDate: null, assignedAt: null, videoSubmittedAt: null,
    credits: { ideaBy: o.submittedBy, scriptBy: null, editedScriptBy: null, producedBy: null, qaBy: null },
    ...o,
  });
  return [
    mk({
      id: uid("idea"), title: "After Rain", channelId: "c_phu", submittedBy: "m_an",
      status: "COMPLETE", platform: "YouTube", durationDays: 6, assignedTo: "m_khoa",
      startDate: iso(addDays(today, -10)), endDate: iso(addDays(today, -4)),
      createdAt: addDays(today, -12).getTime(), videoSubmittedAt: addDays(today, -4).getTime(),
      publishedLink: "https://youtube.com/watch?v=after-rain-demo",
      credits: { ideaBy: "m_an", scriptBy: "m_khoa", editedScriptBy: "m_an", producedBy: "m_khoa", qaBy: "m_an" },
    }),
    mk({
      id: uid("idea"), title: "Cà phê buổi sáng", channelId: "c_chinh", submittedBy: "m_khoa",
      status: "COMPLETE", platform: "TikTok", durationDays: 2, assignedTo: "m_khoa",
      startDate: iso(addDays(today, -6)), endDate: iso(addDays(today, -4)),
      createdAt: addDays(today, -7).getTime(), videoSubmittedAt: addDays(today, -4).getTime(),
      publishedLink: "https://tiktok.com/@ynda/video/cafe-sang-demo",
      credits: { ideaBy: "m_khoa", scriptBy: "m_khoa", editedScriptBy: "m_an", producedBy: "m_khoa", qaBy: "m_an" },
    }),
    mk({
      id: uid("idea"), title: "Chợ đêm Đà Lạt", channelId: "c_chinh", submittedBy: "m_an",
      status: "PRODUCTION", platform: "YouTube", durationDays: 4, assignedTo: "m_khoa",
      startDate: iso(addDays(today, -1)), endDate: iso(addDays(today, 2)),
      createdAt: addDays(today, -1).getTime(), assignedAt: addDays(today, -1).getTime(),
      credits: { ideaBy: "m_an", scriptBy: "m_khoa", editedScriptBy: "m_an", producedBy: null, qaBy: null },
    }),
    mk({
      id: uid("idea"), title: "Góc phố cà phê", channelId: "c_chinh", submittedBy: "m_an",
      status: "QA", platform: "TikTok", durationDays: 2, assignedTo: "m_khoa",
      startDate: iso(addDays(today, -3)), endDate: iso(addDays(today, -1)),
      createdAt: addDays(today, -3).getTime(), assignedAt: addDays(today, -3).getTime(),
      videoSubmittedAt: Date.now() - 30 * 36e5,
      credits: { ideaBy: "m_an", scriptBy: "m_khoa", editedScriptBy: "m_an", producedBy: "m_khoa", qaBy: null },
    }),
    mk({
      id: uid("idea"), title: "Review quán ăn mới", channelId: "c_phu", submittedBy: "m_khoa",
      status: "ASSIGNMENT", platform: "YouTube", durationDays: 4, assignedTo: "m_linh",
      startDate: iso(addDays(today, -2)), endDate: iso(addDays(today, 1)),
      createdAt: addDays(today, -2).getTime(), assignedAt: addDays(today, -2).getTime(),
      credits: { ideaBy: "m_khoa", scriptBy: null, editedScriptBy: null, producedBy: null, qaBy: null },
    }),
    mk({
      id: uid("idea"), title: "Buổi sáng ở chợ", channelId: "c_chinh", submittedBy: "m_linh",
      status: "SCRIPT", platform: "TikTok", durationDays: 2, assignedTo: "m_khoa",
      startDate: todayIso, endDate: iso(addDays(today, 1)),
      createdAt: today.getTime(), assignedAt: today.getTime(),
      credits: { ideaBy: "m_linh", scriptBy: "m_khoa", editedScriptBy: null, producedBy: null, qaBy: null },
    }),
    mk({
      id: uid("idea"), title: "Mưa rào tháng 8", channelId: "c_phu", submittedBy: "m_linh",
      status: "PITCH", createdAt: Date.now(),
      credits: { ideaBy: "m_linh", scriptBy: null, editedScriptBy: null, producedBy: null, qaBy: null },
    }),
  ];
}

/* ---------------------------------------------------------------------
   SMALL UI PRIMITIVES
--------------------------------------------------------------------- */
function Badge({ children, tone = "muted" }) {
  const tones = {
    muted: { bg: C.panelRaised, fg: C.textMuted, bd: C.border },
    teal: { bg: C.tealDim, fg: C.teal, bd: C.teal },
    amber: { bg: C.amberDim, fg: C.amber, bd: C.amber },
    red: { bg: C.redDim, fg: C.red, bd: C.red },
    green: { bg: "#1E3A28", fg: C.green, bd: C.green },
  };
  const t = tones[tone];
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium tracking-wide"
      style={{ background: t.bg, color: t.fg, border: `1px solid ${t.bd}44`, fontFamily: "var(--font-mono)" }}
    >
      {children}
    </span>
  );
}

function RoleChip({ role }) {
  const map = { Core: C.red, E: C.teal, P: C.blue };
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-widest"
      style={{ color: map[role], border: `1px solid ${map[role]}55`, fontFamily: "var(--font-mono)" }}
    >
      {ROLE_LABEL[role].toUpperCase()}
    </span>
  );
}

function Modal({ title, onClose, children, wide }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(10,11,14,0.72)", backdropFilter: "blur(2px)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full flex flex-col"
        style={{
          maxWidth: wide ? 640 : 460, maxHeight: "88vh", background: C.panel,
          border: `1px solid ${C.border}`, borderRadius: 4, boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
        }}
      >
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
          <h3 style={{ color: C.text, fontFamily: "var(--font-display)", fontSize: 18, letterSpacing: 0.3 }}>{title}</h3>
          <button onClick={onClose} style={{ color: C.textMuted }} className="hover:opacity-70">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function FieldLabel({ children }) {
  return <label className="block mb-1.5 text-xs font-semibold tracking-wide" style={{ color: C.textMuted }}>{children}</label>;
}
const inputStyle = { background: C.bgSoft, border: `1px solid ${C.border}`, color: C.text, borderRadius: 3 };

function TextInput(props) {
  return <input {...props} className={"w-full px-3 py-2 text-sm outline-none " + (props.className||"")} style={{ ...inputStyle, ...(props.style||{}) }} />;
}
function Select(props) {
  return <select {...props} className={"w-full px-3 py-2 text-sm outline-none " + (props.className||"")} style={{ ...inputStyle, ...(props.style||{}) }} />;
}
function TextArea(props) {
  return <textarea {...props} className={"w-full px-3 py-2 text-sm outline-none " + (props.className||"")} style={{ ...inputStyle, ...(props.style||{}) }} />;
}
function Btn({ children, onClick, tone = "default", disabled, type = "button", small }) {
  const tones = {
    default: { bg: C.panelRaised, fg: C.text, bd: C.border },
    primary: { bg: C.teal, fg: "#0B1615", bd: C.teal },
    danger: { bg: "transparent", fg: C.red, bd: C.red },
    ghost: { bg: "transparent", fg: C.textMuted, bd: "transparent" },
  };
  const t = tones[tone];
  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      className={"inline-flex items-center gap-1.5 font-semibold rounded transition-opacity " + (small ? "px-2.5 py-1 text-xs" : "px-3.5 py-2 text-sm") + (disabled ? " opacity-40 cursor-not-allowed" : " hover:opacity-85")}
      style={{ background: t.bg, color: t.fg, border: `1px solid ${t.bd}` }}
    >
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------------
   WEEKLY FILMSTRIP HEADER
--------------------------------------------------------------------- */
function WeeklyStrip() {
  const dow = today.getDay();
  const info = WEEKDAY_INFO[dow];
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <div className="px-5 pt-4 pb-3" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
      <div className="flex items-stretch gap-3">
        <div className="flex gap-1 items-center shrink-0">
          {order.map((d) => {
            const active = d === dow;
            return (
              <div key={d} className="relative flex flex-col items-center justify-center"
                style={{
                  width: 34, height: 44, background: active ? C.teal : C.panelRaised,
                  border: `1px solid ${active ? C.teal : C.border}`, borderRadius: 2,
                }}>
                <div className="absolute top-0.5 left-0 right-0 flex justify-between px-0.5">
                  <span style={{ width: 3, height: 3, borderRadius: 9, background: active ? "#0B1615" : C.textFaint }} />
                  <span style={{ width: 3, height: 3, borderRadius: 9, background: active ? "#0B1615" : C.textFaint }} />
                </div>
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700, color: active ? "#0B1615" : C.textMuted }}>{WEEKDAY_INFO[d].tag}</span>
                <div className="absolute bottom-0.5 left-0 right-0 flex justify-between px-0.5">
                  <span style={{ width: 3, height: 3, borderRadius: 9, background: active ? "#0B1615" : C.textFaint }} />
                  <span style={{ width: 3, height: 3, borderRadius: 9, background: active ? "#0B1615" : C.textFaint }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex-1 flex items-center gap-3 px-4" style={{ background: C.panel, border: `1px solid ${C.border}`, borderRadius: 3 }}>
          <Clapperboard size={20} color={C.amber} />
          <div className="min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span style={{ fontFamily: "var(--font-display)", fontSize: 16, letterSpacing: 0.4, color: C.text }}>{info.title.toUpperCase()}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: C.textFaint }}>· {info.who} · {fmtDateFull(todayIso)}</span>
            </div>
            <p style={{ color: C.textMuted, fontSize: 12.5, marginTop: 2 }}>{info.desc}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   IDEA CARD + DETAIL
--------------------------------------------------------------------- */
function IdeaCard({ idea, channel, member, onOpen }) {
  const od = overdueInfo(idea);
  return (
    <button
      onClick={onOpen}
      className="w-full text-left p-3 mb-2 group"
      style={{
        background: C.panel, borderRadius: 3,
        borderLeft: `3px solid ${channel ? channel.color : C.border}`,
        border: `1px solid ${od ? (od.level === "red" ? C.red : C.amber) : C.borderSoft}`,
        borderLeftWidth: 3, borderLeftColor: channel ? channel.color : C.border,
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span style={{ color: C.text, fontSize: 13.5, fontWeight: 600, lineHeight: 1.3 }}>{idea.title}</span>
        {od && <AlertTriangle size={13} color={od.level === "red" ? C.red : C.amber} className="shrink-0 mt-0.5" />}
      </div>
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        {channel && <span style={{ fontSize: 10.5, color: channel.color, fontFamily: "var(--font-mono)" }}>{channel.name}</span>}
        {idea.platform && <span style={{ fontSize: 10.5, color: C.textFaint }}>· {idea.platform}</span>}
      </div>
      <div className="flex items-center justify-between mt-2">
        <span style={{ fontSize: 11, color: C.textMuted }}>{member ? member.name : "—"}</span>
        {idea.endDate && <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: od ? (od.level === "red" ? C.red : C.amber) : C.textFaint }}>{fmtDate(idea.startDate)}–{fmtDate(idea.endDate)}</span>}
      </div>
    </button>
  );
}

function CreditRow({ icon: Icon, label, member }) {
  return (
    <div className="flex items-center gap-2 py-1">
      <Icon size={13} color={C.textFaint} />
      <span style={{ fontSize: 12, color: C.textMuted, width: 118 }}>{label}</span>
      <span style={{ fontSize: 12.5, color: member ? C.text : C.textFaint, fontWeight: member ? 600 : 400 }}>{member ? member.name : "chưa có"}</span>
    </div>
  );
}

/* ---------------------------------------------------------------------
   MAIN APP
--------------------------------------------------------------------- */
export default function App() {
  const [loaded, setLoaded] = useState(false);
  const [members, setMembers] = useState([]);
  const [channels, setChannels] = useState([]);
  const [ideas, setIdeas] = useState([]);
  const [submissionOpen, setSubmissionOpen] = useState(true);
  const [actingId, setActingId] = useState(null);
  const [tab, setTab] = useState("board");
  const [openIdea, setOpenIdea] = useState(null);
  const [showNewIdea, setShowNewIdea] = useState(false);
  const [approveIdea, setApproveIdea] = useState(null);
  const [qaRejectIdea, setQaRejectIdea] = useState(null);
  const [qaCompleteIdea, setQaCompleteIdea] = useState(null);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [showNewMember, setShowNewMember] = useState(false);
  const [confirmDeleteChannel, setConfirmDeleteChannel] = useState(null);
  const [portfolioMember, setPortfolioMember] = useState(null);
  const [ganttChannelId, setGanttChannelId] = useState(null);
  const [ganttMonthOffset, setGanttMonthOffset] = useState(0);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    (async () => {
      const [m, c, i, actingRes] = await Promise.all([
        loadOrSeed("members", seedMembers, true),
        loadOrSeed("channels", seedChannels, true),
        loadOrSeed("ideas", seedIdeas, true),
        (async () => { try { const r = await window.storage.get("actingId", false); return JSON.parse(r.value); } catch { return null; } })(),
      ]);
      let subOpenVal = true;
      try { const r = await window.storage.get("submissionOpen", true); subOpenVal = JSON.parse(r.value); } catch {}
      setMembers(m); setChannels(c); setIdeas(i); setSubmissionOpen(subOpenVal);
      setActingId(actingRes && m.find(x => x.id === actingRes) ? actingRes : (m.find(x => x.role === "Core") || m[0])?.id || null);
      setPortfolioMember((m[0] && m[0].id) || null);
      setGanttChannelId((c[0] && c[0].id) || null);
      setLoaded(true);
    })();
  }, []);

  const setAndPersistIdeas = useCallback((next) => { setIdeas(next); persist("ideas", next, true); }, []);
  const setAndPersistMembers = useCallback((next) => { setMembers(next); persist("members", next, true); }, []);
  const setAndPersistChannels = useCallback((next) => { setChannels(next); persist("channels", next, true); }, []);
  const setAndPersistSubmission = useCallback((v) => { setSubmissionOpen(v); persist("submissionOpen", v, true); }, []);
  const chooseActing = useCallback((id) => { setActingId(id); persist("actingId", id, false); }, []);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2600); };

  const actor = members.find((m) => m.id === actingId) || null;
  const memberById = useMemo(() => Object.fromEntries(members.map((m) => [m.id, m])), [members]);
  const channelById = useMemo(() => Object.fromEntries(channels.map((c) => [c.id, c])), [channels]);
  const activeChannels = channels.filter((c) => !c.archived);
  const trashedChannels = channels.filter((c) => c.archived);

  function updateIdea(id, patch) {
    setAndPersistIdeas(ideas.map((it) => (it.id === id ? { ...it, ...patch, credits: { ...it.credits, ...(patch.credits || {}) } } : it)));
  }

  /* ---- idea lifecycle actions ---- */
  function submitIdea(title, channelId) {
    const newIdea = {
      id: uid("idea"), title, channelId, submittedBy: actor.id, status: "PITCH",
      platform: null, durationDays: null, assignedTo: null, startDate: null, endDate: null,
      assignedAt: null, videoSubmittedAt: null, scriptLink: "", videoLink: "", qaFeedback: "", publishedLink: "",
      createdAt: Date.now(),
      credits: { ideaBy: actor.id, scriptBy: null, editedScriptBy: null, producedBy: null, qaBy: null },
    };
    setAndPersistIdeas([newIdea, ...ideas]);
    setShowNewIdea(false);
    showToast(`Đã nộp ý tưởng "${title}" vào PITCH`);
  }

  function approveToAssignment(idea, platform, days, producerId) {
    const start = todayIso;
    const end = iso(addDays(today, days - 1));
    updateIdea(idea.id, { status: "ASSIGNMENT", platform, durationDays: days, assignedTo: producerId, startDate: start, endDate: end, assignedAt: Date.now() });
    setApproveIdea(null);
    showToast(`"${idea.title}" chuyển sang ASSIGNMENT — giao ${memberById[producerId]?.name}`);
  }

  function submitScript(idea) {
    updateIdea(idea.id, { status: "SCRIPT", credits: { scriptBy: idea.assignedTo } });
    showToast(`"${idea.title}" chuyển sang SCRIPT`);
    setOpenIdea(null);
  }
  function startProduction(idea) {
    updateIdea(idea.id, { status: "PRODUCTION", credits: { editedScriptBy: actor.id } });
    showToast(`"${idea.title}" bắt đầu PRODUCTION`);
    setOpenIdea(null);
  }
  function submitVideo(idea) {
    updateIdea(idea.id, { status: "QA", videoSubmittedAt: Date.now(), credits: { producedBy: idea.assignedTo } });
    showToast(`"${idea.title}" chuyển sang QA`);
    setOpenIdea(null);
  }
  function qaFail(idea, note) {
    updateIdea(idea.id, { status: "PRODUCTION", qaFeedback: note });
    setQaRejectIdea(null);
    showToast(`"${idea.title}" bị trả về PRODUCTION`);
    setOpenIdea(null);
  }
  function qaPass(idea, link) {
    updateIdea(idea.id, { status: "COMPLETE", publishedLink: link, qaFeedback: "", credits: { qaBy: actor.id } });
    setQaCompleteIdea(null);
    showToast(`"${idea.title}" hoàn thành 🎉`);
    setOpenIdea(null);
  }
  function deleteIdea(idea) {
    setAndPersistIdeas(ideas.filter((i) => i.id !== idea.id));
    setOpenIdea(null);
    showToast(`Đã xoá "${idea.title}"`);
  }

  /* ---- channels ---- */
  function addChannel(name) {
    const color = CHANNEL_PALETTE[channels.length % CHANNEL_PALETTE.length];
    const ch = { id: uid("ch"), name, color, archived: false };
    setAndPersistChannels([...channels, ch]);
    setShowNewChannel(false);
  }
  function requestDeleteChannel(ch) {
    const hasIdeas = ideas.some((i) => i.channelId === ch.id);
    if (!hasIdeas) {
      setAndPersistChannels(channels.filter((c) => c.id !== ch.id));
      showToast(`Đã xoá kênh trống "${ch.name}"`);
    } else {
      setConfirmDeleteChannel(ch);
    }
  }
  function archiveChannel(ch) {
    setAndPersistChannels(channels.map((c) => (c.id === ch.id ? { ...c, archived: true } : c)));
    setConfirmDeleteChannel(null);
    showToast(`Đã chuyển "${ch.name}" vào Thùng rác`);
  }
  function restoreChannel(ch) {
    setAndPersistChannels(channels.map((c) => (c.id === ch.id ? { ...c, archived: false } : c)));
    showToast(`Đã khôi phục "${ch.name}"`);
  }

  /* ---- members ---- */
  function addMember(name, role) {
    const mem = { id: uid("m"), name, role };
    setAndPersistMembers([...members, mem]);
    setShowNewMember(false);
  }
  function removeMember(m) {
    const active = ideas.some((i) => i.assignedTo === m.id && i.status !== "COMPLETE");
    if (active) { showToast(`Không thể xoá — "${m.name}" đang phụ trách idea chưa hoàn thành`); return; }
    setAndPersistMembers(members.filter((x) => x.id !== m.id));
    if (actingId === m.id) chooseActing(members.find((x) => x.id !== m.id)?.id || null);
    showToast(`Đã xoá thành viên "${m.name}"`);
  }

  if (!loaded || !actor) {
    return (
      <div style={{ background: C.bg, minHeight: 480, display: "flex", alignItems: "center", justifyContent: "center", color: C.textMuted, fontFamily: "var(--font-mono)" }}>
        Đang tải hệ thống…
      </div>
    );
  }

  const TABS = [
    { id: "board", label: "Bảng ý tưởng", icon: LayoutGrid },
    { id: "gantt", label: "Kênh & Gantt", icon: Calendar },
    { id: "members", label: "Thành viên & Nhật ký", icon: Users },
    { id: "portfolio", label: "Portfolio", icon: Award },
  ];

  return (
    <div style={{ background: C.bg, minHeight: 640, fontFamily: "var(--font-body)" }}>
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
            <div style={{ fontSize: 10.5, color: C.textFaint, fontFamily: "var(--font-mono)", marginTop: 2 }}>nội bộ · không đăng nhập thật</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1" style={{ border: `1px solid ${C.borderSoft}`, borderRadius: 3 }}>
            <span style={{ width: 6, height: 6, borderRadius: 6, background: submissionOpen ? C.green : C.textFaint }} />
            <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "var(--font-mono)" }}>{submissionOpen ? "Đang mở nộp ý tưởng" : "Đã đóng nộp ý tưởng"}</span>
            {actor.role === "Core" && (
              <button onClick={() => setAndPersistSubmission(!submissionOpen)} className="ml-1 hover:opacity-70" style={{ color: C.teal, fontSize: 11 }}>
                {submissionOpen ? "đóng" : "mở"}
              </button>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{ fontSize: 11, color: C.textFaint }}>Đăng nhập với tư cách</span>
            <div className="relative">
              <Select value={actingId || ""} onChange={(e) => chooseActing(e.target.value)} style={{ paddingRight: 26, fontSize: 12.5 }}>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name} · {ROLE_LABEL[m.role]}</option>)}
              </Select>
            </div>
          </div>
        </div>
      </div>

      <WeeklyStrip />

      {/* TABS */}
      <div className="flex items-center gap-1 px-5 pt-3" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
        {TABS.map((t) => {
          const active = tab === t.id;
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium"
              style={{ color: active ? C.teal : C.textMuted, borderBottom: `2px solid ${active ? C.teal : "transparent"}`, marginBottom: -1 }}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      <div className="p-5">
        {tab === "board" && (
          <BoardView
            ideas={ideas} channels={channels} memberById={memberById} channelById={channelById}
            actor={actor} onOpen={setOpenIdea} onNewIdea={() => setShowNewIdea(true)}
            submissionOpen={submissionOpen}
          />
        )}
        {tab === "gantt" && (
          <ChannelsGanttView
            channels={activeChannels} trashed={trashedChannels} ideas={ideas} actor={actor}
            ganttChannelId={ganttChannelId} setGanttChannelId={setGanttChannelId}
            monthOffset={ganttMonthOffset} setMonthOffset={setGanttMonthOffset}
            onNewChannel={() => setShowNewChannel(true)}
            onDeleteChannel={requestDeleteChannel} onRestoreChannel={restoreChannel}
          />
        )}
        {tab === "members" && (
          <MembersLogView
            members={members} ideas={ideas} channelById={channelById} actor={actor}
            onAddMember={() => setShowNewMember(true)} onRemoveMember={removeMember}
          />
        )}
        {tab === "portfolio" && (
          <PortfolioView
            members={members} ideas={ideas} channelById={channelById}
            selected={portfolioMember} setSelected={setPortfolioMember} showToast={showToast}
          />
        )}
      </div>

      {/* ---------------- MODALS ---------------- */}
      {showNewIdea && (
        <NewIdeaModal channels={activeChannels} onClose={() => setShowNewIdea(false)} onSubmit={submitIdea} />
      )}

      {openIdea && (
        <IdeaDetailModal
          idea={ideas.find((i) => i.id === openIdea.id) || openIdea}
          channel={channelById[openIdea.channelId]} memberById={memberById} actor={actor}
          onClose={() => setOpenIdea(null)}
          onApprove={(idea) => setApproveIdea(idea)}
          onSubmitScript={submitScript} onStartProduction={startProduction} onSubmitVideo={submitVideo}
          onQaFail={(idea) => setQaRejectIdea(idea)} onQaPass={(idea) => setQaCompleteIdea(idea)}
          onDelete={deleteIdea}
        />
      )}

      {approveIdea && (
        <ApproveModal idea={approveIdea} members={members.filter((m) => m.role === "P")} onClose={() => setApproveIdea(null)} onApprove={approveToAssignment} />
      )}

      {qaRejectIdea && (
        <QaRejectModal idea={qaRejectIdea} onClose={() => setQaRejectIdea(null)} onConfirm={qaFail} />
      )}
      {qaCompleteIdea && (
        <QaCompleteModal idea={qaCompleteIdea} onClose={() => setQaCompleteIdea(null)} onConfirm={qaPass} />
      )}

      {showNewChannel && (
        <NewChannelModal onClose={() => setShowNewChannel(false)} onCreate={addChannel} />
      )}
      {showNewMember && (
        <NewMemberModal onClose={() => setShowNewMember(false)} onCreate={addMember} />
      )}
      {confirmDeleteChannel && (
        <Modal title="Xoá kênh có dữ liệu?" onClose={() => setConfirmDeleteChannel(null)}>
          <p style={{ color: C.textMuted, fontSize: 13.5, lineHeight: 1.6 }}>
            Kênh <b style={{ color: C.text }}>{confirmDeleteChannel.name}</b> đang chứa ý tưởng thật.
            Kênh sẽ được chuyển vào <b>Thùng rác</b> (không mất dữ liệu) và có thể khôi phục lại bất cứ lúc nào.
          </p>
          <div className="flex justify-end gap-2 mt-5">
            <Btn onClick={() => setConfirmDeleteChannel(null)}>Huỷ</Btn>
            <Btn tone="danger" onClick={() => archiveChannel(confirmDeleteChannel)}>Chuyển vào Thùng rác</Btn>
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
}

/* ---------------------------------------------------------------------
   BOARD VIEW
--------------------------------------------------------------------- */
function BoardView({ ideas, channels, memberById, channelById, actor, onOpen, onNewIdea, submissionOpen }) {
  const canSubmit = actor.role === "E" || actor.role === "P" || actor.role === "Core";
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: C.text, letterSpacing: 0.3 }}>BẢNG Ý TƯỞNG</h2>
          <p style={{ color: C.textFaint, fontSize: 12 }}>Vòng đời: PITCH → ASSIGNMENT → SCRIPT → PRODUCTION → QA → COMPLETE</p>
        </div>
        <Btn tone="primary" onClick={onNewIdea} disabled={!canSubmit || !submissionOpen}>
          <Plus size={15} /> Nộp ý tưởng
        </Btn>
      </div>
      {!submissionOpen && <div className="mb-3"><Badge tone="amber">Core đã đóng cổng nộp ý tưởng tuần này</Badge></div>}
      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${STATUS_ORDER.length}, minmax(200px, 1fr))`, overflowX: "auto" }}>
        {STATUS_ORDER.map((status) => {
          const col = ideas.filter((i) => i.status === status).sort((a, b) => b.createdAt - a.createdAt);
          return (
            <div key={status} style={{ minWidth: 200 }}>
              <div className="flex items-center justify-between mb-2 px-0.5">
                <span style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, fontWeight: 700, color: C.textMuted, letterSpacing: 0.5 }}>{STATUS_LABEL[status].toUpperCase()}</span>
                <span style={{ fontSize: 10.5, color: C.textFaint }}>{col.length}</span>
              </div>
              <div style={{ minHeight: 40 }}>
                {col.length === 0 && <div style={{ fontSize: 11.5, color: C.textFaint, padding: "10px 4px", fontStyle: "italic" }}>Trống</div>}
                {col.map((idea) => (
                  <IdeaCard key={idea.id} idea={idea} channel={channelById[idea.channelId]} member={memberById[idea.assignedTo]} onOpen={() => onOpen(idea)} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   NEW IDEA MODAL
--------------------------------------------------------------------- */
function NewIdeaModal({ channels, onClose, onSubmit }) {
  const [title, setTitle] = useState("");
  const [channelId, setChannelId] = useState(channels[0]?.id || "");
  return (
    <Modal title="Nộp ý tưởng mới" onClose={onClose}>
      <FieldLabel>Tên ý tưởng</FieldLabel>
      <TextInput autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Hoàng hôn ở hồ Xuân Hương" />
      <div className="mt-3">
        <FieldLabel>Kênh</FieldLabel>
        <Select value={channelId} onChange={(e) => setChannelId(e.target.value)}>
          {channels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <Btn onClick={onClose}>Huỷ</Btn>
        <Btn tone="primary" disabled={!title.trim() || !channelId} onClick={() => onSubmit(title.trim(), channelId)}>Nộp vào PITCH</Btn>
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------------------
   APPROVE MODAL (Core duyệt PITCH → ASSIGNMENT)
--------------------------------------------------------------------- */
function ApproveModal({ idea, members, onClose, onApprove }) {
  const [platform, setPlatform] = useState("TikTok");
  const [days, setDays] = useState(PLATFORM_DEFAULT_DAYS["TikTok"]);
  const [producerId, setProducerId] = useState(members[0]?.id || "");

  function changePlatform(p) { setPlatform(p); setDays(PLATFORM_DEFAULT_DAYS[p]); }

  return (
    <Modal title={`Duyệt "${idea.title}"`} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>Nền tảng</FieldLabel>
          <Select value={platform} onChange={(e) => changePlatform(e.target.value)}>
            <option value="TikTok">TikTok</option>
            <option value="YouTube">YouTube</option>
          </Select>
        </div>
        <div>
          <FieldLabel>Số ngày sản xuất</FieldLabel>
          <TextInput type="number" min={1} value={days} onChange={(e) => setDays(Math.max(1, parseInt(e.target.value || "1", 10)))} />
        </div>
      </div>
      <div className="mt-3">
        <FieldLabel>Producer phụ trách</FieldLabel>
        {members.length === 0 ? (
          <p style={{ color: C.red, fontSize: 12.5 }}>Chưa có Producer nào trong hệ thống — thêm thành viên trước khi duyệt.</p>
        ) : (
          <Select value={producerId} onChange={(e) => setProducerId(e.target.value)}>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Select>
        )}
      </div>
      <p style={{ color: C.textFaint, fontSize: 11.5, marginTop: 10 }}>
        Bắt đầu hôm nay ({fmtDateFull(todayIso)}) · Hạn: {fmtDateFull(iso(addDays(today, days - 1)))}
      </p>
      <div className="flex justify-end gap-2 mt-5">
        <Btn onClick={onClose}>Huỷ</Btn>
        <Btn tone="primary" disabled={!producerId} onClick={() => onApprove(idea, platform, days, producerId)}>Duyệt → ASSIGNMENT</Btn>
      </div>
    </Modal>
  );
}

function QaRejectModal({ idea, onClose, onConfirm }) {
  const [note, setNote] = useState("");
  return (
    <Modal title={`Chưa đạt — "${idea.title}"`} onClose={onClose}>
      <FieldLabel>Lý do cụ thể (bắt buộc)</FieldLabel>
      <TextArea rows={4} value={note} onChange={(e) => setNote(e.target.value)} placeholder="VD: Màu quá tối ở đoạn giữa, chỉnh lại rồi nộp lại." />
      <div className="flex justify-end gap-2 mt-5">
        <Btn onClick={onClose}>Huỷ</Btn>
        <Btn tone="danger" disabled={!note.trim()} onClick={() => onConfirm(idea, note.trim())}>Trả về PRODUCTION</Btn>
      </div>
    </Modal>
  );
}
function QaCompleteModal({ idea, onClose, onConfirm }) {
  const [link, setLink] = useState("");
  return (
    <Modal title={`Đạt — "${idea.title}"`} onClose={onClose}>
      <FieldLabel>Dán link sản phẩm đã đăng (bắt buộc)</FieldLabel>
      <TextInput value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
      <p style={{ color: C.textFaint, fontSize: 11.5, marginTop: 8 }}>Không có link thì idea vẫn giữ ở QA — đây là bằng chứng dùng cho Portfolio.</p>
      <div className="flex justify-end gap-2 mt-5">
        <Btn onClick={onClose}>Huỷ</Btn>
        <Btn tone="primary" disabled={!link.trim()} onClick={() => onConfirm(idea, link.trim())}>Hoàn thành → COMPLETE</Btn>
      </div>
    </Modal>
  );
}

function NewChannelModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  return (
    <Modal title="Tạo dự án con (kênh)" onClose={onClose}>
      <FieldLabel>Tên kênh</FieldLabel>
      <TextInput autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Kênh Review" />
      <div className="flex justify-end gap-2 mt-5">
        <Btn onClick={onClose}>Huỷ</Btn>
        <Btn tone="primary" disabled={!name.trim()} onClick={() => onCreate(name.trim())}>Tạo kênh</Btn>
      </div>
    </Modal>
  );
}
function NewMemberModal({ onClose, onCreate }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("P");
  return (
    <Modal title="Thêm thành viên" onClose={onClose}>
      <FieldLabel>Tên</FieldLabel>
      <TextInput autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Bảo" />
      <div className="mt-3">
        <FieldLabel>Vai trò</FieldLabel>
        <Select value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="P">Producer</option>
          <option value="E">Editor</option>
          <option value="Core">Core</option>
        </Select>
      </div>
      <div className="flex justify-end gap-2 mt-5">
        <Btn onClick={onClose}>Huỷ</Btn>
        <Btn tone="primary" disabled={!name.trim()} onClick={() => onCreate(name.trim(), role)}>Thêm</Btn>
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------------------
   IDEA DETAIL MODAL
--------------------------------------------------------------------- */
function IdeaDetailModal({ idea, channel, memberById, actor, onClose, onApprove, onSubmitScript, onStartProduction, onSubmitVideo, onQaFail, onQaPass, onDelete }) {
  const od = overdueInfo(idea);
  const submitter = memberById[idea.submittedBy];
  const assignee = memberById[idea.assignedTo];

  return (
    <Modal title={idea.title} onClose={onClose} wide>
      <div className="flex items-center gap-2 flex-wrap mb-4">
        <Badge tone="muted">{STATUS_LABEL[idea.status]}</Badge>
        {channel && <span style={{ fontSize: 12, color: channel.color, fontFamily: "var(--font-mono)" }}>{channel.name}</span>}
        {idea.platform && <Badge tone="muted">{idea.platform}</Badge>}
        {idea.durationDays && <Badge tone="muted">{idea.durationDays} ngày</Badge>}
        {od && <Badge tone={od.level === "red" ? "red" : "amber"}><AlertTriangle size={11} /> {od.msg}</Badge>}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div style={{ fontSize: 11, color: C.textFaint }}>Người nộp</div>
          <div style={{ fontSize: 13, color: C.text }}>{submitter ? submitter.name : "—"}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: C.textFaint }}>Người phụ trách sản xuất</div>
          <div style={{ fontSize: 13, color: C.text }}>{assignee ? assignee.name : "Chưa giao"}</div>
        </div>
        {idea.startDate && (
          <div>
            <div style={{ fontSize: 11, color: C.textFaint }}>Thời gian sản xuất</div>
            <div style={{ fontSize: 13, color: C.text, fontFamily: "var(--font-mono)" }}>{fmtDateFull(idea.startDate)} → {fmtDateFull(idea.endDate)}</div>
          </div>
        )}
        {idea.publishedLink && (
          <div>
            <div style={{ fontSize: 11, color: C.textFaint }}>Link sản phẩm</div>
            <a href={idea.publishedLink} target="_blank" rel="noreferrer" style={{ fontSize: 12.5, color: C.teal, wordBreak: "break-all" }}>{idea.publishedLink}</a>
          </div>
        )}
      </div>

      {idea.qaFeedback && (
        <div className="mb-4 p-3" style={{ background: C.redDim, border: `1px solid ${C.red}55`, borderRadius: 3 }}>
          <div style={{ fontSize: 11, color: C.red, fontWeight: 700, marginBottom: 2 }}>GHI CHÚ QA — CHƯA ĐẠT</div>
          <div style={{ fontSize: 13, color: C.text }}>{idea.qaFeedback}</div>
        </div>
      )}

      <div className="mb-4 p-3" style={{ background: C.bgSoft, borderRadius: 3, border: `1px solid ${C.borderSoft}` }}>
        <div style={{ fontSize: 11, color: C.textFaint, fontWeight: 700, marginBottom: 4, letterSpacing: 0.5 }}>GHI NHẬN ĐÓNG GÓP</div>
        <CreditRow icon={Lightbulb} label="Idea gốc" member={memberById[idea.credits.ideaBy]} />
        <CreditRow icon={PenLine} label="Viết kịch bản" member={memberById[idea.credits.scriptBy]} />
        <CreditRow icon={Scissors} label="Biên tập kịch bản" member={memberById[idea.credits.editedScriptBy]} />
        <CreditRow icon={ClapIcon} label="Sản xuất (quay/dựng)" member={memberById[idea.credits.producedBy]} />
        <CreditRow icon={ShieldCheck} label="Kiểm duyệt QA" member={memberById[idea.credits.qaBy]} />
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-2" style={{ borderTop: `1px solid ${C.borderSoft}` }}>
        {idea.status === "PITCH" && canApprove(actor.role) && <Btn tone="primary" onClick={() => onApprove(idea)}><CheckCircle2 size={14} /> Duyệt vào ASSIGNMENT</Btn>}
        {idea.status === "PITCH" && !canApprove(actor.role) && <span style={{ fontSize: 12, color: C.textFaint }}><Lock size={11} className="inline mb-0.5" /> Chỉ Core mới duyệt được idea</span>}

        {idea.status === "ASSIGNMENT" && canSubmitScript(actor, idea) && <Btn tone="primary" onClick={() => onSubmitScript(idea)}>Nộp kịch bản</Btn>}
        {idea.status === "ASSIGNMENT" && !canSubmitScript(actor, idea) && <span style={{ fontSize: 12, color: C.textFaint }}><Lock size={11} className="inline mb-0.5" /> Chờ {assignee?.name || "Producer"} nộp kịch bản</span>}

        {idea.status === "SCRIPT" && canStartProduction(actor, idea) && <Btn tone="primary" onClick={() => onStartProduction(idea)}>Bắt đầu sản xuất</Btn>}
        {idea.status === "SCRIPT" && !canStartProduction(actor, idea) && <span style={{ fontSize: 12, color: C.textFaint }}><Lock size={11} className="inline mb-0.5" /> Editor/Core xác nhận kịch bản xong</span>}

        {idea.status === "PRODUCTION" && canSubmitVideo(actor, idea) && <Btn tone="primary" onClick={() => onSubmitVideo(idea)}>Nộp video</Btn>}
        {idea.status === "PRODUCTION" && !canSubmitVideo(actor, idea) && <span style={{ fontSize: 12, color: C.textFaint }}><Lock size={11} className="inline mb-0.5" /> Chờ {assignee?.name || "Producer"} nộp video</span>}

        {idea.status === "QA" && canQA(actor) && (
          <>
            <Btn tone="primary" onClick={() => onQaPass(idea)}><CheckCircle2 size={14} /> Đạt</Btn>
            <Btn tone="danger" onClick={() => onQaFail(idea)}><XCircle size={14} /> Chưa đạt</Btn>
          </>
        )}
        {idea.status === "QA" && !canQA(actor) && <span style={{ fontSize: 12, color: C.textFaint }}><Lock size={11} className="inline mb-0.5" /> Chờ Editor/Core kiểm duyệt</span>}

        {idea.status === "COMPLETE" && <span style={{ fontSize: 12, color: C.green }}><CheckCircle2 size={13} className="inline mb-0.5" /> Đã khép quy trình</span>}

        <div className="flex-1" />
        {canDeleteIdea(actor, idea) && idea.status !== "COMPLETE" && (
          <Btn tone="ghost" onClick={() => onDelete(idea)}><Trash2 size={13} /> Xoá</Btn>
        )}
      </div>
    </Modal>
  );
}

/* ---------------------------------------------------------------------
   CHANNELS + GANTT VIEW
--------------------------------------------------------------------- */
function ChannelsGanttView({ channels, trashed, ideas, actor, ganttChannelId, setGanttChannelId, monthOffset, setMonthOffset, onNewChannel, onDeleteChannel, onRestoreChannel }) {
  const viewMonth = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
  const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
  const monthLabel = viewMonth.toLocaleDateString("vi-VN", { month: "long", year: "numeric" });
  const activeChannel = channels.find((c) => c.id === ganttChannelId) || channels[0];

  const channelIdeas = activeChannel ? ideas.filter((i) => i.channelId === activeChannel.id && i.startDate && i.endDate) : [];
  const monthStart = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
  const monthEnd = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), daysInMonth);
  const visibleIdeas = channelIdeas.filter((i) => {
    const s = new Date(i.startDate), e = new Date(i.endDate);
    return e >= monthStart && s <= monthEnd;
  });

  return (
    <div>
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: C.text }}>DỰ ÁN CON (KÊNH)</h2>
          <p style={{ color: C.textFaint, fontSize: 12 }}>Mỗi kênh có màu cố định · Gantt hiển thị theo tháng hiện tại</p>
        </div>
        {canManageChannels(actor) && <Btn tone="primary" onClick={onNewChannel}><Plus size={14} /> Tạo kênh</Btn>}
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {channels.map((c) => (
          <div key={c.id} className="flex items-center gap-2 pl-2.5 pr-1.5 py-1.5" style={{ background: C.panel, border: `1px solid ${ganttChannelId === c.id ? c.color : C.borderSoft}`, borderRadius: 3 }}>
            <button onClick={() => setGanttChannelId(c.id)} className="flex items-center gap-2">
              <span style={{ width: 9, height: 9, borderRadius: 9, background: c.color }} />
              <span style={{ fontSize: 13, color: C.text }}>{c.name}</span>
              <span style={{ fontSize: 10.5, color: C.textFaint }}>({ideas.filter((i) => i.channelId === c.id).length})</span>
            </button>
            {canManageChannels(actor) && (
              <button onClick={() => onDeleteChannel(c)} className="ml-1 hover:opacity-70" style={{ color: C.textFaint }}><Trash2 size={13} /></button>
            )}
          </div>
        ))}
        {channels.length === 0 && <span style={{ fontSize: 12.5, color: C.textFaint }}>Chưa có kênh nào.</span>}
      </div>

      {activeChannel && (
        <div style={{ background: C.panel, border: `1px solid ${C.borderSoft}`, borderRadius: 4 }}>
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${C.borderSoft}` }}>
            <div className="flex items-center gap-2">
              <span style={{ width: 10, height: 10, borderRadius: 10, background: activeChannel.color }} />
              <span style={{ fontFamily: "var(--font-display)", fontSize: 15, color: C.text }}>{activeChannel.name.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setMonthOffset(monthOffset - 1)} style={{ color: C.textMuted }}><ChevronLeft size={16} /></button>
              <span style={{ fontSize: 12.5, color: C.text, fontFamily: "var(--font-mono)", minWidth: 110, textAlign: "center", textTransform: "capitalize" }}>{monthLabel}</span>
              <button onClick={() => setMonthOffset(monthOffset + 1)} style={{ color: C.textMuted }}><ChevronRight size={16} /></button>
            </div>
          </div>
          <div className="p-4 overflow-x-auto">
            <div style={{ minWidth: daysInMonth * 26 + 140 }}>
              <div className="flex" style={{ marginLeft: 140 }}>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                  <div key={d} style={{ width: 26, textAlign: "center", fontSize: 9.5, color: C.textFaint, fontFamily: "var(--font-mono)" }}>{d}</div>
                ))}
              </div>
              {visibleIdeas.length === 0 && <div style={{ color: C.textFaint, fontSize: 12.5, padding: "16px 0" }}>Không có idea nào rơi vào tháng này.</div>}
              {visibleIdeas.map((idea) => {
                const s = new Date(idea.startDate), e = new Date(idea.endDate);
                const clampStart = s < monthStart ? monthStart : s;
                const clampEnd = e > monthEnd ? monthEnd : e;
                const offset = (clampStart.getDate() - 1) * 26;
                const width = Math.max(1, (clampEnd.getDate() - clampStart.getDate() + 1)) * 26 - 4;
                const od = overdueInfo(idea);
                return (
                  <div key={idea.id} className="flex items-center" style={{ marginTop: 8 }}>
                    <div style={{ width: 140, fontSize: 11.5, color: C.textMuted, paddingRight: 8, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{idea.title}</div>
                    <div style={{ position: "relative", flex: 1, height: 22 }}>
                      <div style={{
                        position: "absolute", left: offset, width, height: 22, borderRadius: 3,
                        background: activeChannel.color + "33", border: `1px solid ${od ? (od.level === "red" ? C.red : C.amber) : activeChannel.color}`,
                        display: "flex", alignItems: "center", paddingLeft: 6, overflow: "hidden",
                      }}>
                        <span style={{ fontSize: 9.5, color: C.text, fontFamily: "var(--font-mono)", whiteSpace: "nowrap" }}>{idea.platform} {STATUS_LABEL[idea.status]}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="mt-8">
        <div className="flex items-center gap-2 mb-3">
          <FolderOpen size={15} color={C.textFaint} />
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: 15, color: C.textMuted, letterSpacing: 0.4 }}>THÙNG RÁC</h3>
        </div>
        {trashed.length === 0 ? (
          <p style={{ fontSize: 12.5, color: C.textFaint }}>Trống.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {trashed.map((c) => (
              <div key={c.id} className="flex items-center gap-2 px-3 py-2" style={{ background: C.panel, border: `1px solid ${C.borderSoft}`, borderRadius: 3 }}>
                <span style={{ width: 8, height: 8, borderRadius: 8, background: c.color, opacity: 0.5 }} />
                <span style={{ fontSize: 12.5, color: C.textMuted }}>{c.name}</span>
                {canManageChannels(actor) && (
                  <button onClick={() => onRestoreChannel(c)} className="flex items-center gap-1 hover:opacity-70" style={{ color: C.teal, fontSize: 11.5 }}>
                    <RotateCcw size={12} /> Khôi phục
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   MEMBERS & LOG VIEW
--------------------------------------------------------------------- */
function MembersLogView({ members, ideas, channelById, actor, onAddMember, onRemoveMember }) {
  const log = ideas.filter((i) => STATUS_ORDER.indexOf(i.status) >= STATUS_ORDER.indexOf("ASSIGNMENT")).sort((a, b) => b.createdAt - a.createdAt);
  return (
    <div>
      <div className="flex items-start justify-between mb-4 flex-wrap gap-3">
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: C.text }}>THÀNH VIÊN</h2>
          <p style={{ color: C.textFaint, fontSize: 12 }}>Vai trò quyết định quyền hạn thao tác trên hệ thống</p>
        </div>
        {canManageMembers(actor) && <Btn tone="primary" onClick={onAddMember}><Plus size={14} /> Thêm thành viên</Btn>}
      </div>
      <div className="flex flex-wrap gap-2 mb-8">
        {members.map((m) => (
          <div key={m.id} className="flex items-center gap-2.5 px-3 py-2" style={{ background: C.panel, border: `1px solid ${C.borderSoft}`, borderRadius: 3 }}>
            <div style={{ width: 26, height: 26, borderRadius: 13, background: C.panelRaised, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 12, color: C.text }}>
              {m.name.charAt(0).toUpperCase()}
            </div>
            <span style={{ fontSize: 13, color: C.text }}>{m.name}</span>
            <RoleChip role={m.role} />
            {canManageMembers(actor) && (
              <button onClick={() => onRemoveMember(m)} className="ml-1 hover:opacity-70" style={{ color: C.textFaint }}><Trash2 size={12} /></button>
            )}
          </div>
        ))}
      </div>

      <h3 style={{ fontFamily: "var(--font-display)", fontSize: 17, color: C.text, marginBottom: 4 }}>NHẬT KÝ CÔNG VIỆC</h3>
      <p style={{ color: C.textFaint, fontSize: 12, marginBottom: 12 }}>Chỉ xem — mọi idea từ ASSIGNMENT trở đi, mới nhất lên đầu</p>
      <div style={{ border: `1px solid ${C.borderSoft}`, borderRadius: 4, overflow: "hidden" }}>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: C.panelRaised }}>
              {["Ý tưởng", "Kênh", "Nền tảng", "Phụ trách", "Trạng thái", "Hạn"].map((h) => (
                <th key={h} style={{ textAlign: "left", padding: "8px 12px", fontSize: 10.5, color: C.textFaint, fontFamily: "var(--font-mono)", letterSpacing: 0.5 }}>{h.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {log.map((i) => {
              const ch = channelById[i.channelId];
              const od = overdueInfo(i);
              return (
                <tr key={i.id} style={{ borderTop: `1px solid ${C.borderSoft}` }}>
                  <td style={{ padding: "9px 12px", fontSize: 13, color: C.text }}>{i.title}</td>
                  <td style={{ padding: "9px 12px", fontSize: 12.5, color: ch ? ch.color : C.textMuted }}>{ch ? ch.name : "—"}</td>
                  <td style={{ padding: "9px 12px", fontSize: 12.5, color: C.textMuted }}>{i.platform || "—"}</td>
                  <td style={{ padding: "9px 12px", fontSize: 12.5, color: C.textMuted }}>{members.find((m) => m.id === i.assignedTo)?.name || "—"}</td>
                  <td style={{ padding: "9px 12px" }}><Badge tone={i.status === "COMPLETE" ? "green" : od ? (od.level === "red" ? "red" : "amber") : "muted"}>{STATUS_LABEL[i.status]}</Badge></td>
                  <td style={{ padding: "9px 12px", fontSize: 11.5, color: C.textFaint, fontFamily: "var(--font-mono)" }}>{i.endDate ? fmtDate(i.endDate) : "—"}</td>
                </tr>
              );
            })}
            {log.length === 0 && (
              <tr><td colSpan={6} style={{ padding: "18px 12px", textAlign: "center", color: C.textFaint, fontSize: 12.5 }}>Chưa có idea nào được giao.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------
   PORTFOLIO VIEW
--------------------------------------------------------------------- */
const CREDIT_META = [
  { key: "ideaBy", label: "Idea gốc", icon: Lightbulb },
  { key: "scriptBy", label: "Viết kịch bản", icon: PenLine },
  { key: "editedScriptBy", label: "Biên tập kịch bản", icon: Scissors },
  { key: "producedBy", label: "Sản xuất", icon: ClapIcon },
  { key: "qaBy", label: "Kiểm duyệt QA", icon: ShieldCheck },
];

function PortfolioView({ members, ideas, channelById, selected, setSelected, showToast }) {
  const member = members.find((m) => m.id === selected) || members[0];
  const items = ideas.filter((i) => i.status === "COMPLETE" && i.publishedLink && Object.values(i.credits).includes(member?.id))
    .sort((a, b) => new Date(b.endDate) - new Date(a.endDate));

  function copyPortfolio() {
    const lines = [`${member.name.toUpperCase()} — ${ROLE_LABEL[member.role]}`, ""];
    items.forEach((i, idx) => {
      const ch = channelById[i.channelId];
      const roles = CREDIT_META.filter((cm) => i.credits[cm.key] === member.id).map((cm) => cm.label).join(", ");
      lines.push(`${idx + 1}. "${i.title}" — ${ch ? ch.name : "—"} — ${i.platform} — Hoàn thành ${fmtDateFull(i.endDate)}`);
      lines.push(`   Vai trò: ${roles}`);
      lines.push(`   Link: ${i.publishedLink}`);
      lines.push("");
    });
    const text = lines.join("\n");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => showToast("Đã copy portfolio vào clipboard"));
    } else {
      showToast("Trình duyệt không hỗ trợ copy tự động");
    }
  }

  if (!member) return <p style={{ color: C.textFaint }}>Chưa có thành viên nào.</p>;

  return (
    <div>
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: 20, color: C.text }}>PORTFOLIO CÁ NHÂN</h2>
          <p style={{ color: C.textFaint, fontSize: 12 }}>Tự động lọc từ Nhật ký — chỉ idea đã COMPLETE và có link đã đăng</p>
        </div>
        <Btn onClick={copyPortfolio}><Copy size={13} /> Copy nội dung</Btn>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {members.map((m) => (
          <button key={m.id} onClick={() => setSelected(m.id)}
            className="flex items-center gap-2 px-3 py-1.5"
            style={{ background: m.id === member.id ? C.tealDim : C.panel, border: `1px solid ${m.id === member.id ? C.teal : C.borderSoft}`, borderRadius: 20 }}>
            <span style={{ fontSize: 12.5, color: m.id === member.id ? C.teal : C.text }}>{m.name}</span>
            <RoleChip role={m.role} />
          </button>
        ))}
      </div>

      <div style={{ background: C.panel, border: `1px solid ${C.borderSoft}`, borderRadius: 4, padding: 20 }}>
        <div className="flex items-center gap-3 mb-1">
          <div style={{ width: 40, height: 40, borderRadius: 20, background: C.panelRaised, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--font-display)", fontSize: 17, color: C.text }}>
            {member.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 19, color: C.text }}>{member.name}</div>
            <RoleChip role={member.role} />
          </div>
        </div>

        {items.length === 0 ? (
          <p style={{ color: C.textFaint, fontSize: 13, marginTop: 16 }}>Chưa có sản phẩm nào hoàn thành kèm link đã đăng.</p>
        ) : (
          <div className="mt-5 flex flex-col gap-3">
            {items.map((i, idx) => {
              const ch = channelById[i.channelId];
              const roles = CREDIT_META.filter((cm) => i.credits[cm.key] === member.id);
              return (
                <div key={i.id} className="p-3.5" style={{ background: C.bgSoft, border: `1px solid ${C.borderSoft}`, borderLeft: `3px solid ${ch ? ch.color : C.border}`, borderRadius: 3 }}>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: C.textFaint }}>{idx + 1}.</span>
                      <span style={{ fontSize: 14.5, fontWeight: 600, color: C.text }}>{i.title}</span>
                    </div>
                    <span style={{ fontSize: 11, color: C.textFaint, fontFamily: "var(--font-mono)" }}>{ch?.name} · {i.platform} · {fmtDateFull(i.endDate)}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {roles.map((r) => (
                      <span key={r.key} className="inline-flex items-center gap-1 px-2 py-0.5" style={{ fontSize: 10.5, color: C.teal, border: `1px solid ${C.teal}44`, borderRadius: 3 }}>
                        <r.icon size={10} /> {r.label}
                      </span>
                    ))}
                  </div>
                  <a href={i.publishedLink} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-2" style={{ fontSize: 12, color: C.blue, wordBreak: "break-all" }}>
                    <LinkIcon size={11} /> {i.publishedLink}
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
