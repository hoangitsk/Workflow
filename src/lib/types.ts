export type Role = "Core" | "E" | "P";

export interface Member {
  id: string; // email
  name: string;
  role: Role;
  username?: string;
  phone?: string;
  facebook?: string;
  primaryExpertise?: string;
  secondaryExpertise?: string;
  active: boolean;
}

export type ReferenceType = "video" | "doc" | "drive" | "audio" | "image" | "other";

export interface ReferenceItem {
  url: string;
  title?: string;
  type?: ReferenceType;
}

export interface Platform {
  id: string;
  name: string;
  defaultDurationDays: number;
}

export interface ChannelGroup {
  id: string;
  name: string;
  color: string;
  archived: boolean;
  description?: string;
  referenceVideoLink?: string;
  videoFormat?: string;
  discordWebhookUrl?: string;
  topicBranch?: string;
}

export interface PlatformChannel {
  id: string;
  channelGroupId: string;
  platformId: string;
  externalName?: string;
  externalUrl?: string;
  externalChannelId?: string;
}

export type IdeaStatus = 
  | "PITCH" 
  | "ASSIGNMENT" 
  | "SCRIPT" 
  | "PRODUCTION" 
  | "QA" 
  | "CORE_REVIEW"
  | "READY_TO_PUBLISH"
  | "COMPLETE" 
  | "ARCHIVED_IDEA"
  | "CANCELLED";

export type ActiveGate =
  | "GATE_1_IDEA"
  | "GATE_2_SCRIPT"
  | "GATE_3_PRODUCTION"
  | "GATE_4_QC"
  | "GATE_5_CORE"
  | "READY_TO_PUBLISH"
  | "PUBLISHED";

export type ScriptStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REVISION_REQUESTED";
export type PlatformType = "YOUTUBE_MASTER" | "TIKTOK_CUTDOWN" | "FACEBOOK_REELS";
export type ChannelTier = "KENH_1_GIAO_DUC" | "KENH_2_TAM_LY";
export type DerivativeType = "NONE" | "TIKTOK_CUTDOWN" | "REELS_CUTDOWN";
export type CopyrightCheckStatus = "CHECKED_CLEAN" | "FAIR_USE" | "LICENSED" | "PENDING" | "RISK";

export interface ScriptSegmentRow {
  id: string;
  timeRange: string;
  segmentName: string;
  voiceAiText: string;
  visualMascotEdits: string;
  bgmSfxNotes: string;
}

export interface ScriptData {
  episodeName: string;
  channelTier: ChannelTier;
  writerProducerEmail: string;
  submissionDeadline: string;
  hook3Ws: {
    what: string;
    when: string;
    why: string;
  };
  segments: ScriptSegmentRow[];
  summaryCardNotes?: string;
  seamlessLoopQuestion?: string;
  copyrightCommitment: boolean;
  status: ScriptStatus;
  locked: boolean;
  revisionNotes?: string;
  updatedAt: string;
}

export interface Idea {
  id: string;
  title: string;
  description: string; // Nội dung
  logline?: string;
  referenceLinks?: string;
  angle?: string;
  keyMessage?: string;
  platformChannelId: string;
  submittedByEmail: string;
  status: IdeaStatus;
  durationDays: number;
  assignedToEmail: string;
  startDate?: string;
  endDate?: string;
  scriptLink?: string;
  videoLink?: string;
  publishedLink?: string;
  qaFeedback?: string;
  scheduledPostDate?: string;
  createdAt: string;
  assignedAt?: string;
  videoSubmittedAt?: string;
  
  creditsIdeaByEmail?: string;
  creditsScriptByEmail?: string;
  creditsEditedScriptByEmail?: string;
  creditsProducedByEmail?: string;
  creditsQaByEmail?: string;
  creditsApprovedByEmail?: string;
  
  cancelReason?: string;
  cancelledByEmail?: string;
  cancelledAt?: string;
  lastPitchWeek?: string;
  
  internalNote?: string;
  rating?: number;
  tags?: string;
  pitchingBatchId?: string;
  contentPillar?: string;

  // SOP Gating & Approvals (R2)
  activeGate?: ActiveGate;
  gate1ApprovedAt?: string;
  gate1ApprovedByEmail?: string;
  scriptStatus?: ScriptStatus;
  scriptLocked?: boolean;
  scriptRevisionNotes?: string;
  gate2ApprovedAt?: string;
  gate2ApprovedByEmail?: string;
  gate4ApprovedAt?: string;
  gate4ApprovedByEmail?: string;
  gate5ApprovedAt?: string;
  gate5ApprovedByEmail?: string;
  gate5ApprovedFinalUrl?: string;
  coreApprovalNotes?: string;

  // Script 4-Column Matrix & Copyright (R3)
  scriptData?: ScriptData;
  copyrightCommitment?: boolean;

  // Dual Checklists & TikTok Checklist (R4, R5)
  productionChecklist?: ChecklistItem[];
  qcChecklist?: ChecklistItem[];
  tiktokChecklist?: ChecklistItem[];

  // TikTok Derivative Workflow (R5)
  parentTaskId?: string;
  derivativeType?: DerivativeType;
  sourceVideoUrl?: string;
  tiktokTargetDuration?: string;
  tiktokReframeApplied?: boolean;
  tiktokHookSummary?: string;
  tiktokCtaRoute?: string;

  // Extended Lifecycle & Resource Links (R6)
  platformType?: PlatformType;
  channelTier?: ChannelTier;
  masterVideoLink?: string;
  assetFolderLink?: string;
  scriptDocLink?: string;
  videoDraftLink?: string;
  sourceProjectLink?: string;
  videoFinalLink?: string;
  deadlineScript?: string;
  deadlineProduction?: string;
  deadlineQc?: string;
  targetPublishDate?: string;
  copyrightFootage?: CopyrightCheckStatus;
  copyrightMusic?: CopyrightCheckStatus;
  copyrightMascot?: CopyrightCheckStatus;

  // Official Publish & Post-Publish Analytics Loop (R6, R2)
  publishedTitle?: string;
  publishedThumbnail?: string;
  publishedCaption?: string;
  publishedHashtags?: string;
  metricsViews?: number;
  metricsRetention?: string;
  metricsCtr?: string;
  metricsComments?: number;
  metricsInsights?: string;

  // Snake_case aliases for backward compatibility
  active_gate?: ActiveGate;
  script_status?: ScriptStatus;
  script_locked?: boolean;
  parent_task_id?: string;
  derivative_type?: DerivativeType;
  platform_type?: PlatformType;
  channel_tier?: ChannelTier;
}

export interface PitchingBatch {
  id: string;
  title: string;
  category?: string; // e.g. "Branding & Nhân vật", "News & Hot Trend", "Series Chuyên môn"
  description?: string;
  exampleAngles?: string; // Ví dụ gợi ý cách đào sâu
  deadline: string;
  channelGroupId?: string;
  createdByEmail: string;
  createdAt: string;
  status: "OPEN" | "CLOSED";
}

export interface CommentItem {
  id: string;
  ideaId: string;
  memberId: string;
  content: string;
  createdAt: string;
}

export interface AuditLogItem {
  id: string;
  ideaId: string;
  memberId: string;
  action: string;
  metadata?: string;
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  memberId: string;
  type: string;
  relatedIdeaId: string;
  message: string;
  read: boolean;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  checkedAt?: string;
  checkedByEmail?: string;
  name?: string;
  assignedToEmail?: string;
  dueDate?: string;
  status?: string;
  createdByEmail?: string;
}

export const DEFAULT_PRODUCTION_CHECKLIST: ChecklistItem[] = [
  { id: "prod_voice", label: "Voice rõ ràng, phát âm chuẩn, không tạp âm/nhiễu", checked: false },
  { id: "prod_footage", label: "Footage bám sát script và có ghi rõ nguồn tư liệu", checked: false },
  { id: "prod_bgm", label: "BGM & SFX đã kiểm tra quyền sử dụng, không vi phạm bản quyền", checked: false },
  { id: "prod_subtitle", label: "Subtitle đúng chính tả, nằm trong vùng an toàn (safe zone)", checked: false },
  { id: "prod_format", label: "Định dạng chuẩn master ngang YouTube 16:9 (2 - 5 phút)", checked: false },
  { id: "prod_metadata", label: "Có đề xuất thumbnail, title và caption/hashtag", checked: false },
  { id: "prod_source", label: "Đã xuất đầy đủ file source/project để Editor tiếp quản chỉnh sửa", checked: false }
];

export const DEFAULT_QC_CHECKLIST: ChecklistItem[] = [
  { id: "qc_hook", label: "Hook 3 giây đầu đủ mạnh để giữ chân người xem", checked: false },
  { id: "qc_alignment", label: "Nội dung bám sát Idea và Script đã duyệt", checked: false },
  { id: "qc_pacing", label: "Nhịp dựng có khoảng thở kỹ thuật, không dồn dập", checked: false },
  { id: "qc_audio", label: "Audio cân bằng âm lượng, voice nổi rõ trên nền BGM", checked: false },
  { id: "qc_branding", label: "Subtitle, font chữ, màu sắc và layout đồng bộ nhận diện thương hiệu", checked: false },
  { id: "qc_copyright", label: "Rủi ro bản quyền âm thanh/hình ảnh bằng 0", checked: false },
  { id: "qc_cta_loop", label: "CTA và seamless loop mượt mà, đúng định hướng", checked: false },
  { id: "qc_technical", label: "Video đạt chuẩn kỹ thuật YouTube trước khi trình Core duyệt", checked: false }
];

export const DEFAULT_TIKTOK_CHECKLIST: ChecklistItem[] = [
  { id: "tt_reframe", label: "Reframe bố cục dọc 9:16 chuyên nghiệp (không chỉ crop đơn thuần)", checked: false },
  { id: "tt_hook", label: "Hook mới xuất hiện ngay 0 - 3 giây đầu", checked: false },
  { id: "tt_subtitle", label: "Subtitle kích thước lớn, dễ đọc trên di động", checked: false },
  { id: "tt_cta", label: "CTA điều hướng rõ ràng về video đầy đủ trên YouTube và Cộng đồng Facebook", checked: false },
  { id: "tt_backlink", label: "Liên kết ngược ID/URL của video YouTube Master để đo lường tỷ lệ chuyển đổi", checked: false }
];

export interface AppSettings {
  discordWebhookUrl: string;
  discordIdeaWebhookUrl?: string;
  externalCalendarUrl: string;
  discordMuted?: boolean;
}
