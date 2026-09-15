# Original User Request

## 2026-09-12T17:12:22Z

Build **FOCUS (Harlan Focus / Blitz Focus)** — a native Windows desktop focus timer and task management application built in C# .NET WPF. The application implements the "Blitz" distraction-free philosophy ("Càng tập trung → giao diện càng nhỏ"), featuring an adaptive 3-tier shrinking focus workflow that progressively minimizes the UI as deep work begins: Full Blitz screen → Compact Always-On-Top floating bar → Draggable Mini Clock widget.

Working directory: d:\harlan-focus
Integrity mode: development

## Requirements

### R1. Core Data Models & Local Persistence
- Implement data structures and JSON/SQLite local storage for:
  - **List**: `Id`, `Name`, `Icon`, `Color`, `Tasks[]`, `IsArchived`, `CreatedAt`.
  - **Task**: `Id`, `ListId`, `Title`, `Description`, `EstimatedMinutes`, `DueDate`, `Priority` (Low, Medium, High), `Status` (Backlog, ThisWeek, Today, Done), `CompletedAt`.
  - **FocusSession**: `Id`, `TaskId`, `DurationMinutes`, `RemainingSeconds`, `StartedAt`, `IsPaused`, `IsCompleted`.
  - **AppSettings**: Window positions, mini-clock coordinates, always-on-top preferences.
- Natural Language Task Input parser: parse strings like `"Study Math 50m tomorrow"` into `Title: "Study Math"`, `Duration: 50`, `Date: Tomorrow`.
- Include a unit test project (`HarlanFocus.Tests`) covering models, state machine transitions, and natural language parsing.

### R2. Home View & List Management (UI Shell)
- Modern Dark-themed UI (#101010 background, #171717 cards, #2B2B2B borders, vibrant accent gradients for Blitz actions).
- Left Sidebar: User profile/workspace header, "+ Create new list" action (modal for name, icon, color), "All My Lists", and "Archived Lists".
- Main Dashboard: Grid of List Cards displaying List Name, Icon, pending tasks count, progress bar (`Completed/Total`), total estimated time, "OPEN →" button, and list options menu (Rename, Change Color/Icon, Archive, Delete).
- "Create List" card at the end of the grid.
- Active Blitz Banner on Home when a timer is currently running, showing task name, time remaining, and an "OPEN" button to quickly jump back to focus mode.

### R3. List Detail & Kanban Workflow
- Header with Back to Home button, list selector dropdown, and list summary statistics.
- 4 Status Columns:
  1. **Backlog**: Unscheduled tasks with "+ ADD TASK" button.
  2. **This Week**: Tasks scheduled for current week with hours estimate and completion counter.
  3. **Today**: Priority tasks for today with "+ ADD TASK" and the prominent **🚀 BLITZ NOW** button.
  4. **Done**: Completed tasks list.
- Task Card: Displays title, description excerpt, priority badge, estimated minutes, and quick menu.
- Task Creation form / popup supporting quick title, duration, date, and priority input.

### R4. Adaptive 3-Tier Blitz Focus Modes
- **Tier 1 — Full Blitz Window**:
  - Distraction-free view removing all sidebars, cards, and peripheral UI.
  - Shows current task title, category/list name, huge digital countdown timer (`MM:SS`), and session controls.
  - Controls: `PAUSE` / `RESUME`, `COMPLETE` (marks task Done, logs session), `SKIP` (advances to next task in Today), `RESTART` (resets countdown).
  - Window controls: Back to List, Fullscreen toggle, Close, and `↓ MINIMIZE` button.
- **Tier 2 — Compact List Bar**:
  - Sleek horizontal floating bar designed to sit atop active work windows (e.g. Word, IDE, browser).
  - Always-On-Top (`Topmost = true`), draggable anywhere on screen.
  - Contains: 🏠 Home button, List Name, Task Title, countdown timer, Pause/Resume toggle, and `↓` Shrink to Mini Clock button.
- **Tier 3 — Mini Clock Widget**:
  - Ultra-minimalist floating countdown pill/widget.
  - Always-On-Top, draggable, remembers last screen coordinates upon repositioning.
  - Displays countdown timer and task name.
  - Single click toggles quick action controls (`⏸`, `✓`, `↗` expand to compact, `🏠` home).
  - Double-click restores the Full Blitz or Compact view.

### R5. Single Active Session & Transition Lifecycle
- Enforce a single active Blitz session: prevent concurrent sessions and prompt for confirmation before switching tasks if a session is currently active.
- Completing a session automatically moves the task from Today to Done and updates completion statistics.
- Audio/visual notification cue when the timer reaches 00:00.

## Acceptance Criteria

### Automated Build & Unit Tests
- [ ] Solution compiles cleanly via `dotnet build` without errors.
- [ ] Unit tests in `HarlanFocus.Tests` execute via `dotnet test` and pass 100%:
  - [ ] Natural language task parsing (duration, title, relative dates).
  - [ ] State transitions between Backlog, ThisWeek, Today, and Done.
  - [ ] Timer countdown logic, pause, resume, and completion state transitions.
  - [ ] Single active session conflict check.

### Home & List Management
- [ ] User can create a new list with custom name, icon, and color; list card appears on Home.
- [ ] List cards accurately compute and display pending task count, progress ratio, and total estimated time.
- [ ] User can navigate into a list and see the 4 Kanban columns (Backlog, This Week, Today, Done).
- [ ] User can add a task to Today with title and estimated duration.

### 3-Tier Blitz Transitions
- [ ] Clicking "🚀 BLITZ NOW" on Today starts countdown and switches to Full Blitz view.
- [ ] Clicking "↓ MINIMIZE" in Full Blitz shrinks the interface into the floating Compact List bar.
- [ ] Compact List bar is draggable and stays Always-On-Top over other applications.
- [ ] Clicking "↓" in Compact List shrinks to the Mini Clock floating pill.
- [ ] Mini Clock is draggable, stays Always-On-Top, and double-clicking or clicking expand restores Compact/Full Blitz.
- [ ] Clicking "COMPLETE" in any Blitz tier marks the task as Done, moves it to Done column, and terminates the focus session.
- [ ] If a Blitz session is active, navigating to Home displays the Active Blitz banner with remaining time and an "OPEN" button.

## 2026-09-15T10:30:18Z

Nâng cấp và tích hợp toàn diện Quy trình & Định dạng Sản xuất Video chuẩn của dự án "Ý Niệm Điện Ảnh" (YNDA) vào hệ thống web quản lý nội bộ, bao gồm giao diện Tutorial 9 bước, cổng kiểm duyệt bắt buộc (state machine gating), form kịch bản chuẩn 4 cột với Hook 3Ws, checklist sản xuất & QC độc lập, luồng phái sinh YouTube Master sang TikTok 9:16, và bổ sung trường siêu dữ liệu quản lý vòng đời video.

Working directory: /run/media/harlan/New Volume/workflow
Integrity mode: development

## Requirements

### R1. Interactive 9-Step SOP Tutorial & Operating Flow
Cung cấp giao diện hướng dẫn trực quan (Tutorial / Flowchart) cho toàn bộ quy trình 9 bước sản xuất video:
1. Xây dựng Idea (Editor - Ban Đào tạo)
2. Chốt & Giao Idea (Editor/Core)
3. Nộp Script (Producer - Ban Dự án)
4. Sửa & Duyệt Script (Editor - Ban Đào tạo)
5. Production & Assembly (Producer - Ban Dự án)
6. Nộp Video bàn giao (Producer - Ban Dự án)
7. QC & Hoàn thiện (Editor - Ban Đào tạo)
8. Core Duyệt chốt (Core + Editor)
9. Publish & Analytics (Người đăng + Editor/Core)

Mỗi bước phải hiển thị đầy đủ và rõ ràng 5 trường thông tin:
- Người chịu trách nhiệm (Role)
- Input cần nhận
- Công việc phải làm (nội dung cụ thể, phân định rõ giữa Editor và Producer)
- Output phải bàn giao
- Điều kiện chuyển bước (Cổng kiểm duyệt)

### R2. Strict Gating & Approval Enforcement (Cổng kiểm duyệt bắt buộc)
Thiết lập cơ chế kiểm soát trạng thái nghiêm ngặt để không cho phép nhảy bước hoặc thực hiện sai quy trình:
- Cổng 1 (Chốt Idea): Không duyệt Idea → không mở nhiệm vụ viết Script.
- Cổng 2 (Duyệt Script): Không duyệt Script → không cho chuyển sang trạng thái Production. Producer không tự ý đổi angle/nội dung khi kịch bản đã được duyệt.
- Cổng 3 (Bàn giao Video): Chưa điền đủ link tài nguyên, source dự án hoặc chưa hoàn thành checklist sản xuất → không cho nộp video nháp.
- Cổng 4 (QC Editor): Video chưa đạt tiêu chuẩn QC của Editor → không gửi Core duyệt. Editor trực tiếp chỉnh sửa hoàn thiện, tránh vòng lặp yêu cầu Producer sửa vụn vặt.
- Cổng 5 (Core Duyệt): Core chưa duyệt chốt → không mở trạng thái Publish.
- Vòng lặp phản hồi: Dữ liệu Analytics sau đăng phải được lưu trữ và phản hồi ngược về Bước 1 để cải thiện ý tưởng tiếp theo.

### R3. Standardized 4-Column Script Builder (Form Kịch bản Chuẩn)
Xây dựng form nhập liệu và quản lý kịch bản chuẩn theo cấu trúc:
- Thông tin định danh: Tên tập, Kênh (Kênh 1: Giáo dục & Ứng dụng / Kênh 2: Tâm lý & Phản biện), Người viết (Producer), Deadline nộp (thứ 4 hàng tuần).
- Cấu trúc 4 phân đoạn chuẩn:
  + Intro / Hook (00:00 - 00:15): Bắt buộc cấu trúc 3Ws (What - When - Why), ghi chú visual linh vật và cảnh phim kịch tính.
  + Thân bài (00:15 - 03:30): Mổ xẻ 2-3 luận điểm, có khoảng chêm kỹ thuật (dừng voice 3-5s chạy thoại gốc phim), bảng từ khóa, linh vật chỉ dẫn.
  + Kết bài / Outro (03:30 - 04:30): Tóm tắt thông điệp cốt lõi và Summary Card để người xem lưu lại.
  + CTA & Seamless Loop (04:30 - 05:00): Câu hỏi mở thảo luận và câu kết nối mượt quay về Hook mở bài.
- Ma trận 4 cột hiển thị: Thời gian / Phân đoạn | Lời đọc chữ (Module B - Voice AI) | Hình ảnh, Linh vật & Khoảng chêm Edit (Module C) | Nhạc & Hiệu ứng (BGM/SFX).
- Cam kết bản quyền: Checkbox xác nhận quyền sử dụng footage, âm nhạc và hình ảnh minh họa.

### R4. Dual Interactive Checklists (Production & Editor QC)
Triển khai 2 bộ checklist kiểm tra độc lập có lưu trữ trạng thái trực tiếp trên từng task:
- **Production Checklist (cho Producer trước khi bàn giao)**:
  + Voice rõ ràng, phát âm chuẩn, không tạp âm/nhiễu.
  + Footage bám sát script và có ghi rõ nguồn tư liệu.
  + BGM & SFX đã kiểm tra quyền sử dụng, không vi phạm bản quyền.
  + Subtitle đúng chính tả, nằm trong vùng an toàn (safe zone).
  + Định dạng chuẩn master ngang YouTube 16:9 (2 - 5 phút).
  + Có đề xuất thumbnail, title và caption/hashtag.
  + Đã xuất đầy đủ file source/project để Editor tiếp quản chỉnh sửa.
- **QC Checklist (cho Editor trước khi chuyển Core)**:
  + Hook 3 giây đầu đủ mạnh để giữ chân người xem.
  + Nội dung bám sát Idea và Script đã duyệt.
  + Nhịp dựng có khoảng thở kỹ thuật, không dồn dập.
  + Audio cân bằng âm lượng, voice nổi rõ trên nền BGM.
  + Subtitle, font chữ, màu sắc và layout đồng bộ nhận diện thương hiệu.
  + Rủi ro bản quyền âm thanh/hình ảnh bằng 0.
  + CTA và seamless loop mượt mà, đúng định hướng.
  + Video đạt chuẩn kỹ thuật YouTube trước khi trình Core duyệt.

### R5. YouTube Master to TikTok Derivative Cutdown Workflow
Tạo luồng xử lý phái sinh chuyên biệt khi video YouTube Master được duyệt:
- Cho phép tạo task phái sinh TikTok từ video YouTube Master.
- Tiêu chuẩn trích xuất: Cắt 30 - 45 giây đắt giá nhất có luận điểm độc lập, cảm xúc cao.
- Checklist phái sinh TikTok:
  + Reframe bố cục dọc 9:16 chuyên nghiệp (không chỉ crop đơn thuần).
  + Hook mới xuất hiện ngay 0 - 3 giây đầu.
  + Subtitle kích thước lớn, dễ đọc trên di động.
  + CTA điều hướng rõ ràng về video đầy đủ trên YouTube và Cộng đồng Facebook.
  + Liên kết ngược ID/URL của video YouTube Master để đo lường tỷ lệ chuyển đổi.

### R6. Extended Task Lifecycle & Analytics Metadata
Bổ sung các trường dữ liệu cần thiết cho từng video/task:
- Nền tảng: YouTube Master / TikTok Cutdown / Facebook Reels.
- Kênh đại diện: Kênh 1 (Điện ảnh & Văn học) / Kênh 2 (Tâm lý & Phản biện).
- Liên kết tài nguyên: Link Master Video, Link thư mục Asset, Link Script doc, Link Video Draft / Final, Link source project.
- Người phụ trách hiện tại (Active Assignee theo từng cổng).
- Hệ thống Deadline theo từng cổng: Deadline Script, Deadline Production, Deadline QC, Target Publish.
- Trạng thái bản quyền tài nguyên (Bản quyền footage, nhạc, linh vật).
- Thông tin xuất bản: Link bài đăng chính thức, Tiêu đề, Thumbnail, Caption, Hashtag.
- Chỉ số sau xuất bản (Post-publish Metrics): Lượt xem (Views), Tỷ lệ giữ chân (Retention), Tỷ lệ click (CTR), Lượng bình luận (Comments) và Bài học/Insight rút ra.

## Acceptance Criteria

### Gating & State Progression
- [ ] Task không thể chuyển từ Pitch/Idea sang Script nếu chưa có trạng thái duyệt từ Editor/Core.
- [ ] Task không thể chuyển sang Production nếu Script chưa được Editor phê duyệt hoàn chỉnh.
- [ ] Khi nộp video nháp (Production -> QC), hệ thống yêu cầu link bàn giao và xác nhận Production Checklist.
- [ ] Editor QC view hiển thị đầy đủ các tiêu chí kiểm tra; chỉ khi đạt QC mới mở nút gửi Core duyệt.
- [ ] Trạng thái Publish bị khóa cho đến khi Core thực hiện thao tác duyệt chốt.

### Script Matrix & Form Inputs
- [ ] Form Script yêu cầu nhập đầy đủ Hook 3Ws (What, When, Why), bảng ma trận 4 cột (Thời gian, Voice, Visual/Linh vật, BGM/SFX) và checkbox cam kết bản quyền.
- [ ] Kịch bản đã duyệt được khóa chỉnh sửa trực tiếp đối với Producer trừ khi được gửi yêu cầu chỉnh sửa (Revision).

### Interactive Checklists & TikTok Branch
- [ ] Cả Production Checklist và Editor QC Checklist đều tương tác được (checkbox toggle), lưu trữ trạng thái vào cơ sở dữ liệu và hiển thị tiến độ hoàn thành trên thẻ task.
- [ ] Từ một video YouTube Master đã hoàn thiện/duyệt, người dùng có thể kích hoạt nhánh tạo video TikTok Cutdown với các trường mục tiêu riêng (30-45s, 9:16 reframe, hook 0-3s, CTA điều hướng YouTube).

### Code Quality & Build Verification
- [ ] Chạy lệnh `npm run build` thành công, không phát sinh lỗi TypeScript (`tsc`) hay ESLint.
- [ ] Các trường dữ liệu mới tương thích với dữ liệu hiện có mà không làm gãy các luồng xem cũ (Kanban, Gantt, Dashboard, Portfolio).
