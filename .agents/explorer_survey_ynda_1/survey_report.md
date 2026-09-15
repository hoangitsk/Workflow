# BÁO CÁO KHẢO SÁT & THIẾT KẾ KIẾN TRÚC DỮ LIỆU & STATE MACHINE (YNDA WORKFLOW)

**Dự án**: Ý Niệm Điện Ảnh (YNDA) — Video Production SOP & System Upgrade  
**Tác giả**: Data Layer & State Machine Explorer  
**Thời gian khảo sát**: 2026-09-15T18:05:00+07:00  
**Tài liệu tham chiếu gốc**: `.agents/ORIGINAL_REQUEST.md` (Mục `## 2026-09-15T10:30:18Z`)

---

## 1. TỔNG QUAN HIỆN TRẠNG HỆ THỐNG DỮ LIỆU & BACKEND

### 1.1. Hiện trạng Database & Công nghệ Lưu trữ
Qua kiểm tra cấu trúc toàn bộ mã nguồn tại `/run/media/harlan/New Volume/workflow`:
1. **Prisma ORM Status**:
   - Tồn tại file schema nguyên mẫu tại `src/generated/prisma/schema.prisma` sử dụng provider `sqlite` và generator client `prisma-client-js`.
   - **Tuy nhiên**, trong `package.json`, `@prisma/client` và `prisma` **hoàn toàn không được cài đặt** trong dependencies hay devDependencies.
   - Thư mục `src/` không hề có bất kỳ câu lệnh `import ... from '@prisma/client'` hay gọi tới Prisma runtime.
2. **Hạ tầng Cơ sở Dữ liệu Thực tế**:
   - Hệ thống đang chạy trực tiếp trên **Vercel Neon Serverless PostgreSQL** thông qua thư viện `@neondatabase/serverless` (phiên bản `^1.1.0`).
   - Module kết nối chính nằm tại `src/lib/db.ts`, khởi tạo thông qua hàm:
     ```ts
     export function getDb() {
       return neon(getDatabaseUrl()); // Sử dụng POSTGRES_URL hoặc DATABASE_URL
     }
     ```
   - Cơ chế Migration hiện hữu:
     - Migration khởi tạo: Script `init-postgres.mjs` chạy các lệnh `CREATE TABLE IF NOT EXISTS` và các lệnh `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.
     - In-app Auto Migration: Hàm `ensureSchema(sql)` trong `src/lib/db.ts` tự động kiểm tra và bổ sung các cột mới khi gọi `getAllData()`.
     - Cơ chế Seed: `init-postgres.mjs` đọc dữ liệu sao lưu từ Google Sheets API (thông qua `google-spreadsheet`) và đẩy vào Neon Postgres.

### 1.2. Các Entity & Bảng Dữ liệu Hiện có (Neon Postgres)
Cơ sở dữ liệu đang có 11 bảng chính (chi tiết tại `DATABASE.md` & `init-postgres.mjs`):
1. `members`: Tài khoản, tên hiển thị, mật khẩu bcrypt, chuyên môn, và phân quyền (`role`: `'Core' | 'E' | 'P'`).
2. `platforms`: Nền tảng phân phối (`plat_yt`, `plat_tt`, `plat_reels`...) và `default_duration_days`.
3. `channel_groups`: Kênh nội dung (VD: Kênh 1 - Điện ảnh, Kênh 2 - Tâm lý học), màu HEX, định hướng video format.
4. `platform_channels`: Bảng liên kết Many-to-Many giữa Kênh và Nền tảng.
5. `ideas`: **Entity trung tâm đại diện cho toàn bộ vòng đời sản xuất video** (tương đương Task/Project).
6. `comments`: Bình luận thảo luận theo từng idea.
7. `audit_logs`: Lịch sử vết hoạt động của từng thao tác (Ai làm gì, thời điểm nào, payload JSON).
8. `notifications`: Thông báo nội bộ trong app (loại: `assigned`, `qa_pass`, `qa_fail`, `warning`, `info`).
9. `checklists`: Bảng to-do cá nhân tổng quát (chưa gắn kết với từng task sản xuất).
10. `settings`: Cấu hình hệ thống (Discord Webhook, Calendar).
11. `pitching_batches`: Các đợt mở nộp ý tưởng theo chủ đề/chiến dịch.

### 1.3. Cơ chế Gọi API & Backend Mutations
- Ứng dụng xây dựng trên **Next.js 16.3.2 (App Router)** và **React 19.2.8**.
- **Không sử dụng REST Route Handlers (`route.ts`)**. 100% các thao tác thay đổi dữ liệu, xác thực, chuyển đổi trạng thái được thực hiện qua **Next.js Server Actions** (`"use server"`) đặt trong `src/actions/`:
  - `idea-actions.ts`: 15 actions phụ trách toàn bộ vòng đời idea/task.
  - `admin-actions.ts`: Quản trị kênh, nền tảng, thành viên.
  - `auth-actions.ts`: Đăng nhập, session cookie, đổi mật khẩu.
  - `checklist-actions.ts`: To-do list cá nhân.
  - `notification-actions.ts`: Quản lý thông báo và gửi Discord Webhook.
  - `pitching-batch-actions.ts`: Quản lý đợt pitch.
  - `audit-actions.ts`: Ghi nhận nhật ký audit log chuẩn ACID.
- Cơ chế nạp dữ liệu: Server Component tại `src/app/page.tsx` gọi `getAllData()` từ `src/lib/db.ts` và truyền xuống `ClientApp.tsx` dưới dạng props `initialData`. Sau mỗi Server Action, hệ thống gọi `revalidatePath("/")` và client kích hoạt `router.refresh()`.

---

## 2. PHÂN TÍCH STATE MACHINE HIỆN TẠI VS QUY TRÌNH CHUẨN 9 BƯỚC (YNDA SOP)

### 2.1. State Machine Hiện tại
Trong `src/lib/types.ts` và `src/actions/idea-actions.ts`:
- Kiểu dữ liệu trạng thái: `VARCHAR(50) NOT NULL`, TypeScript `IdeaStatus = "PITCH" | "ASSIGNMENT" | "SCRIPT" | "PRODUCTION" | "QA" | "COMPLETE" | "ARCHIVED_IDEA" | "CANCELLED"`.
- Thứ tự hiển thị trên Kanban: `STATUS_ORDER = ["PITCH", "ASSIGNMENT", "SCRIPT", "PRODUCTION", "QA", "COMPLETE"]`.

### 2.2. Điểm Nghẽn & Lỗ Hổng So với 5 Cổng Kiểm Duyệt Bắt Buộc (R2)

| SOP Bước / Cổng | Trạng thái Hiện tại | Lỗ hổng / Bất cập Hiện hữu | Yêu cầu Chuẩn YNDA (R2) |
| :--- | :--- | :--- | :--- |
| **Bước 1 & 2** (Cổng 1: Chốt Idea) | `PITCH` -> `ASSIGNMENT` | Chỉ `Core` mới được duyệt (`member.role !== "Core"`). Chưa hỗ trợ vai trò Editor tham gia duyệt chốt idea theo phân công ban Đào tạo. | Cổng 1: Cho phép Editor hoặc Core duyệt idea vào top sản xuất; giao Producer cụ thể kèm deadline. |
| **Bước 3 & 4** (Cổng 2: Duyệt Script) | `ASSIGNMENT` -> `SCRIPT` -> `PRODUCTION` | Khi Producer nộp script (`submitScriptAction`), chỉ nhập 1 chuỗi URL `scriptLink`. Editor bấm duyệt (`startProductionAction`) là chuyển ngay sang `PRODUCTION`. Không có cơ chế khóa kịch bản (Content Locking), không có nút Yêu cầu chỉnh sửa kịch bản (Script Revision). Producer có thể tự ý sửa angle. | Cổng 2: Kịch bản phải theo form chuẩn 4 cột. Duyệt xong là **khóa cứng** đối với Producer. Muốn sửa phải có luồng Revision Request từ Editor. |
| **Bước 5 & 6** (Cổng 3: Bàn giao Video) | `PRODUCTION` -> `QA` | `submitVideoAction` chỉ kiểm tra role Producer và chỉ nhận 1 link `videoLink`. **Không hề kiểm tra** link source dự án (Premiere/CapCut) hay folder asset. **Không hề có checklist sản xuất**. Producer có thể nộp video ẩu mà không hoàn thành kiểm tra kỹ thuật. | Cổng 3: Bắt buộc điền đủ link tài nguyên (Video nháp, Source project, Asset folder) VÀ **Production Checklist phải đạt 100% (7/7 items)** mới cho nộp bàn giao. |
| **Bước 7** (Cổng 4: QC Editor) | Gộp chung trong `QA` | Trong hệ thống cũ, hàm `qaPassAction` do Editor/Core gọi lập tức đẩy idea sang `COMPLETE` và yêu cầu link xuất bản `publishedLink`. Bỏ qua hoàn toàn khâu Editor hoàn thiện và Cổng duyệt của Core! | Cổng 4: Editor thực hiện QC trên bộ **QC Checklist (8/8 items)**, tự hoàn thiện video master (tránh trả về Producer sửa vụn vặt), sau đó chuyển sang `CORE_REVIEW`. |
| **Bước 8** (Cổng 5: Core Duyệt) | Bị khuyết | Không có trạng thái `CORE_REVIEW`. Core không có cổng riêng để kiểm duyệt video đã hoàn thiện của Editor trước khi mở xuất bản. | Cổng 5: Chỉ duy nhất tài khoản `role === 'Core'` mới có quyền duyệt chốt Cổng 5 để mở khóa trạng thái Xuất bản (`READY_TO_PUBLISH`). |
| **Bước 9** (Publish & Analytics) | `COMPLETE` | Chỉ lưu 1 link `publishedLink`. Không có các trường metadata xuất bản (Title, Thumbnail, Caption, Hashtag) và không có trường lưu chỉ số hậu kỳ (Views, Retention, CTR, Comments, Insights). Không có nút hồi quy insight về Bước 1. | Cổng 9: Quản lý đầy đủ metadata xuất bản, ghi nhận chỉ số chuyển đổi, và lưu trữ bài học/insight đẩy ngược về kho Pitching. |

---

## 3. THIẾT KẾ MỞ RỘNG CƠ SỞ DỮ LIỆU (DATABASE SCHEMA SPECIFICATION)

Để đảm bảo hệ thống không bị gián đoạn, dữ liệu mới tương thích 100% với các dữ liệu cũ đang chạy trên Neon Postgres, phương án mở rộng trực tiếp trên bảng `ideas` kết hợp các cột JSONB/TEXT có cấu trúc là tối ưu nhất.

### 3.1. Phân tích Quyết định Kiến trúc: Lưu trữ Kịch bản 4 Cột & Checklists
1. **Phương án A: Tạo các bảng quan hệ rời rạc (`scripts`, `script_segments`, `task_checklist_items`)**:
   - *Ưu điểm*: Chuẩn hóa cơ sở dữ liệu quan hệ (3NF).
   - *Nhược điểm*: Mỗi lần truy vấn danh sách 100 task trên Kanban/Gantt sẽ phát sinh chi phí join 3-4 bảng hoặc N+1 query trên serverless pooler. Code migration phức tạp, nguy cơ lỗi lock bảng trên Neon khi deploy.
2. **Phương án B (Khuyến nghị lựa chọn): Lưu trữ dạng JSONB / JSON-Text có cấu trúc (`script_data`, `production_checklist`, `qc_checklist`, `tiktok_checklist`) trực tiếp trên bảng `ideas`**:
   - *Ưu điểm*:
     - **Nguyên khối & Toàn vẹn (Atomic)**: Toàn bộ kịch bản 4 cột (Hook 3Ws, 4 phân đoạn, cam kết bản quyền) hoặc danh sách checklist luôn được load và save đồng thời với task, không có độ trễ join.
     - **Tốc độ cực nhanh trên Neon**: `getAllData()` chỉ cần 1 câu lệnh `SELECT * FROM ideas` là có đầy đủ tiến độ checklist và nội dung kịch bản để render Kanban Card Badge ngay lập tức.
     - **Dễ mở rộng**: Khi cần bổ sung thêm tiêu chí checklist hoặc phân đoạn kịch bản, không cần chạy lại DDL migration cho bảng con.
     - **Tương thích ngược 100%**: Giữ nguyên trường `script_link` cho các task cũ dùng Google Docs link.

### 3.2. Chi tiết DDL Migration (Neon PostgreSQL)

```sql
-- ====================================================================
-- MIGRATION: YNDA VIDEO PRODUCTION SOP SYSTEM UPGRADE
-- File: init-postgres.mjs & src/lib/db.ts (ensureSchema)
-- ====================================================================

-- 1. CỔNG KIỂM DUYỆT & TRẠNG THÁI NÂNG CAO (R2)
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS active_gate VARCHAR(50) DEFAULT 'GATE_1_IDEA';
-- Các giá trị: 'GATE_1_IDEA', 'GATE_2_SCRIPT', 'GATE_3_PRODUCTION', 'GATE_4_QC', 'GATE_5_CORE', 'READY_TO_PUBLISH', 'PUBLISHED'

ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate1_approved_at VARCHAR(100);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate1_approved_by_email VARCHAR(255);

ALTER TABLE ideas ADD COLUMN IF NOT EXISTS script_status VARCHAR(50) DEFAULT 'DRAFT';
-- Các giá trị: 'DRAFT', 'SUBMITTED', 'APPROVED', 'REVISION_REQUESTED'
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS script_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS script_revision_notes TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate2_approved_at VARCHAR(100);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate2_approved_by_email VARCHAR(255);

ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate4_approved_at VARCHAR(100);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate4_approved_by_email VARCHAR(255);

ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate5_approved_at VARCHAR(100);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate5_approved_by_email VARCHAR(255);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS core_approval_notes TEXT;

-- 2. KỊCH BẢN CHUẨN 4 CỘT (R3)
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS script_data JSONB;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS copyright_commitment BOOLEAN DEFAULT FALSE;

-- 3. CHECKLIST SẢN XUẤT & CHECKLIST QC ĐỘC LẬP (R4)
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS production_checklist JSONB;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS qc_checklist JSONB;

-- 4. LUỒNG PHÁI SINH TIKTOK TỪ YOUTUBE MASTER (R5)
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS parent_task_id VARCHAR(100);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS derivative_type VARCHAR(50) DEFAULT 'NONE';
-- Các giá trị: 'NONE', 'TIKTOK_CUTDOWN', 'REELS_CUTDOWN'
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS source_video_url TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tiktok_target_duration VARCHAR(50); -- '30-45s'
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tiktok_reframe_applied BOOLEAN DEFAULT FALSE;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tiktok_hook_summary TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tiktok_cta_route TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tiktok_checklist JSONB;

-- 5. SIÊU DỮ LIỆU VÒNG ĐỜI & XUẤT BẢN & ANALYTICS (R6)
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS platform_type VARCHAR(50) DEFAULT 'YOUTUBE_MASTER';
-- Các giá trị: 'YOUTUBE_MASTER', 'TIKTOK_CUTDOWN', 'FACEBOOK_REELS'

ALTER TABLE ideas ADD COLUMN IF NOT EXISTS channel_tier VARCHAR(50);
-- 'KENH_1_GIAO_DUC' (Điện ảnh & Văn học), 'KENH_2_TAM_LY' (Tâm lý & Phản biện)

-- 5 liên kết tài nguyên bắt buộc
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS master_video_link TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS asset_folder_link TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS script_doc_link TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS video_draft_link TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS source_project_link TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS video_final_link TEXT;

-- Hệ thống Deadline theo từng cổng
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS deadline_script VARCHAR(50);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS deadline_production VARCHAR(50);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS deadline_qc VARCHAR(50);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS target_publish_date VARCHAR(50);

-- Trạng thái bản quyền chi tiết
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS copyright_footage VARCHAR(50) DEFAULT 'PENDING';
-- 'CHECKED_CLEAN', 'FAIR_USE', 'PENDING', 'RISK'
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS copyright_music VARCHAR(50) DEFAULT 'PENDING';
-- 'CHECKED_CLEAN', 'LICENSED', 'PENDING', 'RISK'
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS copyright_mascot VARCHAR(50) DEFAULT 'OFFICIAL';
-- 'OFFICIAL_ASSET', 'CUSTOM', 'PENDING'

-- Thông tin xuất bản chính thức
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS published_title TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS published_thumbnail TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS published_caption TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS published_hashtags TEXT;

-- Chỉ số sau xuất bản (Analytics Feedback)
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS metrics_views NUMERIC DEFAULT 0;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS metrics_retention VARCHAR(50);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS metrics_ctr VARCHAR(50);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS metrics_comments INT DEFAULT 0;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS metrics_insights TEXT;
```

---

## 4. ĐẶC TẢ TYPESCRIPT INTERFACES (CẬP NHẬT `src/lib/types.ts`)

```typescript
// ====================================================================
// NEW TYPES FOR YNDA SOP UPGRADE
// ====================================================================

export type ActiveGate = 
  | "GATE_1_IDEA" 
  | "GATE_2_SCRIPT" 
  | "GATE_3_PRODUCTION" 
  | "GATE_4_QC" 
  | "GATE_5_CORE" 
  | "READY_TO_PUBLISH" 
  | "PUBLISHED";

export type ScriptStatus = 
  | "DRAFT" 
  | "SUBMITTED" 
  | "APPROVED" 
  | "REVISION_REQUESTED";

export type PlatformType = 
  | "YOUTUBE_MASTER" 
  | "TIKTOK_CUTDOWN" 
  | "FACEBOOK_REELS";

export type ChannelTier = 
  | "KENH_1_GIAO_DUC"   // Kênh 1: Giáo dục & Ứng dụng (Điện ảnh & Văn học)
  | "KENH_2_TAM_LY";     // Kênh 2: Tâm lý & Phản biện

export type DerivativeType = 
  | "NONE" 
  | "TIKTOK_CUTDOWN" 
  | "REELS_CUTDOWN";

export type CopyrightCheckStatus = 
  | "CHECKED_CLEAN" 
  | "FAIR_USE" 
  | "LICENSED" 
  | "PENDING" 
  | "RISK";

// Cấu trúc phân đoạn Kịch bản 4 Cột chuẩn (R3)
export interface ScriptSegmentRow {
  id: string;
  timeRange: string;         // VD: "00:00 - 00:15", "00:15 - 03:30", "03:30 - 04:30", "04:30 - 05:00"
  segmentName: string;       // "Intro / Hook 3Ws" | "Thân bài" | "Kết bài / Outro" | "CTA & Loop"
  voiceAiText: string;       // Cột 2 (Module B): Lời đọc chữ / Voice AI
  visualMascotEdits: string; // Cột 3 (Module C): Hình ảnh, Linh vật & Khoảng chêm Edit
  bgmSfxNotes: string;       // Cột 4: Nhạc nền & Hiệu ứng SFX
}

export interface ScriptData {
  episodeName: string;
  channelTier: ChannelTier;
  writerProducerEmail: string;
  submissionDeadline: string; // Thứ 4 hàng tuần
  hook3Ws: {
    what: string;
    when: string;
    why: string;
  };
  segments: ScriptSegmentRow[];
  summaryCardNotes?: string;   // Tóm tắt thông điệp cốt lõi cho Summary Card
  seamlessLoopQuestion?: string; // Câu hỏi thảo luận và câu nối mượt về Hook
  copyrightCommitment: boolean;
  status: ScriptStatus;
  locked: boolean;
  revisionNotes?: string;
  updatedAt: string;
}

// Cấu trúc Checklist sản xuất & QC (R4)
export interface ChecklistProgressItem {
  key: string;
  label: string;
  checked: boolean;
  checkedByEmail?: string;
  checkedAt?: string;
}

export type ProductionChecklistState = Record<string, ChecklistProgressItem>;
export type QcChecklistState = Record<string, ChecklistProgressItem>;
export type TikTokChecklistState = Record<string, ChecklistProgressItem>;

// Cập nhật Entity Idea toàn diện
export interface Idea {
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
  createdAt: string;
  assignedAt?: string;
  videoSubmittedAt?: string;

  // Credits
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

  // --- CÁC TRƯỜNG BỔ SUNG MỚI (R2 - R6) ---
  activeGate: ActiveGate;

  // Gate 1: Chốt Idea
  gate1ApprovedAt?: string;
  gate1ApprovedByEmail?: string;

  // Gate 2: Duyệt Script & Kịch bản 4 Cột (R3)
  scriptStatus?: ScriptStatus;
  scriptLocked?: boolean;
  scriptRevisionNotes?: string;
  gate2ApprovedAt?: string;
  gate2ApprovedByEmail?: string;
  scriptData?: ScriptData;
  copyrightCommitment?: boolean;

  // Gate 3 & R4: Checklists
  productionChecklist?: ProductionChecklistState;
  qcChecklist?: QcChecklistState;

  // Gate 4: QC Editor
  gate4ApprovedAt?: string;
  gate4ApprovedByEmail?: string;
  videoFinalLink?: string;

  // Gate 5: Core Duyệt
  gate5ApprovedAt?: string;
  gate5ApprovedByEmail?: string;
  coreApprovalNotes?: string;

  // R5: TikTok Derivative Cutdown
  parentTaskId?: string;
  derivativeType?: DerivativeType;
  sourceVideoUrl?: string;
  tiktokTargetDuration?: string;
  tiktokReframeApplied?: boolean;
  tiktokHookSummary?: string;
  tiktokCtaRoute?: string;
  tiktokChecklist?: TikTokChecklistState;

  // R6: Lifecycle & Links
  platformType?: PlatformType;
  channelTier?: ChannelTier;
  masterVideoLink?: string;
  assetFolderLink?: string;
  scriptDocLink?: string;
  videoDraftLink?: string;
  sourceProjectLink?: string;
  scriptLink?: string;    // Giữ tương thích cũ
  videoLink?: string;     // Giữ tương thích cũ
  publishedLink?: string; // Giữ tương thích cũ

  // Deadlines theo từng cổng
  deadlineScript?: string;
  deadlineProduction?: string;
  deadlineQc?: string;
  targetPublishDate?: string;
  scheduledPostDate?: string;

  // Copyright Status
  copyrightFootage?: CopyrightCheckStatus;
  copyrightMusic?: CopyrightCheckStatus;
  copyrightMascot?: string;

  // Metadata Xuất bản
  publishedTitle?: string;
  publishedThumbnail?: string;
  publishedCaption?: string;
  publishedHashtags?: string;

  // Post-publish Analytics (R6 & Feedback loop)
  metricsViews?: number;
  metricsRetention?: string;
  metricsCtr?: string;
  metricsComments?: number;
  metricsInsights?: string;
}
```

---

## 5. BẢNG TIÊU CHÍ CHECKLIST CHUẨN HÓA (R4 & R5)

### 5.1. Production Checklist (7 Tiêu chí cho Producer trước Cổng 3)
Mã hóa dạng key-value để lưu vào `production_checklist JSONB`:
1. `voice_clarity`: Voice rõ ràng, phát âm chuẩn, không tạp âm/nhiễu.
2. `footage_script_sourced`: Footage bám sát script và có ghi rõ nguồn tư liệu.
3. `bgm_sfx_copyright`: BGM & SFX đã kiểm tra quyền sử dụng, không vi phạm bản quyền.
4. `subtitles_safe_zone`: Subtitle đúng chính tả, nằm trong vùng an toàn (safe zone).
5. `master_16_9_format`: Định dạng chuẩn master ngang YouTube 16:9 (2 - 5 phút).
6. `metadata_proposal`: Có đề xuất thumbnail, title và caption/hashtag.
7. `source_project_exported`: Đã xuất đầy đủ file source/project để Editor tiếp quản chỉnh sửa.

### 5.2. QC Checklist (8 Tiêu chí cho Editor trước Cổng 4)
Mã hóa dạng key-value để lưu vào `qc_checklist JSONB`:
1. `hook_3s_retention`: Hook 3 giây đầu đủ mạnh để giữ chân người xem.
2. `content_brief_aligned`: Nội dung bám sát Idea và Script đã duyệt.
3. `editing_breath_pauses`: Nhịp dựng có khoảng thở kỹ thuật, không dồn dập.
4. `audio_voice_prominence`: Audio cân bằng âm lượng, voice nổi rõ trên nền BGM.
5. `brand_identity_sync`: Subtitle, font chữ, màu sắc và layout đồng bộ nhận diện thương hiệu.
6. `zero_copyright_risk`: Rủi ro bản quyền âm thanh/hình ảnh bằng 0.
7. `cta_seamless_loop`: CTA và seamless loop mượt mà, đúng định hướng.
8. `youtube_tech_standards`: Video đạt chuẩn kỹ thuật YouTube trước khi trình Core duyệt.

### 5.3. TikTok Cutdown Checklist (5 Tiêu chí cho Task Phái Sinh R5)
Mã hóa dạng key-value để lưu vào `tiktok_checklist JSONB`:
1. `vertical_9_16_reframe`: Reframe bố cục dọc 9:16 chuyên nghiệp (không chỉ crop đơn thuần).
2. `immediate_hook_0_3s`: Hook mới xuất hiện ngay 0 - 3 giây đầu.
3. `large_mobile_subtitles`: Subtitle kích thước lớn, dễ đọc trên di động.
4. `cta_youtube_fb_community`: CTA điều hướng rõ ràng về video đầy đủ trên YouTube và Cộng đồng Facebook.
5. `master_video_id_backlink`: Liên kết ngược ID/URL của video YouTube Master để đo lường tỷ lệ chuyển đổi.

---

## 6. MA TRẬN CHUYỂN TRẠNG THÁI (STATE MACHINE TRANSITION MATRIX & GATING)

### 6.1. Chi tiết 5 Cổng Kiểm Duyệt Bắt Buộc

```
[PITCH] 
   │
   ├─► (Cổng 1: Editor/Core duyệt) ──► [ASSIGNMENT]
   │
[ASSIGNMENT]
   │
   ├─► (Producer lưu nháp / nộp Script 4 cột) ──► [SCRIPT]
   │
[SCRIPT]
   │
   ├─► (Editor/Core yêu cầu sửa) ──► [SCRIPT] (status: REVISION_REQUESTED)
   │
   ├─► (Cổng 2: Editor duyệt chốt + Khóa nội dung) ──► [PRODUCTION]
   │
[PRODUCTION]
   │
   ├─► (Cổng 3: Producer điền 3 link + 7/7 Production Checklist) ──► [QA] (Editor QC)
   │
[QA] (Editor QC)
   │
   ├─► (Editor từ chối / trả sửa) ──► [PRODUCTION] (hoặc Editor tự hoàn thiện)
   │
   ├─► (Cổng 4: 8/8 QC Checklist + Editor duyệt) ──► [CORE_REVIEW]
   │
[CORE_REVIEW]
   │
   ├─► (Core yêu cầu Editor chỉnh sửa lại) ──► [QA]
   │
   ├─► (Cổng 5: Core duyệt chốt cuối) ──► [COMPLETE / READY_TO_PUBLISH]
   │
[COMPLETE / READY_TO_PUBLISH]
   │
   ├─► (Nhập link thực tế + Title + Thumbnail + Caption) ──► Đã Xuất Bản
   │
   ├─► (Nút tạo nhánh TikTok phái sinh) ──► Tạo Task TikTok (parent_task_id)
   │
   └─► (Cập nhật Views, Retention, CTR, Comments, Insight) ──► Hồi quy về Bước 1 (PITCH)
```

### 6.2. Ma trận Quy Tắc Kiểm Soát (Gating Enforcement Matrix)

| Cổng | Từ Trạng Thái | Đến Trạng Thái | Vai Trò Cho Phép | Điều Kiện Tiên Quyết Bắt Buộc (Guards) | Hành Động Kèm Theo |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Cổng 1** | `PITCH` / `ARCHIVED` | `ASSIGNMENT` | `Editor` hoặc `Core` | - Phải chỉ định 1 Producer cụ thể (`producerEmail`)<br>- Phải chọn Kênh & Nền tảng<br>- Số ngày sản xuất >= 1 | Ghi nhận `gate1_approved_at`, `gate1_approved_by_email`, gán deadline |
| **Cổng 2** | `SCRIPT` | `PRODUCTION` | `Editor` hoặc `Core` | - Form kịch bản 4 cột đã điền đủ Hook 3Ws & 4 phân đoạn<br>- Đã tích `copyright_commitment = TRUE`<br>- `script_status === 'SUBMITTED'` | Khóa kịch bản (`script_locked = TRUE`), ghi nhận `gate2_approved_at`, `credits_edited_script_by_email` |
| **Yêu cầu sửa Script** | `SCRIPT` | `SCRIPT` | `Editor` hoặc `Core` | - Phải nhập nội dung góp ý (`revisionNotes`) | Đặt `script_status = 'REVISION_REQUESTED'`, mở khóa cho Producer sửa lại |
| **Cổng 3** | `PRODUCTION` | `QA` | `Producer` được giao việc | - Điền đủ `video_draft_link` (hoặc `video_link`)<br>- Điền đủ `source_project_link`<br>- Điền đủ `asset_folder_link`<br>- **Production Checklist hoàn thành 100% (7/7)** | Cập nhật `video_submitted_at`, ghi `credits_produced_by_email`, chuyển active gate sang QC |
| **Cổng 4** | `QA` | `CORE_REVIEW` | `Editor` hoặc `Core` | - **QC Checklist hoàn thành 100% (8/8)**<br>- Điền link master hoàn thiện `video_final_link` nếu Editor có can thiệp sửa dựng | Đặt `gate4_approved_at`, ghi nhận `credits_qa_by_email`, mở quyền sang Core duyệt |
| **Cổng 5** | `CORE_REVIEW` | `COMPLETE` (hoặc `READY_TO_PUBLISH`) | **CHỈ `Core`** | - Task đang ở trạng thái `CORE_REVIEW`<br>- Đã có xác nhận Cổng 4 từ Editor | Đặt `gate5_approved_at`, `credits_approved_by_email`, mở khóa form xuất bản |
| **Xuất bản** | `READY_TO_PUBLISH` | `COMPLETE` | `Editor` hoặc `Core` | - Bắt buộc nhập `published_link` hợp lệ<br>- Nhập tiêu đề, thumbnail, caption, hashtag | Hoàn tất vòng đời sản phẩm, sẵn sàng tạo task phái sinh TikTok |
| **Tạo TikTok** | `COMPLETE` | Task mới (`PITCH` / `ASSIGNMENT`) | Bất kỳ thành viên | - Video gốc phải là `YOUTUBE_MASTER` đã `COMPLETE` | Tạo idea mới mang `parent_task_id`, gán type `TIKTOK_CUTDOWN` |
| **Hồi quy Insight** | `COMPLETE` | `PITCH` mới | Bất kỳ thành viên | - Đã cập nhật `metrics_insights` | Tạo ý tưởng mới có trường tham chiếu đến `source_idea_id` |

---

## 7. ĐẶC TẢ API CONTRACTS & SERVER ACTIONS CẦN BỔ SUNG / NÂNG CẤP

Để việc triển khai diễn ra mượt mà và an toàn, toàn bộ Server Actions mới sẽ được triển khai tại `src/actions/idea-actions.ts` hoặc tạo thêm `src/actions/sop-actions.ts`:

### 7.1. Cổng 1: Duyệt Idea (Mở rộng cho Editor)
```typescript
export async function approveIdeaAction(
  ideaId: string, 
  durationDays: number, 
  producerEmail: string, 
  platformChannelId?: string,
  deadlineScript?: string
): Promise<{ success: boolean }>;
```
- Cho phép: `member.role === 'Core' || member.role === 'E'`.
- Cập nhật: `status = 'ASSIGNMENT'`, `active_gate = 'GATE_2_SCRIPT'`, `gate1_approved_at`, `gate1_approved_by_email`.

### 7.2. Cổng 2 & Script Builder Actions
```typescript
// Lưu bản nháp kịch bản (Producer hoặc Editor)
export async function saveScriptDraftAction(
  ideaId: string, 
  scriptData: ScriptData
): Promise<{ success: boolean }>;

// Producer nộp kịch bản (ASSIGNMENT -> SCRIPT)
export async function submitScriptAction(
  ideaId: string, 
  scriptData: ScriptData, 
  scriptDocLink?: string
): Promise<{ success: boolean }>;

// Editor duyệt kịch bản (SCRIPT -> PRODUCTION)
export async function approveScriptAction(
  ideaId: string
): Promise<{ success: boolean }>;

// Editor yêu cầu sửa kịch bản
export async function requestScriptRevisionAction(
  ideaId: string, 
  revisionNotes: string
): Promise<{ success: boolean }>;
```

### 7.3. Cổng 3: Nộp Video & Production Checklist Actions
```typescript
// Toggle checkbox trên thẻ checklist (lưu realtime)
export async function toggleTaskChecklistAction(
  ideaId: string, 
  checklistType: "production" | "qc" | "tiktok", 
  itemKey: string, 
  checked: boolean
): Promise<{ success: boolean; progress: number }>;

// Producer nộp video (PRODUCTION -> QA)
export async function submitVideoAction(
  ideaId: string, 
  data: {
    videoDraftLink: string;
    sourceProjectLink: string;
    assetFolderLink: string;
  }
): Promise<{ success: boolean }>;
```
- Kiểm tra điều kiện:
  ```typescript
  if (!data.videoDraftLink?.trim() || !data.sourceProjectLink?.trim() || !data.assetFolderLink?.trim()) {
    throw new Error("Bắt buộc phải điền đủ: Link video nháp, Link file source project và Link thư mục asset.");
  }
  const isComplete = checkAllChecklistItems(row.production_checklist, 7);
  if (!isComplete) {
    throw new Error("Không thể nộp video: Production Checklist chưa hoàn thành 100% (7/7 tiêu chuẩn).");
  }
  ```

### 7.4. Cổng 4: Editor QC Approval
```typescript
// Editor QC hoàn tất -> chuyển Core duyệt
export async function editorQcPassAction(
  ideaId: string, 
  videoFinalLink?: string
): Promise<{ success: boolean }>;

// Editor đánh giá QC Chưa Đạt -> trả Producer sửa
export async function editorQcFailAction(
  ideaId: string, 
  qcFeedback: string
): Promise<{ success: boolean }>;
```
- Kiểm tra điều kiện:
  ```typescript
  if (member.role !== "E" && member.role !== "Core") {
    throw new Error("Chỉ Editor hoặc Core mới có quyền thực hiện kiểm duyệt QC.");
  }
  const isComplete = checkAllChecklistItems(row.qc_checklist, 8);
  if (!isComplete) {
    throw new Error("Không thể chuyển Core duyệt: QC Checklist chưa hoàn thành 100% (8/8 tiêu chuẩn).");
  }
  ```

### 7.5. Cổng 5: Core Review & Publish Actions
```typescript
// Core duyệt chốt cuối (CORE_REVIEW -> READY_TO_PUBLISH)
export async function coreApproveFinalAction(
  ideaId: string, 
  notes?: string
): Promise<{ success: boolean }>;

// Đăng tải video & Nhập metadata chính thức
export async function publishVideoAction(
  ideaId: string, 
  publishData: {
    publishedLink: string;
    publishedTitle?: string;
    publishedThumbnail?: string;
    publishedCaption?: string;
    publishedHashtags?: string;
  }
): Promise<{ success: boolean }>;
```

### 7.6. Luồng Phái Sinh TikTok (R5) & Analytics Feedback Loop
```typescript
// Tạo nhánh video TikTok Cutdown từ YouTube Master
export async function createTikTokCutdownAction(
  masterIdeaId: string, 
  cutdownData: {
    title: string;
    producerEmail: string;
    durationDays: number;
    tiktokHookSummary: string;
    tiktokCtaRoute: string;
  }
): Promise<{ success: boolean; childTaskId: string }>;

// Cập nhật chỉ số sau đăng và ghi nhận insight
export async function updatePostPublishMetricsAction(
  ideaId: string, 
  metrics: {
    views: number;
    retention: string;
    ctr: string;
    comments: number;
    insights: string;
  }
): Promise<{ success: boolean }>;

// Tạo Idea Pitching mới từ Insight của video đã xuất bản
export async function createIdeaFromInsightAction(
  sourceIdeaId: string, 
  newIdeaData: {
    title: string;
    description: string;
    platformChannelId: string;
  }
): Promise<{ success: boolean; newIdeaId: string }>;
```

---

## 8. CHIẾN LƯỢC TƯƠNG THÍCH NGƯỢC (BACKWARD COMPATIBILITY STRATEGY)

Để việc bổ sung các trạng thái và trường dữ liệu mới không làm gãy các màn hình hiện tại:
1. **Kanban Board (`src/app/components/ClientApp.tsx`)**:
   - `STATUS_ORDER` hiện tại là: `["PITCH", "ASSIGNMENT", "SCRIPT", "PRODUCTION", "QA", "COMPLETE"]`.
   - Ta có thể mở rộng `STATUS_ORDER` thành 7 cột trực quan:
     `["PITCH", "ASSIGNMENT", "SCRIPT", "PRODUCTION", "QA", "CORE_REVIEW", "COMPLETE"]`.
   - Với các task cũ đang ở `QA` hoặc `COMPLETE`, logic lọc `status === colKey` tiếp tục chạy hoàn toàn bình thường.
2. **Gantt Chart & Calendar**:
   - Vẫn tính toán thanh tiến độ dựa trên `startDate` và `endDate`. Các trường deadline mới (`deadline_script`, `deadline_production`, `deadline_qc`) được dùng làm mốc phụ (milestone markers) làm phong phú thêm giao diện Gantt.
3. **Public Portfolio (`src/app/portfolio/[id]/page.tsx`)**:
   - Điều kiện hiển thị tác phẩm: `i.status === "COMPLETE" && i.publishedLink`.
   - Giữ nguyên vẹn điều kiện này, các trường xuất bản mở rộng (`publishedTitle`, `publishedThumbnail`, `metricsViews`) sẽ giúp trang Portfolio cá nhân hiển thị đẹp mắt và chuyên nghiệp hơn nữa.
4. **Phát hiện Tiền thẩm định Mã nguồn**:
   - Chạy lệnh kiểm tra TypeScript `npx tsc --noEmit` phát hiện **3 lỗi cú pháp JSX tiền định** trong `src/app/components/ClientApp.tsx` tại dòng 1903, 1979 và 2082 (do ký tự `->` chưa được escape thành `&gt;` hoặc `{'>'}`). Đã được ghi nhận vào báo cáo handoff để bàn giao cho agent triển khai fix triệt để khi hoàn thiện build.

---
*Báo cáo hoàn tất và sẵn sàng cho giai đoạn lập kế hoạch chi tiết & triển khai.*
