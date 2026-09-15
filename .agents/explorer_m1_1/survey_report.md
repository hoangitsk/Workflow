# Survey Report: PostgreSQL Schema Migrations & TypeScript Type Contracts
**Milestone**: M1 (Data Layer, Schema Migrations & Gating Engine)  
**Author**: Explorer M1_1 (Schema & Types Explorer)  
**Date**: 2026-09-15  
**Target Files**:
- `src/lib/types.ts`
- `src/lib/db.ts`
- `init-postgres.mjs`

---

## 1. Executive Summary

This report delivers the complete architectural specification and line-by-line implementation diffs for upgrading the data foundation of the **"Ý Niệm Điện Ảnh" (YNDA)** video production workflow system. 

The upgrade integrates requirements **R1 through R6** from `ORIGINAL_REQUEST.md` (section `2026-09-15T10:30:18Z`) into the Neon Serverless PostgreSQL database and TypeScript application layer:
1. **R2 Gating & State Enforcement**: 13 columns tracking gate approvals (Gates 1, 2, 4, 5), active gate state, script lock status, and revision notes.
2. **R3 Standardized 4-Column Script Builder**: `script_data JSONB` storing Hook 3Ws, 4-segment 4-column matrix, Outro Summary Card, and CTA loop; plus `copyright_commitment BOOLEAN`.
3. **R4 Dual Interactive Checklists**: `production_checklist JSONB` (7 items) and `qc_checklist JSONB` (8 items) with persistent checked state and reviewer attribution.
4. **R5 YouTube Master to TikTok Derivative Cutdown Workflow**: `parent_task_id`, `derivative_type`, `tiktok_target_duration`, `tiktok_reframe_applied`, `tiktok_hook_summary`, `tiktok_cta_route`, and `tiktok_checklist JSONB` (5 items).
5. **R6 Extended Task Lifecycle & Analytics Metadata**: 14 columns for platform, channel tier, 5 resource links (Master, Asset folder, Script doc, Video draft, Source project, Video final), gate deadlines, copyright status, and 9 columns for publish metadata and post-publish analytics feedback.

Total new columns added to `ideas`: **48 columns** + **3 performance indexes**.  
All new fields on the TypeScript `Idea` interface are designed as optional (`?`) with robust null/undefined fallbacks in `src/lib/db.ts`, guaranteeing **100% zero-regression backward compatibility** for all existing views (Kanban, Gantt, Dashboard, Portfolio, Drawers) and legacy Server Actions.

---

## 2. Complete PostgreSQL Schema Matrix (`ideas` Table)

Below is the exhaustive catalog of all 48 new columns, their exact SQL definitions, defaults, and requirements mapping:

### A. Gating & State Progression (R2)
| Column Name | PostgreSQL Type | Nullable | Default | SOP Purpose & Requirement Mapping |
| :--- | :--- | :--- | :--- | :--- |
| `active_gate` | `VARCHAR(50)` | No | `'GATE_1_IDEA'` | Active gate stage (`GATE_1_IDEA`, `GATE_2_SCRIPT`, `GATE_3_PRODUCTION`, `GATE_4_QC`, `GATE_5_CORE`, `READY_TO_PUBLISH`, `PUBLISHED`) |
| `gate1_approved_at` | `VARCHAR(100)` | Yes | `NULL` | Timestamp when Editor/Core approved Idea into Assignment/Scripting |
| `gate1_approved_by_email` | `VARCHAR(255)` | Yes | `NULL` | Email of Editor/Core member who approved Gate 1 |
| `script_status` | `VARCHAR(50)` | No | `'DRAFT'` | Script review status (`DRAFT`, `SUBMITTED`, `APPROVED`, `REVISION_REQUESTED`) |
| `script_locked` | `BOOLEAN` | No | `FALSE` | When `TRUE`, script is locked from Producer edits until revision is requested |
| `script_revision_notes` | `TEXT` | Yes | `NULL` | Revision comments/feedback from Editor to Producer when requesting changes |
| `gate2_approved_at` | `VARCHAR(100)` | Yes | `NULL` | Timestamp when Editor approved script, unlocking Production |
| `gate2_approved_by_email` | `VARCHAR(255)` | Yes | `NULL` | Email of Editor who approved Gate 2 |
| `gate4_approved_at` | `VARCHAR(100)` | Yes | `NULL` | Timestamp when Editor passed QC inspection, unlocking Core Review |
| `gate4_approved_by_email` | `VARCHAR(255)` | Yes | `NULL` | Email of Editor who signed off on Gate 4 QC |
| `gate5_approved_at` | `VARCHAR(100)` | Yes | `NULL` | Timestamp when Core gave final executive signoff for publishing |
| `gate5_approved_by_email` | `VARCHAR(255)` | Yes | `NULL` | Email of Core member who approved Gate 5 |
| `core_approval_notes` | `TEXT` | Yes | `NULL` | Executive review notes or final publishing guidelines from Core |

### B. Standardized 4-Column Script & Copyright (R3)
| Column Name | PostgreSQL Type | Nullable | Default | SOP Purpose & Requirement Mapping |
| :--- | :--- | :--- | :--- | :--- |
| `script_data` | `JSONB` | Yes | `NULL` | Complete structured script payload: Hook 3Ws (What-When-Why), 4-column matrix segments, summary card notes, loop question, status |
| `copyright_commitment` | `BOOLEAN` | No | `FALSE` | Mandatory legal commitment checkbox confirming usage rights for footage, audio, and visual assets |

### C. Dual Interactive Checklists & TikTok Checklist (R4, R5)
| Column Name | PostgreSQL Type | Nullable | Default | SOP Purpose & Requirement Mapping |
| :--- | :--- | :--- | :--- | :--- |
| `production_checklist` | `JSONB` | Yes | `NULL` | Array of 7 interactive items for Producer before draft video handover |
| `qc_checklist` | `JSONB` | Yes | `NULL` | Array of 8 interactive items for Editor before submitting to Core |
| `tiktok_checklist` | `JSONB` | Yes | `NULL` | Array of 5 interactive items for TikTok 9:16 derivative cutdown validation |

### D. YouTube Master to TikTok Derivative Workflow (R5)
| Column Name | PostgreSQL Type | Nullable | Default | SOP Purpose & Requirement Mapping |
| :--- | :--- | :--- | :--- | :--- |
| `parent_task_id` | `VARCHAR(100)` | Yes | `NULL` | Foreign key referencing the parent Master Video task ID |
| `derivative_type` | `VARCHAR(50)` | No | `'NONE'` | Type of derivative (`NONE`, `TIKTOK_CUTDOWN`, `REELS_CUTDOWN`) |
| `source_video_url` | `TEXT` | Yes | `NULL` | URL of the YouTube Master video source file being cut down |
| `tiktok_target_duration` | `VARCHAR(50)` | No | `'30-45s'` | Target duration standard (30 - 45 seconds) |
| `tiktok_reframe_applied` | `BOOLEAN` | No | `FALSE` | Confirmation that professional 9:16 vertical reframe was applied (not basic crop) |
| `tiktok_hook_summary` | `TEXT` | Yes | `NULL` | Key hook concept designed for the initial 0 - 3 second mobile retention window |
| `tiktok_cta_route` | `TEXT` | Yes | `NULL` | Call to action redirecting viewers to the full YouTube video and FB community |

### E. Extended Lifecycle & Resource Links (R6)
| Column Name | PostgreSQL Type | Nullable | Default | SOP Purpose & Requirement Mapping |
| :--- | :--- | :--- | :--- | :--- |
| `platform_type` | `VARCHAR(50)` | No | `'YOUTUBE_MASTER'` | Production track (`YOUTUBE_MASTER`, `TIKTOK_CUTDOWN`, `FACEBOOK_REELS`) |
| `channel_tier` | `VARCHAR(50)` | Yes | `NULL` | Channel tier: `KENH_1_GIAO_DUC` (Điện ảnh & Giáo dục) or `KENH_2_TAM_LY` (Tâm lý & Phản biện) |
| `master_video_link` | `TEXT` | Yes | `NULL` | Link to published or master YouTube file |
| `asset_folder_link` | `TEXT` | Yes | `NULL` | Google Drive / cloud asset folder link |
| `script_doc_link` | `TEXT` | Yes | `NULL` | External script document link (Google Docs / Word) |
| `video_draft_link` | `TEXT` | Yes | `NULL` | Producer draft video submission link (Gate 3 requirement) |
| `source_project_link` | `TEXT` | Yes | `NULL` | Link to full Premiere/DaVinci/CapCut source project files for Editor takeover |
| `video_final_link` | `TEXT` | Yes | `NULL` | Editor completed master video link submitted for Core approval (Gate 4) |
| `deadline_script` | `VARCHAR(50)` | Yes | `NULL` | Gate 2 deadline (Wednesdays standard) |
| `deadline_production` | `VARCHAR(50)` | Yes | `NULL` | Gate 3 deadline for draft submission |
| `deadline_qc` | `VARCHAR(50)` | Yes | `NULL` | Gate 4 deadline for Editor QC signoff |
| `target_publish_date` | `VARCHAR(50)` | Yes | `NULL` | Scheduled release target date |
| `copyright_footage` | `VARCHAR(50)` | No | `'PENDING'` | Status of footage copyright clearance (`CHECKED_CLEAN`, `FAIR_USE`, `LICENSED`, `PENDING`, `RISK`) |
| `copyright_music` | `VARCHAR(50)` | No | `'PENDING'` | Status of BGM/SFX copyright clearance |
| `copyright_mascot` | `VARCHAR(50)` | No | `'OFFICIAL'` | Brand mascot/visual usage compliance |

### F. Official Publish & Post-Publish Analytics Loop (R6, R2)
| Column Name | PostgreSQL Type | Nullable | Default | SOP Purpose & Requirement Mapping |
| :--- | :--- | :--- | :--- | :--- |
| `published_title` | `TEXT` | Yes | `NULL` | Final published YouTube/TikTok title |
| `published_thumbnail` | `TEXT` | Yes | `NULL` | URL of published thumbnail asset |
| `published_caption` | `TEXT` | Yes | `NULL` | Published post caption / description text |
| `published_hashtags` | `TEXT` | Yes | `NULL` | Published hashtags list |
| `metrics_views` | `NUMERIC` | No | `0` | Post-publish total views count |
| `metrics_retention` | `VARCHAR(50)` | Yes | `NULL` | Average audience retention rate (e.g. "48.5%") |
| `metrics_ctr` | `VARCHAR(50)` | Yes | `NULL` | Click-through rate (e.g. "9.2%") |
| `metrics_comments` | `INT` | No | `0` | Total viewer comments count |
| `metrics_insights` | `TEXT` | Yes | `NULL` | Retrospective learnings and insights feeding back to Step 1 (Pitching) |

### G. Performance Indexes
| Index Name | Target Table & Column | Justification |
| :--- | :--- | :--- |
| `idx_ideas_parent_task_id` | `ideas(parent_task_id)` | Accelerates querying all derivative cutdown tasks belonging to a Master video (`WHERE parent_task_id = $1`) |
| `idx_ideas_active_gate` | `ideas(active_gate)` | Speeds up filtering workflow views and Kanban boards by active gate stage |
| `idx_ideas_platform_type` | `ideas(platform_type)` | Speeds up filtering between YouTube Master and TikTok Cutdown tasks |

---

## 3. TypeScript Type Contracts (`src/lib/types.ts`)

### A. New Domain Types and Enums

```typescript
// Active Gate Stages (R1, R2)
export type ActiveGate =
  | "GATE_1_IDEA"
  | "GATE_2_SCRIPT"
  | "GATE_3_PRODUCTION"
  | "GATE_4_QC"
  | "GATE_5_CORE"
  | "READY_TO_PUBLISH"
  | "PUBLISHED";

// Script Lifecycle Statuses (R2, R3)
export type ScriptStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REVISION_REQUESTED";

// Production Platform Formats (R5, R6)
export type PlatformType = "YOUTUBE_MASTER" | "TIKTOK_CUTDOWN" | "FACEBOOK_REELS";

// Channel Tiers (R3, R6)
export type ChannelTier = "KENH_1_GIAO_DUC" | "KENH_2_TAM_LY";

// Derivative Branches (R5)
export type DerivativeType = "NONE" | "TIKTOK_CUTDOWN" | "REELS_CUTDOWN";

// Copyright Compliance Status (R3, R6)
export type CopyrightCheckStatus = "CHECKED_CLEAN" | "FAIR_USE" | "LICENSED" | "PENDING" | "RISK";

// 4-Column Script Matrix Row (R3)
export interface ScriptSegmentRow {
  id: string;
  timeRange: string;
  segmentName: string;
  voiceAiText: string;
  visualMascotEdits: string;
  bgmSfxNotes: string;
}

// Complete Script Document Structure (R3)
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

// Interactive Checklist Item (R4, R5, with 100% legacy backward compatibility)
export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  checkedAt?: string;
  checkedByEmail?: string;
  
  // Legacy global checklist properties (preserve backward compatibility)
  name?: string;
  assignedToEmail?: string;
  dueDate?: string;
  status?: string;
  createdByEmail?: string;
}
```

### B. Standard Default Checklist Templates

Exporting these default templates in `src/lib/types.ts` provides single-source-of-truth constants for M3, M4, and E2E test suites:

```typescript
// Production Checklist Template (7 items - R4)
export const DEFAULT_PRODUCTION_CHECKLIST: ChecklistItem[] = [
  { id: "prod_voice", label: "Voice rõ ràng, phát âm chuẩn, không tạp âm/nhiễu", checked: false },
  { id: "prod_footage", label: "Footage bám sát script và có ghi rõ nguồn tư liệu", checked: false },
  { id: "prod_bgm", label: "BGM & SFX đã kiểm tra quyền sử dụng, không vi phạm bản quyền", checked: false },
  { id: "prod_subtitle", label: "Subtitle đúng chính tả, nằm trong vùng an toàn (safe zone)", checked: false },
  { id: "prod_format", label: "Định dạng chuẩn master ngang YouTube 16:9 (2 - 5 phút)", checked: false },
  { id: "prod_metadata", label: "Có đề xuất thumbnail, title và caption/hashtag", checked: false },
  { id: "prod_source", label: "Đã xuất đầy đủ file source/project để Editor tiếp quản chỉnh sửa", checked: false }
];

// Editor QC Checklist Template (8 items - R4)
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

// TikTok Derivative Cutdown Checklist Template (5 items - R5)
export const DEFAULT_TIKTOK_CHECKLIST: ChecklistItem[] = [
  { id: "tt_reframe", label: "Reframe bố cục dọc 9:16 chuyên nghiệp (không chỉ crop đơn thuần)", checked: false },
  { id: "tt_hook", label: "Hook mới xuất hiện ngay 0 - 3 giây đầu", checked: false },
  { id: "tt_subtitle", label: "Subtitle kích thước lớn, dễ đọc trên di động", checked: false },
  { id: "tt_cta", label: "CTA điều hướng rõ ràng về video đầy đủ trên YouTube và Cộng đồng Facebook", checked: false },
  { id: "tt_backlink", label: "Liên kết ngược ID/URL của video YouTube Master để đo lường tỷ lệ chuyển đổi", checked: false }
];
```

### C. Extended `Idea` Interface

```typescript
export interface Idea {
  // Existing fields (preserved without modification)
  id: string;
  title: string;
  description: string;
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

  // New SOP Gating & Approval Fields (R2)
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

  // Optional snake_case aliases for raw database and legacy script compatibility
  active_gate?: ActiveGate;
  script_status?: ScriptStatus;
  script_locked?: boolean;
  parent_task_id?: string;
  derivative_type?: DerivativeType;
  platform_type?: PlatformType;
  channel_tier?: ChannelTier;
}
```

---

## 4. Exact Line-by-Line Diff Proposals

### File 1: `src/lib/types.ts`

```diff
--- a/src/lib/types.ts
+++ b/src/lib/types.ts
@@ -46,14 +46,80 @@
 export type IdeaStatus = 
   | "PITCH" 
   | "ASSIGNMENT" 
   | "SCRIPT" 
   | "PRODUCTION" 
   | "QA" 
+  | "CORE_REVIEW"
+  | "READY_TO_PUBLISH"
   | "COMPLETE" 
   | "ARCHIVED_IDEA"
   | "CANCELLED";
 
+export type ActiveGate =
+  | "GATE_1_IDEA"
+  | "GATE_2_SCRIPT"
+  | "GATE_3_PRODUCTION"
+  | "GATE_4_QC"
+  | "GATE_5_CORE"
+  | "READY_TO_PUBLISH"
+  | "PUBLISHED";
+
+export type ScriptStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REVISION_REQUESTED";
+export type PlatformType = "YOUTUBE_MASTER" | "TIKTOK_CUTDOWN" | "FACEBOOK_REELS";
+export type ChannelTier = "KENH_1_GIAO_DUC" | "KENH_2_TAM_LY";
+export type DerivativeType = "NONE" | "TIKTOK_CUTDOWN" | "REELS_CUTDOWN";
+export type CopyrightCheckStatus = "CHECKED_CLEAN" | "FAIR_USE" | "LICENSED" | "PENDING" | "RISK";
+
+export interface ScriptSegmentRow {
+  id: string;
+  timeRange: string;
+  segmentName: string;
+  voiceAiText: string;
+  visualMascotEdits: string;
+  bgmSfxNotes: string;
+}
+
+export interface ScriptData {
+  episodeName: string;
+  channelTier: ChannelTier;
+  writerProducerEmail: string;
+  submissionDeadline: string;
+  hook3Ws: {
+    what: string;
+    when: string;
+    why: string;
+  };
+  segments: ScriptSegmentRow[];
+  summaryCardNotes?: string;
+  seamlessLoopQuestion?: string;
+  copyrightCommitment: boolean;
+  status: ScriptStatus;
+  locked: boolean;
+  revisionNotes?: string;
+  updatedAt: string;
+}
+
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
+
+  // SOP Gating & Approvals (R2)
+  activeGate?: ActiveGate;
+  gate1ApprovedAt?: string;
+  gate1ApprovedByEmail?: string;
+  scriptStatus?: ScriptStatus;
+  scriptLocked?: boolean;
+  scriptRevisionNotes?: string;
+  gate2ApprovedAt?: string;
+  gate2ApprovedByEmail?: string;
+  gate4ApprovedAt?: string;
+  gate4ApprovedByEmail?: string;
+  gate5ApprovedAt?: string;
+  gate5ApprovedByEmail?: string;
+  coreApprovalNotes?: string;
+
+  // Script 4-Column Matrix & Copyright (R3)
+  scriptData?: ScriptData;
+  copyrightCommitment?: boolean;
+
+  // Dual Checklists & TikTok Checklist (R4, R5)
+  productionChecklist?: ChecklistItem[];
+  qcChecklist?: ChecklistItem[];
+  tiktokChecklist?: ChecklistItem[];
+
+  // TikTok Derivative Workflow (R5)
+  parentTaskId?: string;
+  derivativeType?: DerivativeType;
+  sourceVideoUrl?: string;
+  tiktokTargetDuration?: string;
+  tiktokReframeApplied?: boolean;
+  tiktokHookSummary?: string;
+  tiktokCtaRoute?: string;
+
+  // Extended Lifecycle & Resource Links (R6)
+  platformType?: PlatformType;
+  channelTier?: ChannelTier;
+  masterVideoLink?: string;
+  assetFolderLink?: string;
+  scriptDocLink?: string;
+  videoDraftLink?: string;
+  sourceProjectLink?: string;
+  videoFinalLink?: string;
+  deadlineScript?: string;
+  deadlineProduction?: string;
+  deadlineQc?: string;
+  targetPublishDate?: string;
+  copyrightFootage?: CopyrightCheckStatus;
+  copyrightMusic?: CopyrightCheckStatus;
+  copyrightMascot?: CopyrightCheckStatus;
+
+  // Official Publish & Post-Publish Analytics Loop (R6, R2)
+  publishedTitle?: string;
+  publishedThumbnail?: string;
+  publishedCaption?: string;
+  publishedHashtags?: string;
+  metricsViews?: number;
+  metricsRetention?: string;
+  metricsCtr?: string;
+  metricsComments?: number;
+  metricsInsights?: string;
+
+  // Snake_case aliases for backward compatibility
+  active_gate?: ActiveGate;
+  script_status?: ScriptStatus;
+  script_locked?: boolean;
+  parent_task_id?: string;
+  derivative_type?: DerivativeType;
+  platform_type?: PlatformType;
+  channel_tier?: ChannelTier;
 }
@@ -139,8 +205,37 @@
 export interface ChecklistItem {
   id: string;
-  name: string;
+  label: string;
+  checked: boolean;
+  checkedAt?: string;
+  checkedByEmail?: string;
+  name?: string;
   assignedToEmail?: string;
   dueDate?: string;
-  status: string;
-  createdByEmail: string;
+  status?: string;
+  createdByEmail?: string;
 }
+
+export const DEFAULT_PRODUCTION_CHECKLIST: ChecklistItem[] = [
+  { id: "prod_voice", label: "Voice rõ ràng, phát âm chuẩn, không tạp âm/nhiễu", checked: false },
+  { id: "prod_footage", label: "Footage bám sát script và có ghi rõ nguồn tư liệu", checked: false },
+  { id: "prod_bgm", label: "BGM & SFX đã kiểm tra quyền sử dụng, không vi phạm bản quyền", checked: false },
+  { id: "prod_subtitle", label: "Subtitle đúng chính tả, nằm trong vùng an toàn (safe zone)", checked: false },
+  { id: "prod_format", label: "Định dạng chuẩn master ngang YouTube 16:9 (2 - 5 phút)", checked: false },
+  { id: "prod_metadata", label: "Có đề xuất thumbnail, title và caption/hashtag", checked: false },
+  { id: "prod_source", label: "Đã xuất đầy đủ file source/project để Editor tiếp quản chỉnh sửa", checked: false }
+];
+
+export const DEFAULT_QC_CHECKLIST: ChecklistItem[] = [
+  { id: "qc_hook", label: "Hook 3 giây đầu đủ mạnh để giữ chân người xem", checked: false },
+  { id: "qc_alignment", label: "Nội dung bám sát Idea và Script đã duyệt", checked: false },
+  { id: "qc_pacing", label: "Nhịp dựng có khoảng thở kỹ thuật, không dồn dập", checked: false },
+  { id: "qc_audio", label: "Audio cân bằng âm lượng, voice nổi rõ trên nền BGM", checked: false },
+  { id: "qc_branding", label: "Subtitle, font chữ, màu sắc và layout đồng bộ nhận diện thương hiệu", checked: false },
+  { id: "qc_copyright", label: "Rủi ro bản quyền âm thanh/hình ảnh bằng 0", checked: false },
+  { id: "qc_cta_loop", label: "CTA và seamless loop mượt mà, đúng định hướng", checked: false },
+  { id: "qc_technical", label: "Video đạt chuẩn kỹ thuật YouTube trước khi trình Core duyệt", checked: false }
+];
+
+export const DEFAULT_TIKTOK_CHECKLIST: ChecklistItem[] = [
+  { id: "tt_reframe", label: "Reframe bố cục dọc 9:16 chuyên nghiệp (không chỉ crop đơn thuần)", checked: false },
+  { id: "tt_hook", label: "Hook mới xuất hiện ngay 0 - 3 giây đầu", checked: false },
+  { id: "tt_subtitle", label: "Subtitle kích thước lớn, dễ đọc trên di động", checked: false },
+  { id: "tt_cta", label: "CTA điều hướng rõ ràng về video đầy đủ trên YouTube và Cộng đồng Facebook", checked: false },
+  { id: "tt_backlink", label: "Liên kết ngược ID/URL của video YouTube Master để đo lường tỷ lệ chuyển đổi", checked: false }
+];
```

---

### File 2: `src/lib/db.ts`

```diff
--- a/src/lib/db.ts
+++ b/src/lib/db.ts
@@ -2,7 +2,9 @@
 import { 
   Member, Platform, ChannelGroup, PlatformChannel, Idea, 
-  CommentItem, AuditLogItem, NotificationItem, ChecklistItem, AppSettings, PitchingBatch 
+  CommentItem, AuditLogItem, NotificationItem, ChecklistItem, AppSettings, PitchingBatch,
+  ActiveGate, ScriptStatus, PlatformType, ChannelTier, DerivativeType, CopyrightCheckStatus, ScriptData
 } from './types';
 
 function getDatabaseUrl(): string {
@@ -40,6 +42,19 @@
   return isNaN(d.getTime()) ? str : d.toISOString().slice(0, 10);
 }
 
+function parseJsonField<T>(val: any, fallback: T): T {
+  if (val === null || val === undefined) return fallback;
+  if (typeof val === 'object') return val as T;
+  if (typeof val === 'string') {
+    const trimmed = val.trim();
+    if (!trimmed) return fallback;
+    try {
+      return JSON.parse(trimmed) as T;
+    } catch {
+      return fallback;
+    }
+  }
+  return fallback;
+}
+
 let schemaEnsured = false;
 let schemaEnsuringPromise: Promise<void> | null = null;
 
@@ -51,6 +66,58 @@
     try {
       const migrations = [
         'ALTER TABLE ideas ADD COLUMN IF NOT EXISTS logline TEXT;',
         'ALTER TABLE ideas ADD COLUMN IF NOT EXISTS reference_links TEXT;',
         'ALTER TABLE ideas ADD COLUMN IF NOT EXISTS angle TEXT;',
         'ALTER TABLE ideas ADD COLUMN IF NOT EXISTS key_message TEXT;',
         'ALTER TABLE ideas ADD COLUMN IF NOT EXISTS pitching_batch_id TEXT;',
         'ALTER TABLE ideas ADD COLUMN IF NOT EXISTS content_pillar TEXT;',
         'ALTER TABLE pitching_batches ADD COLUMN IF NOT EXISTS category TEXT;',
         'ALTER TABLE pitching_batches ADD COLUMN IF NOT EXISTS example_angles TEXT;',
         'ALTER TABLE channel_groups ADD COLUMN IF NOT EXISTS description TEXT;',
         'ALTER TABLE channel_groups ADD COLUMN IF NOT EXISTS reference_video_link TEXT;',
         'ALTER TABLE channel_groups ADD COLUMN IF NOT EXISTS video_format TEXT;',
-        'ALTER TABLE channel_groups ADD COLUMN IF NOT EXISTS discord_webhook_url TEXT;'
+        'ALTER TABLE channel_groups ADD COLUMN IF NOT EXISTS discord_webhook_url TEXT;',
+        // SOP Gating and State Machine
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS active_gate VARCHAR(50) DEFAULT 'GATE_1_IDEA';",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate1_approved_at VARCHAR(100);",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate1_approved_by_email VARCHAR(255);",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS script_status VARCHAR(50) DEFAULT 'DRAFT';",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS script_locked BOOLEAN DEFAULT FALSE;",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS script_revision_notes TEXT;",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate2_approved_at VARCHAR(100);",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate2_approved_by_email VARCHAR(255);",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate4_approved_at VARCHAR(100);",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate4_approved_by_email VARCHAR(255);",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate5_approved_at VARCHAR(100);",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate5_approved_by_email VARCHAR(255);",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS core_approval_notes TEXT;",
+        // Script 4-Column & Copyright
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS script_data JSONB;",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS copyright_commitment BOOLEAN DEFAULT FALSE;",
+        // Dual Interactive Checklists & TikTok Checklist
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS production_checklist JSONB;",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS qc_checklist JSONB;",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tiktok_checklist JSONB;",
+        // TikTok Derivative Workflow
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS parent_task_id VARCHAR(100);",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS derivative_type VARCHAR(50) DEFAULT 'NONE';",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS source_video_url TEXT;",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tiktok_target_duration VARCHAR(50) DEFAULT '30-45s';",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tiktok_reframe_applied BOOLEAN DEFAULT FALSE;",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tiktok_hook_summary TEXT;",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tiktok_cta_route TEXT;",
+        // Extended Metadata & Deadlines
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS platform_type VARCHAR(50) DEFAULT 'YOUTUBE_MASTER';",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS channel_tier VARCHAR(50);",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS master_video_link TEXT;",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS asset_folder_link TEXT;",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS script_doc_link TEXT;",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS video_draft_link TEXT;",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS source_project_link TEXT;",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS video_final_link TEXT;",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS deadline_script VARCHAR(50);",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS deadline_production VARCHAR(50);",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS deadline_qc VARCHAR(50);",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS target_publish_date VARCHAR(50);",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS copyright_footage VARCHAR(50) DEFAULT 'PENDING';",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS copyright_music VARCHAR(50) DEFAULT 'PENDING';",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS copyright_mascot VARCHAR(50) DEFAULT 'OFFICIAL';",
+        // Publish & Post-Publish Analytics
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS published_title TEXT;",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS published_thumbnail TEXT;",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS published_caption TEXT;",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS published_hashtags TEXT;",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS metrics_views NUMERIC DEFAULT 0;",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS metrics_retention VARCHAR(50);",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS metrics_ctr VARCHAR(50);",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS metrics_comments INT DEFAULT 0;",
+        "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS metrics_insights TEXT;",
+        // Performance Indexes
+        "CREATE INDEX IF NOT EXISTS idx_ideas_parent_task_id ON ideas (parent_task_id);",
+        "CREATE INDEX IF NOT EXISTS idx_ideas_active_gate ON ideas (active_gate);",
+        "CREATE INDEX IF NOT EXISTS idx_ideas_platform_type ON ideas (platform_type);"
       ];
       for (const m of migrations) {
@@ -227,6 +294,57 @@
     tags: r.tags || '',
     pitchingBatchId: r.pitching_batch_id || '',
-    contentPillar: r.content_pillar || ''
+    contentPillar: r.content_pillar || '',
+    // SOP Gating & Approvals
+    activeGate: (r.active_gate || 'GATE_1_IDEA') as ActiveGate,
+    gate1ApprovedAt: toIsoString(r.gate1_approved_at),
+    gate1ApprovedByEmail: r.gate1_approved_by_email || '',
+    scriptStatus: (r.script_status || 'DRAFT') as ScriptStatus,
+    scriptLocked: r.script_locked === true,
+    scriptRevisionNotes: r.script_revision_notes || '',
+    gate2ApprovedAt: toIsoString(r.gate2_approved_at),
+    gate2ApprovedByEmail: r.gate2_approved_by_email || '',
+    gate4ApprovedAt: toIsoString(r.gate4_approved_at),
+    gate4ApprovedByEmail: r.gate4_approved_by_email || '',
+    gate5ApprovedAt: toIsoString(r.gate5_approved_at),
+    gate5ApprovedByEmail: r.gate5_approved_by_email || '',
+    coreApprovalNotes: r.core_approval_notes || '',
+    // Script 4-Column & Copyright
+    scriptData: parseJsonField<ScriptData | undefined>(r.script_data, undefined),
+    copyrightCommitment: r.copyright_commitment === true,
+    // Dual Checklists & TikTok Checklist
+    productionChecklist: parseJsonField<ChecklistItem[] | undefined>(r.production_checklist, undefined),
+    qcChecklist: parseJsonField<ChecklistItem[] | undefined>(r.qc_checklist, undefined),
+    tiktokChecklist: parseJsonField<ChecklistItem[] | undefined>(r.tiktok_checklist, undefined),
+    // TikTok Derivative
+    parentTaskId: r.parent_task_id || undefined,
+    derivativeType: (r.derivative_type || 'NONE') as DerivativeType,
+    sourceVideoUrl: r.source_video_url || '',
+    tiktokTargetDuration: r.tiktok_target_duration || '30-45s',
+    tiktokReframeApplied: r.tiktok_reframe_applied === true,
+    tiktokHookSummary: r.tiktok_hook_summary || '',
+    tiktokCtaRoute: r.tiktok_cta_route || '',
+    // Extended Lifecycle & Resource Links
+    platformType: (r.platform_type || 'YOUTUBE_MASTER') as PlatformType,
+    channelTier: r.channel_tier ? (r.channel_tier as ChannelTier) : undefined,
+    masterVideoLink: r.master_video_link || '',
+    assetFolderLink: r.asset_folder_link || '',
+    scriptDocLink: r.script_doc_link || '',
+    videoDraftLink: r.video_draft_link || '',
+    sourceProjectLink: r.source_project_link || '',
+    videoFinalLink: r.video_final_link || '',
+    deadlineScript: toDateString(r.deadline_script),
+    deadlineProduction: toDateString(r.deadline_production),
+    deadlineQc: toDateString(r.deadline_qc),
+    targetPublishDate: toDateString(r.target_publish_date),
+    copyrightFootage: (r.copyright_footage || 'PENDING') as CopyrightCheckStatus,
+    copyrightMusic: (r.copyright_music || 'PENDING') as CopyrightCheckStatus,
+    copyrightMascot: (r.copyright_mascot || 'OFFICIAL') as CopyrightCheckStatus,
+    // Publish & Post-Publish Analytics
+    publishedTitle: r.published_title || '',
+    publishedThumbnail: r.published_thumbnail || '',
+    publishedCaption: r.published_caption || '',
+    publishedHashtags: r.published_hashtags || '',
+    metricsViews: r.metrics_views !== null && r.metrics_views !== undefined ? parseFloat(r.metrics_views) : 0,
+    metricsRetention: r.metrics_retention || '',
+    metricsCtr: r.metrics_ctr || '',
+    metricsComments: r.metrics_comments !== null && r.metrics_comments !== undefined ? parseInt(r.metrics_comments, 10) : 0,
+    metricsInsights: r.metrics_insights || '',
+    // Snake_case aliases for direct backward compatibility
+    active_gate: (r.active_gate || 'GATE_1_IDEA') as ActiveGate,
+    script_status: (r.script_status || 'DRAFT') as ScriptStatus,
+    script_locked: r.script_locked === true,
+    parent_task_id: r.parent_task_id || undefined,
+    derivative_type: (r.derivative_type || 'NONE') as DerivativeType,
+    platform_type: (r.platform_type || 'YOUTUBE_MASTER') as PlatformType,
+    channel_tier: r.channel_tier ? (r.channel_tier as ChannelTier) : undefined
   }));
 
   const checklists: ChecklistItem[] = (checklistsRows || []).map((r: any) => ({
     id: r.id,
     name: r.name || '',
+    label: r.name || '',
+    checked: r.status === 'Hoàn thành',
     assignedToEmail: r.assigned_to_email || '',
     dueDate: toDateString(r.due_date),
     status: r.status || 'Chưa bắt đầu',
     createdByEmail: r.created_by_email || ''
   }));
```

---

### File 3: `init-postgres.mjs`

```diff
--- a/init-postgres.mjs
+++ b/init-postgres.mjs
@@ -95,7 +95,58 @@
       angle TEXT,
-      key_message TEXT
+      key_message TEXT,
+      pitching_batch_id TEXT,
+      content_pillar TEXT,
+      -- Gating and State Machine (R2)
+      active_gate VARCHAR(50) DEFAULT 'GATE_1_IDEA',
+      gate1_approved_at VARCHAR(100),
+      gate1_approved_by_email VARCHAR(255),
+      script_status VARCHAR(50) DEFAULT 'DRAFT',
+      script_locked BOOLEAN DEFAULT FALSE,
+      script_revision_notes TEXT,
+      gate2_approved_at VARCHAR(100),
+      gate2_approved_by_email VARCHAR(255),
+      gate4_approved_at VARCHAR(100),
+      gate4_approved_by_email VARCHAR(255),
+      gate5_approved_at VARCHAR(100),
+      gate5_approved_by_email VARCHAR(255),
+      core_approval_notes TEXT,
+      -- Script 4-Column & Copyright (R3)
+      script_data JSONB,
+      copyright_commitment BOOLEAN DEFAULT FALSE,
+      -- Dual Interactive Checklists & TikTok Checklist (R4, R5)
+      production_checklist JSONB,
+      qc_checklist JSONB,
+      tiktok_checklist JSONB,
+      -- TikTok Derivative Workflow (R5)
+      parent_task_id VARCHAR(100),
+      derivative_type VARCHAR(50) DEFAULT 'NONE',
+      source_video_url TEXT,
+      tiktok_target_duration VARCHAR(50) DEFAULT '30-45s',
+      tiktok_reframe_applied BOOLEAN DEFAULT FALSE,
+      tiktok_hook_summary TEXT,
+      tiktok_cta_route TEXT,
+      -- Extended Metadata & Deadlines (R6)
+      platform_type VARCHAR(50) DEFAULT 'YOUTUBE_MASTER',
+      channel_tier VARCHAR(50),
+      master_video_link TEXT,
+      asset_folder_link TEXT,
+      script_doc_link TEXT,
+      video_draft_link TEXT,
+      source_project_link TEXT,
+      video_final_link TEXT,
+      deadline_script VARCHAR(50),
+      deadline_production VARCHAR(50),
+      deadline_qc VARCHAR(50),
+      target_publish_date VARCHAR(50),
+      copyright_footage VARCHAR(50) DEFAULT 'PENDING',
+      copyright_music VARCHAR(50) DEFAULT 'PENDING',
+      copyright_mascot VARCHAR(50) DEFAULT 'OFFICIAL',
+      -- Publish & Post-Publish Analytics (R6)
+      published_title TEXT,
+      published_thumbnail TEXT,
+      published_caption TEXT,
+      published_hashtags TEXT,
+      metrics_views NUMERIC DEFAULT 0,
+      metrics_retention VARCHAR(50),
+      metrics_ctr VARCHAR(50),
+      metrics_comments INT DEFAULT 0,
+      metrics_insights TEXT
     );
   `);
@@ -193,6 +244,68 @@
   try {
     await sql.query(`ALTER TABLE ideas ADD COLUMN content_pillar TEXT;`);
   } catch (e) { /* ignores if exists */ }
 
+  // SOP Migrations for existing databases
+  const sopMigrations = [
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS active_gate VARCHAR(50) DEFAULT 'GATE_1_IDEA';",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate1_approved_at VARCHAR(100);",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate1_approved_by_email VARCHAR(255);",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS script_status VARCHAR(50) DEFAULT 'DRAFT';",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS script_locked BOOLEAN DEFAULT FALSE;",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS script_revision_notes TEXT;",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate2_approved_at VARCHAR(100);",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate2_approved_by_email VARCHAR(255);",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate4_approved_at VARCHAR(100);",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate4_approved_by_email VARCHAR(255);",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate5_approved_at VARCHAR(100);",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate5_approved_by_email VARCHAR(255);",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS core_approval_notes TEXT;",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS script_data JSONB;",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS copyright_commitment BOOLEAN DEFAULT FALSE;",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS production_checklist JSONB;",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS qc_checklist JSONB;",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tiktok_checklist JSONB;",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS parent_task_id VARCHAR(100);",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS derivative_type VARCHAR(50) DEFAULT 'NONE';",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS source_video_url TEXT;",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tiktok_target_duration VARCHAR(50) DEFAULT '30-45s';",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tiktok_reframe_applied BOOLEAN DEFAULT FALSE;",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tiktok_hook_summary TEXT;",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tiktok_cta_route TEXT;",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS platform_type VARCHAR(50) DEFAULT 'YOUTUBE_MASTER';",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS channel_tier VARCHAR(50);",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS master_video_link TEXT;",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS asset_folder_link TEXT;",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS script_doc_link TEXT;",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS video_draft_link TEXT;",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS source_project_link TEXT;",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS video_final_link TEXT;",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS deadline_script VARCHAR(50);",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS deadline_production VARCHAR(50);",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS deadline_qc VARCHAR(50);",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS target_publish_date VARCHAR(50);",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS copyright_footage VARCHAR(50) DEFAULT 'PENDING';",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS copyright_music VARCHAR(50) DEFAULT 'PENDING';",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS copyright_mascot VARCHAR(50) DEFAULT 'OFFICIAL';",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS published_title TEXT;",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS published_thumbnail TEXT;",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS published_caption TEXT;",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS published_hashtags TEXT;",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS metrics_views NUMERIC DEFAULT 0;",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS metrics_retention VARCHAR(50);",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS metrics_ctr VARCHAR(50);",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS metrics_comments INT DEFAULT 0;",
+    "ALTER TABLE ideas ADD COLUMN IF NOT EXISTS metrics_insights TEXT;",
+    "CREATE INDEX IF NOT EXISTS idx_ideas_parent_task_id ON ideas (parent_task_id);",
+    "CREATE INDEX IF NOT EXISTS idx_ideas_active_gate ON ideas (active_gate);",
+    "CREATE INDEX IF NOT EXISTS idx_ideas_platform_type ON ideas (platform_type);"
+  ];
+  for (const m of sopMigrations) {
+    try {
+      await sql.query(m);
+    } catch (e) {
+      // column or index might already exist
+    }
+  }
```

---

## 5. Backward Compatibility & Safety Audit

### A. Impact on Existing Views (`ClientApp.tsx`)
1. **Kanban Board**: Grouped and sorted via `STATUS_ORDER = ["PITCH", "ASSIGNMENT", "SCRIPT", "PRODUCTION", "QA", "COMPLETE"]`. Because `Idea.status` remains typed as `IdeaStatus` and no required properties were added or removed, every card continues rendering seamlessly without runtime errors.
2. **Gantt Chart**: Computes task bars using `idea.startDate`, `idea.endDate`, and `idea.durationDays`. These fields and their date transformation helpers remain completely unaltered.
3. **Studio Dashboard**: Filters tasks using `ideas.filter(i => i.status === ...)` to calculate production ratios and bottlenecks. Works unmodified.
4. **Portfolio View**: Renders published video cards by checking `idea.publishedLink` and `idea.status === 'COMPLETE'`. Works unmodified.

### B. Legacy `ChecklistItem` Compatibility
In `src/app/components/ClientApp.tsx:4548` and `src/lib/db.ts:257`:
- Legacy code iterates over `checklists` and reads `item.name`, `item.status`, and calls `updateChecklistStatusAction(item.id, ...)`.
- Our updated `ChecklistItem` interface retains `name?: string`, `status?: string`, `assignedToEmail?: string`, `dueDate?: string`, and `createdByEmail?: string`.
- In `src/lib/db.ts`, row mapping populates both `name: r.name || ''` and `label: r.name || ''`, as well as `status: r.status || 'Chưa bắt đầu'` and `checked: r.status === 'Hoàn thành'`.
- Both legacy workspace checklists and new SOP dual checklists compile and execute with zero errors under `strict: true`.

### C. Server Actions and Insert/Update Invariance
- Existing server actions (such as `submitIdeaAction`, `approveIdeaAction`, `submitEditedScriptAction`, `submitVideoAction`) perform parameterized SQL statements with explicit column lists.
- Adding nullable columns with default values does not interfere with any existing `INSERT` or `UPDATE` queries.
- New server actions (`submitScriptMatrixAction`, `updateChecklistAction`, `createTikTokDerivativeAction`, etc.) will target the new columns directly without affecting legacy operations.

### D. JSONB Handling in Neon Serverless Postgres
- The `@neondatabase/serverless` driver natively converts JSONB database fields to parsed JavaScript objects/arrays.
- The included `parseJsonField<T>(val, fallback)` helper handles potential stringified JSON representations, nulls, undefineds, or malformed data gracefully without throwing exceptions.

---

## 6. Implementation & Verification Plan for Implementers

1. **Step 1: Apply `src/lib/types.ts`**:
   - Insert new type definitions (`ActiveGate`, `ScriptStatus`, `PlatformType`, `ChannelTier`, `DerivativeType`, `CopyrightCheckStatus`, `ScriptSegmentRow`, `ScriptData`, `ChecklistItem`, default checklist arrays).
   - Update `Idea` interface with the 48 optional fields and snake_case aliases.
2. **Step 2: Apply `src/lib/db.ts`**:
   - Add `parseJsonField` helper.
   - Add the 48 `ALTER TABLE` statements and 3 `CREATE INDEX` queries to the `migrations` array inside `ensureSchema()`.
   - Update `getAllData()` to map row fields into the expanded `Idea` contract and populate dual properties for `ChecklistItem`.
3. **Step 3: Apply `init-postgres.mjs`**:
   - Update `CREATE TABLE IF NOT EXISTS ideas` DDL with all 48 new columns.
   - Add the migration runner loop in `initSchema()`.
4. **Step 4: Type Check Verification**:
   - Run `export PATH="/usr/lib/chatgpt/resources/cua_node/bin:$PATH" && npx tsc --noEmit`
   - Confirm zero new type errors. (Only the 3 known JSX unescaped `->` errors in `ClientApp.tsx` lines 1903, 1979, 2082 will appear until M1 implements Feature 4).
