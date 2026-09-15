# UI Architecture & Components Survey Report
## "Ý Niệm Điện Ảnh" (YNDA) Video Production SOP and System Upgrade

- **Author**: UI Architecture & Components Explorer
- **Date**: 2026-09-15
- **Working Directory**: `/run/media/harlan/New Volume/workflow/.agents/explorer_survey_ynda_2`
- **Target Project**: `/run/media/harlan/New Volume/workflow`

---

## 1. Executive Summary

This report delivers a complete analysis of the existing frontend architecture and provides the technical blueprint for implementing requirements **R1 to R6** of the "Ý Niệm Điện Ảnh" (YNDA) standard video production SOP upgrade.

### Core Discoveries
1. **Framework & Environment**: The application runs on **Next.js 16.3.2** (App Router) with **React 19.2.8** and **Tailwind CSS v4** (`@tailwindcss/postcss: ^4`, `tailwindcss: ^4`).
2. **Current Component Architecture**: The UI is currently centralized in `src/app/components/ClientApp.tsx` (a 4,674-line monolithic client component) with one auxiliary view `src/app/components/ProductionTutorialView.tsx` (116 lines).
3. **State Management & Data Flow**: Hybrid model using Next.js App Router Server Actions (`src/actions/*`), `useTransition()` with `router.refresh()`, and Neon Serverless PostgreSQL (`@neondatabase/serverless: ^1.1.0`) as the single source of truth. Props flow down from `src/app/page.tsx` into `ClientApp.tsx`.
4. **Current SOP & Gating Gaps**:
   - `ProductionTutorialView.tsx` already defines the 9 production stages but is currently only accessible via a sidebar navigation tab (`tab === "tutorial"`) and lacks contextual links from active tasks.
   - The current task lifecycle has only 6 statuses (`PITCH` -> `ASSIGNMENT` -> `SCRIPT` -> `PRODUCTION` -> `QA` -> `COMPLETE`), skipping explicit script approval gating (Gate 2), pre-submission checklist gating (Gate 3), and separate Core final approval before publish (Gate 5).
   - The script form is currently a single URL text input field (`scriptLink`), completely missing the standardized 4-column matrix, Hook 3Ws structure, and copyright commitment.
   - Checklists are currently generic individual todo items (`src/actions/checklist-actions.ts`), not task-embedded Production (7-item) and QC (8-item) checklists.
   - There is no derivative linkage between YouTube Master (16:9) and TikTok Cutdown (9:16).
5. **Existing Build Defect**: Three unescaped `>` characters in `src/app/components/ClientApp.tsx` (lines 1903, 1979, 2082) fail `npx tsc --noEmit`. These must be resolved before `npm run build` can succeed.

---

## 2. Tech Stack, Directory Structure & Design System

### 2.1 Dependencies & Versions (`package.json`)
```json
{
  "dependencies": {
    "@neondatabase/serverless": "^1.1.0",
    "bcryptjs": "^3.0.3",
    "dotenv": "^17.4.2",
    "google-auth-library": "^11.0.2",
    "google-spreadsheet": "^5.3.0",
    "lucide-react": "^1.33.0",
    "next": "16.3.2",
    "react": "19.2.8",
    "react-dom": "19.2.8",
    "react-hotkeys-hook": "^5.3.3"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "tailwindcss": "^4",
    "typescript": "^5",
    "eslint": "^9",
    "eslint-config-next": "16.3.2"
  }
}
```

### 2.2 Directory Layout
```
/run/media/harlan/New Volume/workflow/
├── src/
│   ├── actions/                  # Next.js Server Actions
│   │   ├── admin-actions.ts      # Channel, platform, member management
│   │   ├── audit-actions.ts      # System audit trail
│   │   ├── auth-actions.ts       # Auth session & bcrypt login
│   │   ├── checklist-actions.ts  # Generic checklist actions
│   │   ├── comment-actions.ts    # Threaded task comments
│   │   ├── idea-actions.ts       # Task/Idea lifecycle actions
│   │   ├── notification-actions.ts # Discord webhooks & in-app alerts
│   │   ├── pitching-batch-actions.ts # Pitch call batches
│   │   └── report-actions.ts     # Weekly summary reports
│   ├── app/                      # Next.js 16 App Router
│   │   ├── components/           # Client UI components
│   │   │   ├── ClientApp.tsx     # Monolithic workspace client
│   │   │   └── ProductionTutorialView.tsx # SOP tutorial view
│   │   ├── portfolio/[id]/page.tsx # Member public portfolio
│   │   ├── globals.css           # Tailwind v4 import & custom styles
│   │   ├── layout.tsx            # Root HTML layout & fonts
│   │   ├── page.tsx              # Server Component (root data loader)
│   │   ├── error.tsx             # Error boundary
│   │   ├── global-error.tsx      # Global error boundary
│   │   └── loading.tsx           # Suspense skeleton
│   └── lib/
│       ├── db.ts                 # Neon connection, auto-migrations, getAllData
│       ├── reference-utils.tsx   # MultiReferenceEditor, URL parsers
│       ├── sheets.ts             # Google Sheets legacy fallback
│       └── types.ts              # TypeScript interfaces
```

### 2.3 Styling & Design Tokens
- **Tailwind CSS v4**: Loaded via `@import "tailwindcss";` in `src/app/globals.css`.
- **Typography**:
  - Brand Display: `'Cinzel', serif` (`--font-brand`)
  - Main Body / UI: `'Plus Jakarta Sans', sans-serif` (`--font-sans`)
  - Code & Monospace: `'JetBrains Mono', monospace` (`--font-mono`)
- **Modern SaaS Palette (Token Object `C`)**:
  - Background: `#F8FAFC` (Slate 50)
  - Soft Background: `#F1F5F9` (Slate 100)
  - Surface Panels: `#FFFFFF` (Pure White)
  - Borders: `#E2E8F0` (Slate 200)
  - High-contrast Text: `#0F172A` (Slate 900)
  - Muted Text: `#334155` (Slate 700)
  - Faint Text: `#64748B` (Slate 500)
- **Role Colors**:
  - `Core`: Amber (`#FEF3C7` bg, `#92400E` text, `#FDE68A` border)
  - `E` (Editor): Blue (`#DBEAFE` bg, `#1E40AF` text, `#BFDBFE` border)
  - `P` (Producer): Purple (`#F3E8FF` bg, `#6B21A8` text, `#E9D5FF` border)
- **Status Colors (`STATUS_COLORS`)**:
  - `PITCH`: Amber / Gold (`#FEF3C7` / `#92400E`)
  - `ASSIGNMENT`: Soft Blue (`#DBEAFE` / `#1E40AF`)
  - `SCRIPT`: Indigo (`#E0E7FF` / `#3730A3`)
  - `PRODUCTION`: Soft Purple (`#F3E8FF` / `#6B21A8`)
  - `QA`: Rose / Red (`#FEE2E2` / `#991B1B`)
  - `COMPLETE`: Emerald Green (`#DCFCE7` / `#166534`)
  - `ARCHIVED_IDEA`: Slate Gray (`#F1F5F9` / `#475569`)
  - `CANCELLED`: Light Rose (`#FEE2E2` / `#991B1B`)
- **Shadow Utilities**: `.saas-shadow`, `.saas-shadow-md`, `.saas-shadow-lg`.
- **Animations**: `.animate-slide-in-right` (cubic-bezier slide for drawer), Tailwind `animate-in fade-in`, `zoom-in-95`.

### 2.4 Existing UI Component Primitives
Located directly inside `src/app/components/ClientApp.tsx`:
- `Modal({ title, onClose, children, wide })`: Centered dialog with backdrop blur and fixed header/body.
- `Btn({ children, onClick, tone, disabled, small, loading, className })`: Tones include `default`, `primary`, `indigo`, `danger`, `ghost`, `amber`, `success`.
- `TextInput`, `Select`, `TextArea`: Styled with 8px radius, Slate-200 border, Slate-900 focus ring.
- `FieldLabel({ children, required })`: Form field label with optional red asterisk.
- `Badge({ children, tone })`: Semantic pill badge.
- `RoleChip({ role })`: Standardized role badge (`BAN ĐÀO TẠO (CORE)`, `BAN ĐÀO TẠO`, `BAN DỰ ÁN`).
- `UserAvatar({ name, size })`: Colored circle avatar with initials.
- `MultiReferenceEditor`: Dynamic multi-URL input with automatic platform tag detection (Video, Docs, Drive, Audio, Image).

---

## 3. Current Task Detail & Task Creation Analysis

### 3.1 Task Detail Drawer (`IdeaSlideOverDrawer`)
- **Location**: `src/app/components/ClientApp.tsx:3118-3610`.
- **Form Factor**: Fixed 500px right slide-over drawer (`w-full max-w-[500px] h-full bg-white border-l shadow-2xl`).
- **Header**:
  - Status pill, Channel group badge, Platform name, Task title, Close (X) button.
- **Action Bar**:
  - Conditional quick action buttons based on `idea.status` and `actor.role`:
    - `PITCH` + Core: "Duyệt ý tưởng"
    - `ASSIGNMENT` + Assigned P: "Nộp kịch bản"
    - `SCRIPT` + E/Core: "Bắt đầu sản xuất"
    - `PRODUCTION` + Assigned P: "Nộp video"
    - `QA` + E/Core: "QA Đạt" / "QA Chưa đạt"
    - `COMPLETE` + Core: "Lên lịch đăng"
    - Common: "Nhân bản", "Sửa", "Đổi người", "Gia hạn", "Huỷ".
- **Body Content**:
  - Overdue warning banner (`overdueInfo(idea)`).
  - QA Feedback banner (if rejected).
  - External links: `scriptLink`, `videoLink`, `publishedLink`.
  - Star rating widget (1-5 stars for `COMPLETE` tasks).
  - Pitch details: Content pillar, logline, description, referenceLinks, angle, keyMessage.
  - Internal studio notes (editable only by Core).
  - Workflow milestone history timeline.
  - Contributor attribution (Credits: Idea, Approved, Script, Editor, Production, QA).
  - Threaded comment system with inline submission.

### 3.2 Task Creation Modal (`showNewIdea`)
- **Location**: `src/app/components/ClientApp.tsx:1314-1486`.
- **Form Fields**:
  - Pitching call banner (if open batch exists).
  - Tên ý tưởng (Title, required).
  - Logline (Summary text).
  - Mô tả chi tiết nội dung (Content, required).
  - Link tham khảo (MultiReferenceEditor).
  - Hướng triển khai (Angle).
  - Key message.
  - Tuyến bài nội dung (Content Pillar dropdown: Branding, Trải nghiệm, News, PR, Personal Branding, Content Đối tác).
  - Kênh & Nền tảng (PlatformChannel dropdown + Channel Guidelines preview).

---

## 4. State Management & Data Flow Architecture

```
PostgreSQL (Neon)
       ▲
       │ Server Actions (mutations: submitIdeaAction, approveIdeaAction, etc.)
       ▼
src/app/page.tsx (Server Component, force-dynamic)
       │ getAllData() + getCurrentMember()
       ▼
src/app/components/ClientApp.tsx (Client Component)
       ├── State: openIdea, tab, filterChannelGroupId, filterPlatformId, etc.
       ├── useTransition() -> runAction() -> router.refresh()
       └── Child Views: DashboardView, BoardView, GanttView, ProductionTutorialView, IdeaSlideOverDrawer
```

### Key Properties:
- **`runAction` Wrapper**:
  ```tsx
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
  ```
- **Sync on Refresh**:
  When `router.refresh()` fires, `src/app/page.tsx` re-queries Neon Postgres via `getAllData()`, re-renders `ClientApp` with updated props. `useEffect` on `[ideas]` automatically updates `openIdea`:
  ```tsx
  useEffect(() => {
    if (openIdea) {
      const updated = ideas.find(i => i.id === openIdea.id);
      if (updated) setOpenIdea(updated);
    }
  }, [ideas]);
  ```

---

## 5. Requirement-by-Requirement UI Component Design

---

### R1. Interactive 9-Step SOP Tutorial & Operating Flow

#### Current Status
- `src/app/components/ProductionTutorialView.tsx` exists and lists the 9 stages with: `no`, `title`, `owner`, `ownerTone`, `input`, `work`, `output`, `guard`, `icon`.
- It is only reachable by clicking the sidebar item "Tutorial vận hành" (`tab === "tutorial"`).

#### UI Enhancements Needed
1. **Global Quick Access (Header / Anywhere Access)**:
   - Add a persistent header pill button next to user profile / settings in `ClientApp.tsx`:
     `<button onClick={() => setTab("tutorial")} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors"><Play size={13} /> SOP Quy trình (9 bước)</button>`.
   - Also allow opening a floating guide modal from within the Task Drawer.
2. **Interactive Step Breadcrumb in Task Detail Drawer**:
   - Above the drawer title, render an interactive 9-step mini-flow:
     `[01] ➔ [02] ➔ [03] ➔ [04] ➔ [05] ➔ [06] ➔ [07] ➔ [08] ➔ [09]`
   - Current stage is highlighted in vibrant color; past stages are green checkmarked; future stages are muted.
   - Clicking any step chip opens an inline collapsible card displaying the 5 mandatory fields:
     - **Người chịu trách nhiệm (Role)**: Editor / Producer / Core
     - **Input cần nhận**: Prerequisites & assets required
     - **Công việc phải làm (Tasks)**: Explicit division of Editor vs Producer duties
     - **Output phải bàn giao**: Concrete deliverables
     - **Điều kiện chuyển bước (Cổng kiểm duyệt)**: The exact gate check needed to advance.
3. **Data Specification for the 9 Stages**:
   | # | Tên Bước | Role | Input cần nhận | Tasks (Editor vs Producer) | Output | Điều kiện chuyển bước (Cổng) |
   |---|---|---|---|---|---|---|
   | 01 | Xây dựng Idea | Editor (Ban Đào tạo) | Định hướng từ Core, Call Pitching | **Editor**: Nghiên cứu insight, góc tiếp cận, chọn kênh phù hợp, viết brief. | Idea đề xuất / Brief | Chưa viết script hay dựng video ở bước này. |
   | 02 | Chốt & Giao Idea | Editor / Core | Idea / Content Brief | **Core**: Duyệt duyệt duyệt tính khả thi, giao Producer & ấn định deadline. | Idea đã chốt (Cổng 1) | Phải có Core duyệt mới mở quyền viết Script. |
   | 03 | Nộp Script | Producer (Ban Dự án) | Idea đã chốt | **Producer**: Viết ma trận 4 cột (Hook 3Ws, Body, Outro, CTA loop, Voice, Visual, BGM). | Bản nháp Script | Nộp đủ ma trận 4 cột & cam kết bản quyền. Hạn chót Thứ 4. |
   | 04 | Sửa & Duyệt Script | Editor (Ban Đào tạo) | Bản nháp Script | **Editor**: Thẩm định logic, thông điệp, nhịp dừng thoại gốc, duyệt bấm máy. | Script đã duyệt (Cổng 2) | Script chưa duyệt: Producer KHÔNG được quay dựng. |
   | 05 | Production & Assembly | Producer (Ban Dự án) | Script duyệt + Guidelines + Assets | **Producer**: Thu voice, footage, graphic, nhạc BGM/SFX, dựng bản nháp 16:9. | Video nháp 16:9 | Bám sát script duyệt, voice & visual làm song song. |
   | 06 | Nộp Video bàn giao | Producer (Ban Dự án) | Video nháp 16:9 + Source Project | **Producer**: Tự rà soát Production Checklist (7/7), xuất file source, upload link. | Gói bàn giao (Cổng 3) | Thiếu link source hoặc checklist < 7/7: KHÔNG cho nộp. |
   | 07 | QC & Hoàn thiện | Editor (Ban Đào tạo) | Gói bàn giao + Script + Source | **Editor**: Trực tiếp QC 8 tiêu chí, trực tiếp sửa hình/tiếng/subtitle, không trả Producer sửa vụn vặt. | Video hoàn thiện | Đạt 8/8 tiêu chuẩn QC Editor mới mở nút gửi Core. |
   | 08 | Core Duyệt chốt | Core + Editor | Video hoàn thiện từ Editor | **Core**: Thẩm định chất lượng thương hiệu và thông điệp cuối. Phê duyệt xuất bản. | Quyết định xuất bản (Cổng 5) | Chỉ Core mới có quyền mở khóa Publish. |
   | 09 | Publish & Analytics | Người đăng + Editor/Core | Video đã được duyệt chốt | **Publisher/Editor**: Đăng bài đúng format, theo dõi View, Retention, CTR, comment. Phản hồi về Bước 1. | Báo cáo & Insights | Insight lưu trữ làm input cho đợt Pitching tiếp theo. |

---

### R2. Strict Gating & Approval Enforcement UI

#### Core Architectural Problem
Currently, the status flow in `ClientApp.tsx` allows skipping critical gates:
- Editor can click "QA Đạt" (`qaPassAction`) directly from `QA`, which immediately jumps to `COMPLETE` and sets `published_link`, completely bypassing Core final review.
- Producer can submit video (`submitVideoAction`) with just an arbitrary link, even if no production checklist is checked and no source link is provided.

#### Gating State Machine Specification
We define 7 canonical lifecycle statuses + 2 termination statuses:
```
[PITCH]               -- Cổng 1 (Core duyệt Idea) -->
[ASSIGNMENT]          -- Producer nộp kịch bản -->
[SCRIPT]              -- Cổng 2 (Editor duyệt Script) -->
[PRODUCTION]          -- Cổng 3 (Producer nộp video + Checklist 7/7) -->
[EDITOR_QC] (hoặc QA) -- Cổng 4 (Editor QC 8/8 + hoàn thiện) -->
[CORE_REVIEW]         -- Cổng 5 (Core duyệt xuất bản) -->
[PUBLISH_ANALYTICS] (COMPLETE)
```

#### Detailed Gate UI Elements & Enforcements
1. **Cổng 1: Chốt Idea (PITCH ➔ ASSIGNMENT)**
   - UI: "Duyệt ý tưởng" button displayed **only for `actor.role === 'Core'`**.
   - Input: Selection of assigned Producer (`assignedToEmail`) and target duration days (`durationDays`).
   - If user is Editor or Producer: Displays badge `⏳ Chờ Core duyệt Idea` with tooltip explaining only Core can pass Gate 1.
2. **Cổng 2: Duyệt Script (SCRIPT ➔ PRODUCTION)**
   - UI: "Phê duyệt kịch bản" vs "Yêu cầu viết lại" displayed **only for `actor.role === 'E' || actor.role === 'Core'`**.
   - Gating check: Script must have Hook 3Ws filled, at least 4 rows in matrix, and copyright checkbox checked.
   - Script Locking: Once approved, the Script matrix becomes **read-only** for Producer. Producer cannot alter angles or lines.
   - Revision request: If Editor rejects, Producer gets status `SCRIPT_REVISION` with clear feedback notes.
3. **Cổng 3: Bàn giao Video (PRODUCTION ➔ QA / EDITOR_QC)**
   - UI: "Nộp video bàn giao" modal for assigned Producer.
   - Prerequisites check:
     - Production Checklist **must be 7/7 complete**.
     - Link Video Draft **required**.
     - Link Source Project / Thư mục Assets **required**.
   - If Production Checklist < 7/7:
     - Submit button is **disabled**.
     - Prominent warning box: `⚠️ Cổng 3 bị khóa: Bạn phải hoàn thành đủ 7/7 tiêu chí Production Checklist và đính kèm link Source Project trước khi nộp!`
4. **Cổng 4: QC Editor & Hoàn thiện (QA / EDITOR_QC ➔ CORE_REVIEW)**
   - UI: Editor QC Panel in Task Drawer with 8 interactive checkboxes.
   - Workflow rule: Editor directly edits the video project to perfection (fixing audio, pacing, subtitles) rather than sending back minor revisions to Producer.
   - Action button: `[✓ Gửi Core Duyệt Chốt]` is **disabled** until **8/8 QC items are checked**.
5. **Cổng 5: Core Duyệt Chốt (CORE_REVIEW ➔ COMPLETE / PUBLISH)**
   - UI: Displayed **only for `actor.role === 'Core'`**.
   - Action buttons:
     - `[🏆 Phê duyệt xuất bản (Core Pass)]`: Transitions to `COMPLETE` / Publish stage.
     - `[↩ Yêu cầu Editor chỉnh sửa lại]`: Feedback modal returning task to Editor with specific directions.
6. **Vòng lặp phản hồi (Analytics ➔ Bước 1)**:
   - In `COMPLETE` state, when Post-publish metrics (Views, Retention, CTR, Comments, Lessons) are entered:
   - Render button `[💡 Tạo Idea mới từ Insight này]`: Opens New Idea modal with pre-filled content referring to this task's analytics findings.

---

### R3. Standardized 4-Column Script Builder

#### Data Model (`ScriptData`)
Stored in `ideas.script_data` (JSON/TEXT column):
```typescript
export interface ScriptSegmentRow {
  id: string;
  timeRange: string;         // e.g. "00:00 - 00:15"
  segmentName: string;       // "Intro / Hook 3Ws" | "Thân bài" | "Kết bài / Outro" | "CTA & Loop"
  voiceText: string;         // Lời đọc chữ (Voice AI - Module B)
  visualNotes: string;       // Hình ảnh, Linh vật & Khoảng chêm Edit (Module C)
  audioSfx: string;          // Nhạc & Hiệu ứng (BGM/SFX)
  technicalPause?: string;   // Ghi chú khoảng dừng voice 3-5s chạy thoại gốc
}

export interface ScriptData {
  episodeTitle: string;
  channelName: string;       // "Kênh 1: Giáo dục & Ứng dụng" | "Kênh 2: Tâm lý & Phản biện"
  writerEmail: string;       // Producer
  submissionDeadline: string;// "Thứ 4 hàng tuần"
  hookWhat: string;          // 3Ws: What (Chuyện gì xảy ra?)
  hookWhen: string;          // 3Ws: When (Bối cảnh / Thời điểm nào?)
  hookWhy: string;           // 3Ws: Why (Tại sao người xem phải quan tâm?)
  hookMascotVisual: string;  // Linh vật & cảnh phim kịch tính
  outroSummaryCard: string;  // Tóm tắt & nội dung card chụp lưu
  ctaLoopQuestion: string;   // Câu hỏi thảo luận & câu nối mượt về hook
  rows: ScriptSegmentRow[];  // Danh sách dòng ma trận 4 cột
  copyrightConfirmed: boolean; // Cam kết bản quyền footage, nhạc, visual
  isApproved: boolean;       // Khóa chỉnh sửa nếu đã duyệt
  approvedByEmail?: string;
  approvedAt?: string;
}
```

#### UI Layout & Interaction Design
1. **Script Header Card**:
   - Displays Episode title, Channel selector, Author (Producer), Deadline notice (`📅 Hạn nộp: 23:59 Thứ 4 hàng tuần`).
   - If `isApproved === true`: Shows green lock badge `🔒 Kịch bản đã duyệt — Đã khóa chỉnh sửa`.
2. **Hook 3Ws Structured Builder**:
   - 3 prominent input boxes in a 3-column grid:
     - **What?** (Hiện tượng / câu hỏi bẻ ngược nhận thức)
     - **When?** (Bối cảnh tình huống / bộ phim)
     - **Why?** (Tại sao phải dừng lại xem tiếp?)
   - Note on visual: Linh vật biểu cảm + Cảnh phim cao trào.
3. **Interactive 4-Column Matrix Table**:
   - Full-width responsive table with 4 columns:
     - **Cột 1 (Thời gian / Phân đoạn)**: Pill selector (`Hook 00:00-00:15`, `Thân bài 00:15-03:30`, `Outro 03:30-04:30`, `CTA 04:30-05:00`).
     - **Cột 2 (Lời đọc chữ - Voice AI)**: Multi-line text area with word counter and estimated read-time.
     - **Cột 3 (Hình ảnh, Linh vật & Khoảng chêm Edit)**: Notes for footage source, mascot gesture, and technical pauses (`⏱ Dừng voice 3-5s`).
     - **Cột 4 (Nhạc & Hiệu ứng BGM/SFX)**: Sound mood, BGM name, SFX cues (Ting, Pop, Swoosh).
   - "Thêm dòng" (`+ Add Row`) and "Xóa dòng" buttons per row.
   - Preset button: "Nạp khung mẫu chuẩn YNDA" (Auto-fills the 4 standard segments).
4. **Outro & CTA / Seamless Loop Box**:
   - Dedicated card for Summary Card design (what key takeaway graphic is shown at 03:30-04:30).
   - CTA question + seamless loop text connecting smoothly back to the opening hook question.
5. **Copyright Commitment Checkbox**:
   - Required checkbox: `[ ] Tôi cam kết toàn bộ footage, âm thanh (BGM/SFX) và hình ảnh sử dụng đã được kiểm tra quyền sử dụng, không vi phạm bản quyền.`
6. **Locking Behavior**:
   - When script is approved by Editor, all inputs become `disabled` for the Producer. An Editor or Core can click "Mở khóa chỉnh sửa (Revision)" to allow revisions.

---

### R4. Dual Interactive Checklists UI

#### Data Model (`TaskChecklists`)
Stored in `ideas.checklists_data` (JSON/TEXT column):
```typescript
export interface ProductionChecklistState {
  voice_clear: boolean;        // Voice rõ ràng, phát âm chuẩn, không tạp âm/nhiễu
  footage_sourced: boolean;    // Footage bám sát script và có ghi rõ nguồn tư liệu
  bgm_copyright: boolean;      // BGM & SFX đã kiểm tra quyền sử dụng, không vi phạm bản quyền
  sub_safezone: boolean;       // Subtitle đúng chính tả, nằm trong vùng an toàn (safe zone)
  format_169: boolean;         // Định dạng chuẩn master ngang YouTube 16:9 (2 - 5 phút)
  metadata_proposal: boolean;  // Có đề xuất thumbnail, title và caption/hashtag
  source_exported: boolean;    // Đã xuất đầy đủ file source/project để Editor tiếp quản chỉnh sửa
}

export interface QcChecklistState {
  hook_3s: boolean;            // Hook 3 giây đầu đủ mạnh để giữ chân người xem
  content_aligned: boolean;    // Nội dung bám sát Idea và Script đã duyệt
  pacing_breath: boolean;      // Nhịp dựng có khoảng thở kỹ thuật, không dồn dập
  audio_balanced: boolean;     // Audio cân bằng âm lượng, voice nổi rõ trên nền BGM
  brand_identity: boolean;     // Subtitle, font chữ, màu sắc và layout đồng bộ nhận diện thương hiệu
  copyright_zero_risk: boolean;// Rủi ro bản quyền âm thanh/hình ảnh bằng 0
  cta_loop_smooth: boolean;    // CTA và seamless loop mượt mà, đúng định hướng
  yt_tech_standards: boolean;  // Video đạt chuẩn kỹ thuật YouTube trước khi trình Core duyệt
}
```

#### UI Interaction & Display Components
1. **Interactive Checkbox Component**:
   - Immediate feedback on click: Toggle sends an optimistic state update and calls `updateTaskChecklistAction(ideaId, checklistType, itemKey, boolean)`.
   - Visual styling: Checked item shows a bold checkmark, strike-through subtle text or green background tint (`bg-emerald-50/60 border-emerald-200 text-emerald-900`).
2. **Progress Indicator (Progress Bar & Badges)**:
   - **Production Progress**: `7/7 Hoàn thành` (100% = vibrant green badge, < 100% = purple badge `5/7 (71%)`).
   - **QC Progress**: `8/8 Đạt chuẩn` (100% = vibrant emerald badge, < 100% = blue badge `6/8 (75%)`).
   - Mini progress bar below the checklist header: `<div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${percent}%` }} /></div>`.
3. **Kanban Card Integration**:
   - In `BoardView` (task cards), render compact indicators:
     - For tasks in Production / QA:
       `<div className="flex items-center gap-1.5 text-[9px] font-bold">`
       `<span className="px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200">Prod: {prodCount}/7</span>`
       `<span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">QC: {qcCount}/8</span>`
       `</div>`
4. **Enforcement Logic**:
   - In Producer's "Nộp Video" dialog: Submit is disabled if `prodCount < 7`.
   - In Editor's "Gửi Core Duyệt" dialog: Action is disabled if `qcCount < 8`.

---

### R5. YouTube Master to TikTok Derivative Cutdown Workflow

#### Architecture & Flow
- A YouTube Master video (16:9, 2-5 min) that is approved/complete is the parent entity.
- A TikTok Cutdown is a child entity (30-45s, 9:16 vertical reframe) linked back to the Master via `parent_idea_id`.

#### UI Components
1. **Action Trigger in YouTube Master Drawer**:
   - When viewing an approved YouTube task (or task in `COMPLETE`), display a prominent button:
     `<Btn tone="default" onClick={onOpenTikTokCutdownModal} className="font-bold border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100"><Scissors size={13} /> Tạo nhánh TikTok Cutdown</Btn>`.
2. **TikTok Cutdown Creation Modal**:
   - Pre-populated fields:
     - **Video gốc (YouTube Master)**: Title + ID of parent video (read-only link).
     - **Tiêu đề nhánh TikTok**: Default `[TikTok Cutdown] ${master.title}`.
     - **Đoạn trích xuất (Time range)**: e.g. `01:15 - 01:55` (30 - 45 giây).
     - **Luận điểm độc lập / Cảm xúc cao**: Text input for why this section was selected.
     - **Phụ trách dựng TikTok (Producer)**: Select member.
     - **Target Deadline**: Specific date.
   - Pre-initialized **TikTok Derivative Checklist (5 items)**:
     1. `reframe_916`: Reframe bố cục dọc 9:16 chuyên nghiệp (không chỉ crop đơn thuần).
     2. `hook_03s`: Hook mới xuất hiện ngay 0 - 3 giây đầu.
     3. `sub_large`: Subtitle kích thước lớn, dễ đọc trên di động.
     4. `cta_navigation`: CTA điều hướng rõ ràng về video đầy đủ trên YouTube và Cộng đồng Facebook.
     5. `backlink_tracked`: Liên kết ngược ID/URL của video YouTube Master để đo lường tỷ lệ chuyển đổi.
3. **Bi-directional Linkage Display**:
   - **On Master Task Drawer**: Section "Các nhánh TikTok Cutdown phái sinh" with list of child tasks, their current stage, and direct click-to-open.
   - **On TikTok Task Drawer**: Header banner:
     `🔗 Video phái sinh từ Master: [Tên video YouTube]` with a clickable link that opens the parent Master task.
   - **On Kanban Cards**:
     - Master cards show: `🎬 Master (2 TikTok Cutdowns)` badge.
     - Cutdown cards show: `📱 TikTok 9:16 (Phái sinh)` badge.

---

### R6. Extended Task Lifecycle & Analytics Metadata UI

#### Form Sections & Organization in Task Detail Drawer
To avoid cluttering the drawer, we organize the metadata into 6 collapsible clean cards or sub-tabs:

1. **Section 1: Nền tảng & Kênh đại diện**
   - Nền tảng: Dropdown / Radio (YouTube Master 16:9 / TikTok Cutdown 9:16 / Facebook Reels).
   - Kênh đại diện:
     - Kênh 1: Giáo dục & Ứng dụng (Điện ảnh & Văn học)
     - Kênh 2: Tâm lý & Phản biện
2. **Section 2: Kho Liên kết Tài nguyên (Resource Hub)**
   - 5 structured link fields:
     - `linkMasterVideo`: Link video Master hoàn thiện (Drive / YouTube Unlisted).
     - `linkAssetFolder`: Thư mục Assets, footage thô & moodboard.
     - `linkScriptDoc`: Link tài liệu kịch bản Google Docs / Notion.
     - `linkVideoDraft`: Link video bản dựng nháp để Editor QC.
     - `linkSourceProject`: Link file project Premiere / After Effects / CapCut.
   - Each link field has quick "Mở link" (`ExternalLink`) and "Sao chép" (`Copy`) buttons.
3. **Section 3: Ma trận Phân công theo Cổng (Assignee Matrix)**
   - Displays clear ownership per gate:
     - Đề xuất Idea: Member Avatar + Name
     - Viết Script (Producer): Member Avatar + Name
     - Biên tập Script (Editor): Member Avatar + Name
     - Sản xuất Video (Producer): Member Avatar + Name
     - QC & Hoàn thiện (Editor): Member Avatar + Name
     - Phê duyệt chốt (Core): Member Avatar + Name
     - Xuất bản (Publisher): Member Avatar + Name
4. **Section 4: Hệ thống Deadline theo Cổng**
   - 4 specific dates:
     - `deadlineScript`: Deadline nộp kịch bản (Thứ 4 hàng tuần).
     - `deadlineProduction`: Deadline nộp video nháp (Thứ 6 / Thứ 7).
     - `deadlineQc`: Deadline Editor QC hoàn thiện (Thứ 7 / Chủ Nhật).
     - `targetPublishDate`: Lịch xuất bản chính thức.
   - Automated overdue indicators for each gate.
5. **Section 5: Trạng thái Bản quyền Tài nguyên (Copyright Hub)**
   - 3 Status indicators (Đạt / Chưa đạt / Đang thẩm định):
     - Footage: Nguồn phim & trích dẫn hợp lệ.
     - Âm nhạc: BGM & SFX có giấy phép hoặc royalty-free.
     - Visual & Linh vật: Đúng chuẩn nhận diện YNDA.
6. **Section 6: Thông tin Xuất bản & Chỉ số Analytics (Post-Publish Metrics)**
   - **Xuất bản**:
     - `publishedUrl`: Link bài đăng chính thức.
     - `publishTitle`: Tiêu đề đăng video.
     - `publishThumbnailUrl`: Link ảnh thumbnail.
     - `publishCaption`: Caption & Hashtags bài đăng.
   - **Chỉ số sau đăng (Post-Publish Metrics)**:
     - `viewsCount`: Lượt xem (Number).
     - `retentionRate`: Tỷ lệ giữ chân (Percentage, e.g. 48.5%).
     - `ctrRate`: Tỷ lệ nhấp chuột CTR (Percentage, e.g. 8.2%).
     - `commentsCount`: Lượng bình luận thảo luận (Number).
     - `lessonsLearned`: Bài học kinh nghiệm & Insights rút ra (TextArea).
   - **Vòng lặp phản hồi**:
     - Action button: `[💡 Tạo Idea mới từ Insight này]` (pre-populates a new idea pitch quoting these metrics).

---

## 6. Proposed Modular Component Hierarchy

To prevent `ClientApp.tsx` (already 4,674 lines) from becoming unmaintainable, the new components should be created in modular files inside `src/app/components/` and imported into `ClientApp.tsx`:

```
src/app/components/
├── ClientApp.tsx                    # Shell, routing, global state, modals dispatcher
├── ProductionTutorialView.tsx       # Enhanced R1 9-step tutorial view
├── TaskDetailDrawer/
│   ├── IdeaSlideOverDrawer.tsx      # Main drawer container
│   ├── StepFlowIndicator.tsx        # 9-Step mini visual stepper
│   ├── GateApprovalBar.tsx          # R2 Gating buttons, alerts & role actions
│   ├── ScriptMatrixSection.tsx      # R3 4-Column Script viewer & editor trigger
│   ├── DualChecklistSection.tsx     # R4 Production (7) & QC (8) checklist toggles
│   ├── DerivativeCutdownSection.tsx # R5 TikTok cutdown branch info & child list
│   └── MetadataSections.tsx         # R6 Resource links, deadlines, copyright, analytics
├── modals/
│   ├── ScriptBuilderModal.tsx       # R3 Full 4-column script builder modal
│   ├── TikTokCutdownModal.tsx       # R5 Modal for creating 9:16 cutdown task
│   └── RevisionFeedbackModal.tsx    # R2 Rejection / revision feedback dialog
└── shared/
    ├── GateAlertBanner.tsx          # Blocked gate warnings
    └── ProgressBar.tsx              # Reusable checklist progress bar
```

---

## 7. Existing Build Defects & Exact Fix Guidance

During verification with TypeScript compiler (`npx tsc --noEmit`), **3 JSX syntax errors** were detected in `src/app/components/ClientApp.tsx`:

### Error 1: Line 1903
- **Current code**:
  ```tsx
  <p className="text-[11px] text-slate-500 mt-1">Chuột phải vào Chủ đề trên Discord -> <b>Sao chép liên kết</b> rồi dán vào đây để bot tự gửi tin vào đúng chủ đề kênh này.</p>
  ```
- **Error**: `Unexpected token. Did you mean {'>'} or &gt;?`
- **Fix**: Replace `->` with `&rarr;` or `→` or `-&gt;`:
  ```tsx
  <p className="text-[11px] text-slate-500 mt-1">Chuột phải vào Chủ đề trên Discord → <b>Sao chép liên kết</b> rồi dán vào đây để bot tự gửi tin vào đúng chủ đề kênh này.</p>
  ```

### Error 2: Line 1979
- **Current code**:
  ```tsx
  <p className="text-[11px] text-slate-500 mt-1">Chuột phải vào Chủ đề trên Discord -> <b>Sao chép liên kết</b> rồi dán vào đây để bot tự gửi tin vào đúng chủ đề kênh này.</p>
  ```
- **Error**: `Unexpected token. Did you mean {'>'} or &gt;?`
- **Fix**: Replace `->` with `&rarr;` or `→` or `-&gt;`:
  ```tsx
  <p className="text-[11px] text-slate-500 mt-1">Chuột phải vào Chủ đề trên Discord → <b>Sao chép liên kết</b> rồi dán vào đây để bot tự gửi tin vào đúng chủ đề kênh này.</p>
  ```

### Error 3: Line 2082
- **Current code**:
  ```tsx
  <option value="5. Personal Branding (Chuyên môn & Nhân vật)">5. Personal Branding — Chuyên môn -> Xây dựng nhân vật (tính cách, phân tích hành vi)</option>
  ```
- **Error**: `Unexpected token. Did you mean {'>'} or &gt;?`
- **Fix**: Replace `->` with `→` or `-&gt;`:
  ```tsx
  <option value="5. Personal Branding (Chuyên môn & Nhân vật)">5. Personal Branding — Chuyên môn → Xây dựng nhân vật (tính cách, phân tích hành vi)</option>
  ```

---

## 8. Implementation Roadmap for Implementer

1. **Step 1 (Fix Syntax Errors)**: Fix lines 1903, 1979, 2082 in `ClientApp.tsx` so `npx tsc --noEmit` compiles cleanly.
2. **Step 2 (Database Schema Extensions)**: Add columns in `src/lib/db.ts` (`ensureSchema`):
   - `script_data JSONB/TEXT`
   - `checklists_data JSONB/TEXT`
   - `parent_idea_id VARCHAR(100)`
   - `cutdown_details JSONB/TEXT`
   - `resource_links JSONB/TEXT`
   - `copyright_status JSONB/TEXT`
   - `post_publish_metrics JSONB/TEXT`
   - `gate_deadlines JSONB/TEXT`
3. **Step 3 (Server Actions)**: Extend `src/actions/idea-actions.ts` with gating actions (`saveScriptAction`, `approveScriptAction`, `requestScriptRevisionAction`, `updateChecklistAction`, `submitForQcAction`, `approveQcAction`, `approveCorePublishAction`, `createTikTokCutdownAction`, `saveAnalyticsAction`).
4. **Step 4 (UI Components)**: Build modular subcomponents in `src/app/components/` and integrate into `ClientApp.tsx` (Drawer, Modals, Kanban cards, and Header SOP button).
5. **Step 5 (Verification & Build)**: Run `npx tsc --noEmit` and `npm run build` to guarantee 100% clean compilation.
