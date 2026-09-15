# BÁO CÁO BÀN GIAO KHẢO SÁT HỆ THỐNG DỮ LIỆU & STATE MACHINE (HANDOFF REPORT)

**Agent**: Data Layer & State Machine Explorer  
**Thư mục làm việc**: `/run/media/harlan/New Volume/workflow/.agents/explorer_survey_ynda_1`  
**Báo cáo chi tiết**: `/run/media/harlan/New Volume/workflow/.agents/explorer_survey_ynda_1/survey_report.md`  
**Thời gian**: 2026-09-15T18:05:00+07:00  

---

## 1. OBSERVATION (Quan Sát Trực Tiếp & Dẫn Chứng)

1. **Database & ORM Architecture**:
   - `package.json` (dòng 11–22) chứa dependencies:
     ```json
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
     ```
     *Nhận định*: `@prisma/client` và `prisma` **không có** trong `package.json`.
   - File `src/generated/prisma/schema.prisma` (dòng 6–8) có nội dung:
     ```prisma
     datasource db {
       provider = "sqlite"
     }
     ```
     Không hề được import ở bất cứ đâu trong `src/` (lệnh `grep_search` với từ khóa `generated/prisma` và `prisma` trong `src/` trả về `No results found`).
   - Module kết nối CSDL thực tế tại `src/lib/db.ts` (dòng 1–17) sử dụng trực tiếp `@neondatabase/serverless`:
     ```ts
     import { neon } from '@neondatabase/serverless';
     function getDatabaseUrl(): string {
       const url = process.env.POSTGRES_URL || process.env.DATABASE_URL;
       if (!url) throw new Error("Missing POSTGRES_URL or DATABASE_URL environment variable.");
       return url;
     }
     export function getDb() {
       return neon(getDatabaseUrl());
     }
     ```
   - Migration và khởi tạo bảng được thực hiện qua `init-postgres.mjs` (dòng 17–165) và hàm `ensureSchema(sql)` trong `src/lib/db.ts` (dòng 45–81) bằng các câu lệnh raw SQL `ALTER TABLE ideas ADD COLUMN IF NOT EXISTS ...`.

2. **Cấu trúc Model & Trạng thái Hiện có**:
   - Bảng trung tâm là `ideas` (định nghĩa interface `Idea` tại `src/lib/types.ts:56-97`), đại diện cho vòng đời video task.
   - Trạng thái nhiệm vụ được lưu dưới dạng `VARCHAR(50)` và được định nghĩa kiểu chuỗi tại `src/lib/types.ts:46-54`:
     ```ts
     export type IdeaStatus = 
       | "PITCH" 
       | "ASSIGNMENT" 
       | "SCRIPT" 
       | "PRODUCTION" 
       | "QA" 
       | "COMPLETE" 
       | "ARCHIVED_IDEA"
       | "CANCELLED";
     ```
   - Trật tự hiển thị cột Kanban tại `src/app/components/ClientApp.tsx:79`:
     ```ts
     const STATUS_ORDER = ["PITCH", "ASSIGNMENT", "SCRIPT", "PRODUCTION", "QA", "COMPLETE"] as const;
     ```

3. **Backend API Contracts**:
   - Ứng dụng không có REST routes (`src/app/api/` không tồn tại file `route.ts`).
   - 100% các đột biến dữ liệu được thực thi thông qua Next.js Server Actions trong `src/actions/`:
     - `src/actions/idea-actions.ts`: 15 actions (`submitIdeaAction`, `approveIdeaAction`, `submitScriptAction`, `startProductionAction`, `submitVideoAction`, `qaPassAction`, `qaFailAction`, `reassignIdeaAction`, `updateIdeaDetailsAction`, `extendDeadlineAction`, `updateScheduledPostDateAction`, `archiveUnselectedIdeasAction`, `restoreArchivedIdeaAction`, `deleteIdeaAction`, `cancelIdeaAction`, `rateIdeaAction`, `cloneIdeaAction`, `triggerDailyCronAction`).
     - `src/actions/checklist-actions.ts`: To-do list thành viên cá nhân độc lập (chưa gắn với Idea/Task).

4. **Lỗi TypeScript Tiền Ẩn Trong Mã Nguồn**:
   - Chạy kiểm tra tĩnh `npx tsc --noEmit` phát hiện 3 lỗi cú pháp JSX tiền định tại `src/app/components/ClientApp.tsx`:
     ```
     src/app/components/ClientApp.tsx:1903:100 - error TS1382: Unexpected token. Did you mean `{'>'}` or `&gt;`?
     src/app/components/ClientApp.tsx:1979:100 - error TS1382: Unexpected token. Did you mean `{'>'}` or `&gt;`?
     src/app/components/ClientApp.tsx:2082:115 - error TS1382: Unexpected token. Did you mean `{'>'}` or `&gt;`?
     ```

---

## 2. LOGIC CHAIN (Chuỗi Suy Luận)

1. Từ **Observation 1**, ta xác định: Mã nguồn đã chuyển dịch từ Google Sheets/Prisma sang **Neon Serverless PostgreSQL** bằng direct SQL. Do đó, việc nâng cấp cơ sở dữ liệu cho SOP mới **phải sử dụng migration SQL trên Neon** (qua `init-postgres.mjs` và hàm `ensureSchema` trong `src/lib/db.ts`) kết hợp cập nhật kiểu TypeScript trong `src/lib/types.ts`. Không cố gắng kết nối Prisma Client khi runtime không có gói `@prisma/client`.
2. Từ **Observation 2**, phân tích đối chiếu với yêu cầu R2 (5 Cổng kiểm duyệt bắt buộc):
   - Cổng 1 (Chốt Idea): Hiện tại chỉ Core được duyệt (`member.role !== "Core"`), cần mở quyền cho cả Editor (`member.role === 'Core' || member.role === 'E'`).
   - Cổng 2 (Duyệt Script): Hiện tại Producer chỉ nộp URL link qua `submitScriptAction`, không có form kịch bản chuẩn 4 cột (Hook 3Ws, Body, Outro, CTA loop); không có cơ chế khóa kịch bản (Content Locking) hay yêu cầu sửa kịch bản (Revision). Cần bổ sung cột `script_data JSONB`, `script_status`, `script_locked BOOLEAN`.
   - Cổng 3 (Bàn giao Video): Hiện tại `submitVideoAction` chỉ nhận 1 link `videoLink`, không kiểm tra link source project, asset folder, và hoàn toàn không có checklist sản xuất. Cần thêm 2 trường link và bắt buộc `production_checklist` đạt 100% (7/7 items).
   - Cổng 4 (QC Editor): Hiện tại `qaPassAction` trực tiếp nhảy cóc sang `COMPLETE`. Cần tách ra trạng thái `CORE_REVIEW`, bắt buộc `qc_checklist` đạt 100% (8/8 items) và cờ duyệt của Editor.
   - Cổng 5 (Core Duyệt): Bắt buộc chỉ `member.role === 'Core'` mới được duyệt mở khóa trạng thái Xuất bản (`READY_TO_PUBLISH` / `COMPLETE`).
3. Từ **Observation 2 & 3**, phân tích lưu trữ Kịch bản 4 Cột (R3) và Checklists (R4):
   - Thay vì tạo bảng quan hệ phụ (`scripts`, `task_checklists`) gây phân mảnh và chậm truy vấn trên Neon serverless pooler, phương án lưu trữ `script_data JSONB`, `production_checklist JSONB`, `qc_checklist JSONB`, `tiktok_checklist JSONB` ngay trên bảng `ideas` đảm bảo tính toàn vẹn (atomic), nạp tức thì trong 1 câu truy vấn `SELECT * FROM ideas`, và tương thích ngược 100% với các màn hình Kanban, Gantt, Portfolio.
4. Từ **Observation 3**, đối với luồng phái sinh TikTok (R5):
   - Bổ sung quan hệ tự tham chiếu trên `ideas`: `parent_task_id VARCHAR(100)`, `derivative_type VARCHAR(50) DEFAULT 'NONE'`, `source_video_url TEXT`. Thêm các trường mục tiêu TikTok (`tiktok_target_duration`, `tiktok_reframe_applied`, `tiktok_hook_summary`, `tiktok_cta_route`) và bộ checklist TikTok 5 mục.
5. Từ **Observation 3 & 4**, đối với metadata xuất bản & chỉ số Analytics (R6):
   - Mở rộng bảng `ideas` với các trường tài nguyên, deadline từng cổng, trạng thái bản quyền (footage, music, mascot), thông tin bài đăng, và các chỉ số sau xuất bản (`metrics_views`, `metrics_retention`, `metrics_ctr`, `metrics_comments`, `metrics_insights`) để hồi quy về Bước 1.

---

## 3. CAVEATS (Điểm Lưu Ý & Giới Hạn)

1. **Môi trường Sandbox Node.js**: Lệnh `npm run build` trong sandbox gặp lỗi phân giải DNS do sandbox chặn mạng ra `registry.npmjs.org` để tải binary SWC (`@next/swc-wasm-nodejs`). Tuy nhiên, lệnh kiểm tra cú pháp TypeScript độc lập `npx tsc --noEmit` chạy nội bộ thành công và đã phát hiện chính xác 3 lỗi JSX escaping tại dòng 1903, 1979, 2082 của `src/app/components/ClientApp.tsx`.
2. **Cơ sở Dữ liệu Trực tiếp**: Chuỗi kết nối `POSTGRES_URL` trong `.env` trỏ tới cụm database Neon trên AWS. Mọi câu lệnh migration `ALTER TABLE` phải dùng cú pháp an toàn `ADD COLUMN IF NOT EXISTS` để không làm mất dữ liệu sản xuất hiện hữu.

---

## 4. CONCLUSION (Kết Luận & Kiến Nghị Triển Khai)

1. **Kiến trúc Dữ liệu**:
   - Sử dụng Neon PostgreSQL direct query via `@neondatabase/serverless` và lưu trữ các cấu trúc động (Kịch bản 4 cột, Checklist sản xuất 7 tiêu chí, Checklist QC 8 tiêu chí, Checklist TikTok 5 tiêu chí) dưới dạng các cột `JSONB` trên bảng `ideas`.
2. **State Machine**:
   - Mở rộng luồng trạng thái từ 6 trạng thái thành chuỗi kiểm soát chặt chẽ có cổng:
     `PITCH` (Cổng 1) -> `ASSIGNMENT` -> `SCRIPT` (Cổng 2) -> `PRODUCTION` (Cổng 3) -> `QA` (Cổng 4) -> `CORE_REVIEW` (Cổng 5) -> `COMPLETE / READY_TO_PUBLISH` -> `PUBLISHED`.
3. **Kế hoạch Thực thi Kế tiếp**:
   - Bước 1: Khai báo các cột mới trong `init-postgres.mjs` và hàm `ensureSchema` trong `src/lib/db.ts`.
   - Bước 2: Bổ sung các kiểu dữ liệu và mở rộng interface `Idea` trong `src/lib/types.ts`.
   - Bước 3: Cập nhật mapper `getAllData()` trong `src/lib/db.ts` để bóc tách các trường mới.
   - Bước 4: Viết các Server Actions mới/nâng cấp trong `src/actions/idea-actions.ts`.
   - Bước 5: Sửa 3 lỗi JSX syntax trong `ClientApp.tsx` và gắn các modal/components giao diện tương tác tương ứng.

---

## 5. VERIFICATION METHOD (Phương Pháp Độc Lập Xác Minh)

1. **Kiểm tra Cú pháp TypeScript**:
   ```bash
   export PATH=/usr/lib/chatgpt/resources/cua_node/bin:$PATH
   npx tsc --noEmit
   ```
   *Kỳ vọng sau khi sửa lỗi*: Không còn bất kỳ lỗi TypeScript nào phát sinh.
2. **Kiểm tra Tự động Migration**:
   ```bash
   export PATH=/usr/lib/chatgpt/resources/cua_node/bin:$PATH
   node -e "import('./src/lib/db.ts').then(m => m.getAllData()).then(() => console.log('DB Schema OK')).catch(console.error)"
   ```
3. **Kiểm tra File Tài Liệu**:
   - Xem file chi tiết: `/run/media/harlan/New Volume/workflow/.agents/explorer_survey_ynda_1/survey_report.md`
