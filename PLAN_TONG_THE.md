# KẾ HOẠCH TỔNG THỂ — YNDA WORKSPACE

Phiên bản: 1.0  
Cập nhật: 18/09/2026  
Workspace: `D:\workflow`  
Trạng thái tài liệu: Kế hoạch triển khai chính thức, dùng làm nguồn tham chiếu chung.

> Đọc file này trước khi sửa tiếp sản phẩm. `WORKLOG.md` dùng để ghi tiến độ thực tế; file này mô tả đích đến, thứ tự và tiêu chí nghiệm thu.

---

## 1. Mục tiêu sản phẩm

YNDA Workspace là nơi đội ngũ quản lý trọn vòng đời một sản phẩm nội dung:

```text
Định hướng kênh
    ↓
Đợt pitching
    ↓
Idea → duyệt / yêu cầu sửa
    ↓
Kịch bản → duyệt / yêu cầu sửa
    ↓
Voice + assets + production
    ↓
Producer tự QC
    ↓
Editor QC và hoàn thiện
    ↓
Core duyệt cuối
    ↓
Chuẩn bị đăng → đăng → lưu URL
    ↓
Analytics → bài học → quay lại định hướng
```

Sản phẩm phải trả lời rõ bốn câu hỏi cho mọi thành viên:

1. Tôi cần làm gì hôm nay?
2. Tôi đang chờ ai hoặc ai đang chờ tôi?
3. Đầu ra nào được coi là đạt?
4. Nếu có lỗi, sửa gì, ai sửa và hạn bao giờ?

## 2. Nguyên tắc thiết kế

### 2.1. Logic trước giao diện

- Trạng thái trên màn hình phải phản ánh dữ liệu thật trong cơ sở dữ liệu.
- Không hiển thị “đã lưu”, “đã kết nối”, “đã đăng” khi backend chưa xác nhận.
- Mọi thao tác quan trọng phải có điều kiện chuyển trạng thái và kiểm tra quyền ở server.
- Không dùng giao diện đẹp để che một luồng nghiệp vụ còn mơ hồ.

### 2.2. Một nguồn sự thật

- Một state machine cho toàn bộ vòng đời công việc.
- Một implementation chính cho mỗi hành động: nộp script, duyệt QC, Core duyệt, publish.
- Không duy trì nhiều action cùng tên ở nhiều file nếu chúng có logic khác nhau.
- Mỗi asset, script và bản video đều có phiên bản; approval gắn với đúng phiên bản.

### 2.3. Dễ hiểu cho thành viên mới

- Dùng tiếng Việt nhất quán; thuật ngữ tiếng Anh chỉ giữ khi team đang dùng thực tế.
- Mỗi form giải thích mục đích của trường nhập bằng một câu ngắn và ví dụ cụ thể.
- Hiển thị bước hiện tại, điều kiện hoàn thành và người nhận tiếp theo.
- Hướng dẫn mở được ngay tại màn hình đang làm.

### 2.4. An toàn và có thể phục hồi

- Nháp không bị mất khi tải lại trang hoặc mạng chập chờn.
- Double click, retry hay refresh không tạo bản ghi trùng.
- File và token không nằm trong client bundle, URL công khai hoặc git.
- Những thao tác không thể hoàn tác cần quyền phù hợp và xác nhận rõ.

### 2.5. Tích hợp là mô-đun thay thế được

- Logic dự án không phụ thuộc cứng vào Hugging Face, YouTube hoặc TikTok.
- Từng provider có adapter riêng và có thể ở trạng thái chưa kết nối.
- Luồng thủ công vẫn dùng được khi API ngoài chưa sẵn sàng.

---

## 3. Phạm vi trách nhiệm

### 3.1. Phần logic và workspace cần hoàn thiện trong dự án

- Xác thực, session và phân quyền.
- State machine và điều kiện chuyển bước.
- Quản lý idea, script, production, QC, Core review và publish package.
- Nháp tự lưu, versioning, audit log và notification nội bộ.
- Quản lý file metadata, audio job, publishing job và trạng thái lỗi.
- Trang hướng dẫn quy trình công khai, tách khỏi workspace đăng nhập.
- Cấu trúc điều hướng, dashboard, form và các trạng thái giao diện.
- Test nghiệp vụ, bảo mật, lỗi mạng, retry và race condition.

### 3.2. Phần kết nối có thể giao cho AI khác hoặc làm sau

- Tạo/cấu hình model hoặc Space Hugging Face.
- Adapter Hugging Face/Gradio cụ thể.
- Google Cloud project, OAuth consent và YouTube API verification.
- TikTok developer app, review và Content Posting API.
- Chọn nhà cung cấp object storage và khai báo credentials.

Các tích hợp này phải tuân theo contract do backend YNDA định nghĩa. Tài liệu bàn giao:

- `Tinhnangngoai/Note/BACKEND_HUGGING_FACE.md`
- `Tinhnangngoai/Note/API_YOUTUBE_TIKTOK.md`

---

## 4. Hiện trạng tại thời điểm lập kế hoạch

| Hạng mục | Hiện trạng | Được tính là hoàn thành chưa? |
|---|---|---|
| SOP | Đã chuẩn hóa 12 quy trình trong `src/lib/workflow-guide.ts` đủ 10 thành phần, 8 giai đoạn, ví dụ sạch và bài tập | CODE / HOÀN THIỆN NỘI DUNG |
| Trang hướng dẫn | Tuyến `/huong-dan` công khai, không cần đăng nhập, không tải dữ liệu nội bộ, tìm kiếm có/không dấu, lọc vai trò/giai đoạn, nhãn "Cần đăng nhập", responsive từ 360px | DONE (đã test tsc/lint file/build/360px) |
| Form idea | Đã có prototype 3 bước và xem trước | Chưa; chưa test DB, draft server và chống trùng |
| Tự lưu | Đã có localStorage theo tài khoản | Chưa; chưa sync DB, conflict hoặc đổi thiết bị |
| State machine | Type đã có thêm Core Review và Ready to Publish | Chưa; các action cũ/mới còn trùng và chưa đồng bộ |
| Phòng âm thanh | Đã có prototype chia đoạn/nghe/tải/ghép WAV | Chưa; chưa có job persistence và provider chạy ổn định |
| Upload video | Có route ghi filesystem cục bộ | Chưa; không phù hợp Vercel/file lớn và chưa có object storage |
| Trang đăng | Có prototype chuẩn bị metadata và xác nhận URL | Chưa; chưa có publishing job/versioning/provider thật |
| Hugging Face | Đã tạo Space private `Harlanitsk/ynda-voice-studio`; build đang lỗi | Chưa; dừng tại đây theo quyết định mới |
| YouTube/TikTok | Có tài liệu lấy API | Chưa; chưa có OAuth/token store/upload thật |
| Build | `tsc` và production build từng pass; lint file mới còn 1 lỗi | Chưa đạt quality gate đầy đủ |
| Deploy | Chưa commit/push/deploy thay đổi hiện tại | Không |

Quy tắc: code đã viết nhưng chưa có bằng chứng test chỉ được ghi là `PROTOTYPE` hoặc `CODE`, không ghi `DONE`.

---

## 5. Vai trò và quyền

### 5.1. Producer (`P`)

Được phép:

- Xem định hướng, đợt pitching và công việc được giao.
- Tạo/lưu/nộp idea của mình.
- Viết và nộp script cho công việc được giao.
- Tạo voice, cập nhật asset và nộp video production cho công việc mình phụ trách.
- Đọc feedback, sửa và nộp lại.
- Bình luận trong công việc liên quan.

Không được phép:

- Duyệt idea/script/QC/Core.
- Sửa cấu hình kênh hoặc thành viên.
- Thay asset final sau khi Core duyệt.
- Kết nối hoặc dùng token tài khoản nền tảng.
- Xác nhận video đã đăng.

### 5.2. Editor (`E`)

Được phép:

- Làm mọi việc của Producer khi được giao.
- Đánh giá idea và script theo quyền được cấu hình.
- QC, yêu cầu sửa, hoàn thiện và gửi Core.
- Chuẩn bị publish package và thực hiện đăng thủ công/API nếu kênh đã cấp quyền.
- Theo dõi báo cáo và feedback.

Không được phép:

- Tự Core-approve sản phẩm cuối nếu không có vai trò Core.
- Đổi chiến lược/kênh hoặc cấu hình bảo mật ngoài phạm vi được cấp.
- Bỏ qua phiên bản đã được duyệt.

### 5.3. Core (`Core`)

Được phép:

- Quản lý định hướng, kênh, đợt pitching, thành viên và deadline.
- Duyệt idea và giao người phụ trách.
- Duyệt cuối sản phẩm.
- Quản lý kết nối nền tảng và cấu hình provider.
- Xem audit, báo cáo tổng và thực hiện hành động quản trị.

Core vẫn phải tuân thủ state machine; quyền cao không đồng nghĩa được bỏ qua dữ liệu bàn giao bắt buộc.

### 5.4. Ma trận quyền tối thiểu

| Hành động | Producer | Editor | Core |
|---|---:|---:|---:|
| Tạo/lưu/nộp idea | Của mình | Có | Có |
| Duyệt idea | Không | Có nếu được giao | Có |
| Nộp script | Công việc được giao | Công việc được giao | Có |
| Duyệt script | Không | Có | Có |
| Nộp production | Công việc được giao | Có | Có |
| QC | Không | Có | Có |
| Core duyệt cuối | Không | Không | Có |
| Chuẩn bị đăng | Xem | Có | Có |
| Kết nối kênh/API | Không | Không | Có |
| Xác nhận đã đăng | Không | Có | Có |
| Xóa vĩnh viễn | Không | Không | Core + chính sách lưu trữ |

Tất cả quyền được kiểm tra lại ở server; ẩn nút trên UI không phải phân quyền.

---

## 6. State machine chuẩn

### 6.1. Trạng thái hiển thị

```text
DRAFT_IDEA
PITCH
IDEA_REVISION
ASSIGNMENT
SCRIPT_DRAFT
SCRIPT_REVIEW
SCRIPT_REVISION
PRODUCTION
PRODUCTION_REVIEW
QA
QC_REVISION
CORE_REVIEW
CORE_REVISION
READY_TO_PUBLISH
PUBLISHING
SCHEDULED
PUBLISHED
ARCHIVED
CANCELLED
```

Không nhất thiết giữ tất cả trong một cột `status`. Có thể tách `workflow_stage`, `review_state` và `publication_state` để tránh enum phình to. UI có thể gom chúng thành nhãn dễ hiểu.

### 6.2. Điều kiện chuyển bước

| Từ | Hành động | Sang | Điều kiện bắt buộc |
|---|---|---|---|
| Draft idea | Nộp idea | Pitch | Trường bắt buộc hợp lệ, idempotency key, đợt còn mở |
| Pitch | Duyệt | Assignment | Assignee, deadline script và người duyệt |
| Pitch | Yêu cầu sửa | Idea revision | Feedback cụ thể, hạn sửa, cho phép nộp lại |
| Assignment/Script draft | Nộp script | Script review | Script version hoàn chỉnh, source/reference |
| Script review | Duyệt | Production | Approval gắn script version, khóa bản duyệt |
| Script review | Yêu cầu sửa | Script revision | Feedback theo phân cảnh và deadline |
| Production | Nộp draft | QA | Video version, source, checklist self-QC |
| QA | QC đạt | Core review | QC checklist đủ, final review version |
| QA | Yêu cầu sửa | QC revision | Timecode, owner, deadline, tiêu chí đạt |
| Core review | Duyệt | Ready to publish | Core approval gắn final asset version |
| Core review | Yêu cầu sửa | Core revision | Lý do và điểm cần sửa |
| Ready to publish | Bắt đầu đăng | Publishing | Publish package đủ, kênh khả dụng |
| Publishing | Hẹn lịch | Scheduled | Platform xác nhận lịch/ID nếu dùng API |
| Publishing/Scheduled | Xác nhận URL | Published | URL hợp lệ, đúng kênh, kiểm tra công khai |

### 6.3. Quy tắc versioning

- `idea_version`: tăng khi sửa nội dung idea sau feedback.
- `script_version`: tăng khi sửa script; approval lưu `approved_script_version`.
- `video_version`: tăng mỗi lần Producer/Editor thay bản dựng.
- `final_asset_version`: bản được Core duyệt.
- Thay video final sau Core approval làm mất hiệu lực approval hoặc tạo revision mới cần duyệt lại.
- Publish job lưu đúng `final_asset_version`; không lấy “file mới nhất” tại thời điểm worker chạy.
- Feedback luôn tham chiếu loại đối tượng, version và vị trí/timecode.

### 6.4. Quy tắc lỗi và retry

- Mutation có idempotency key hoặc unique constraint phù hợp.
- Side effect Discord/email xảy ra sau commit chính; lỗi thông báo không được làm người dùng nộp lại dữ liệu đã lưu.
- Job ngoài có `attempt`, `last_error`, `next_retry_at` và giới hạn retry.
- Trước retry publish, kiểm tra external job/video ID để tránh đăng trùng.
- Người dùng nhìn thấy lỗi có thể hành động, không chỉ “Có lỗi xảy ra”.

---

## 7. Cấu trúc dữ liệu mục tiêu

### 7.1. Giữ và chuẩn hóa các bảng hiện có

- `members`
- `channel_groups`
- `platforms`
- `platform_channels`
- `ideas`
- `pitching_batches`
- `comments`
- `notifications`
- `audit_logs`
- `checklists`

Các cột JSON trong `ideas` nên dần tách thành bảng versioned nếu cần truy vấn/lịch sử. Không migrate một lần quá lớn; dùng migration tăng dần và có backfill kiểm chứng.

### 7.2. Bảng cần bổ sung

#### `sessions`

| Cột | Mục đích |
|---|---|
| `id_hash` | Hash session token, không lưu token thô |
| `member_id` | Chủ phiên |
| `expires_at` | Hết hạn |
| `revoked_at` | Thu hồi |
| `created_at`, `last_seen_at` | Audit phiên |
| `user_agent_hash` | Hỗ trợ phát hiện/rà phiên, không cần lưu toàn bộ |

#### `idea_drafts`

| Cột | Mục đích |
|---|---|
| `id`, `owner_id` | Nháp thuộc người dùng |
| `pitching_batch_id`, `platform_channel_id` | Ngữ cảnh nháp |
| `content_json` | Nội dung form |
| `revision` | Optimistic concurrency |
| `submitted_idea_id` | Chống submit lại nháp đã nộp |
| `updated_at`, `submitted_at` | Đồng bộ/trạng thái |

#### `script_versions`

| Cột | Mục đích |
|---|---|
| `idea_id`, `version` | Phiên bản script |
| `content_json` | Matrix phân cảnh |
| `created_by`, `created_at` | Tác giả/lịch sử |
| `submitted_at` | Đã nộp review |
| `approved_at`, `approved_by` | Approval đúng phiên bản |

#### `media_assets`

| Cột | Mục đích |
|---|---|
| `id`, `idea_id` | Liên kết công việc |
| `kind` | voice, footage, draft, final, thumbnail, source… |
| `object_key` | Khóa private trong storage |
| `content_type`, `size_bytes`, `checksum` | Kiểm tra file |
| `version`, `status` | Version/quarantine/ready/deleted |
| `uploaded_by`, `created_at` | Audit |

#### `review_requests` và `review_feedback`

- Lưu gate, target type/version, reviewer, result, deadline và timestamp.
- Feedback có location/timecode, category, severity, owner và resolved state.
- Không ghi đè feedback cũ bằng một chuỗi `qaFeedback` duy nhất.

#### `voice_profiles`

- Kênh sở hữu, provider, model/version.
- Loại preset/reference/fine-tuned.
- Reference asset ID hoặc external voice ID.
- Trạng thái draft/processing/ready/failed/archived.
- Consent/provenance note cho mẫu giọng.

#### `audio_jobs` và `audio_segments`

- Job gắn idea, script version, voice profile version.
- Segment giữ thứ tự, text hash, status, output asset và lỗi.
- Job status: queued, running, partial, complete, failed, cancelled.
- Regenerate một đoạn không làm mất các đoạn đã đạt.

#### `channel_connections`

- Platform, external channel ID/name, encrypted token payload, scopes, expiry.
- Trạng thái connected, expired, revoked, action_required.
- Chỉ Core quản lý; secret không trả về client.

#### `publish_packages` và `publishing_jobs`

- Package: final asset version, title, caption, hashtag, thumbnail, lịch đăng.
- Job: provider, external upload/post ID, state, attempt, error, timestamps.
- Mỗi package/channel có idempotency constraint.

#### `analytics_snapshots`

- External post ID, mốc đo, views, retention, CTR, comments và raw provider snapshot khi cần.
- Không ghi đè số liệu cũ; lưu chuỗi thời gian.

### 7.3. Migration an toàn

1. Tạo bảng/cột mới nullable.
2. Backfill theo batch và ghi số bản ghi trước/sau.
3. Chạy read path song song hoặc feature flag.
4. Chuyển write path sang schema mới.
5. Xác nhận dữ liệu và audit.
6. Chỉ thêm `NOT NULL`/unique constraint khi dữ liệu sạch.
7. Chưa xóa cột cũ cho đến khi có bản backup và một chu kỳ vận hành ổn định.

---

## 8. Kiến trúc backend

### 8.1. Phân lớp

```text
UI / Route
   ↓
Application service (use case)
   ↓
Domain rules / state machine / permission policy
   ↓
Repository + transaction
   ↓
Postgres / Object storage / Job provider / External API
```

Server Action/Route Handler chỉ làm:

- Xác thực request và parse input.
- Gọi application service.
- Trả kết quả typed.

Không để mỗi action tự viết lại permission, SQL, state check và Discord side effect theo cách riêng.

### 8.2. Module đề xuất

```text
src/server/auth/
src/server/workflow/
src/server/ideas/
src/server/scripts/
src/server/reviews/
src/server/media/
src/server/audio/
src/server/publishing/
src/server/analytics/
src/server/notifications/
src/server/audit/
```

Mỗi module có:

- `schema.ts`: input validation.
- `policy.ts`: quyền.
- `service.ts`: use case/transaction.
- `repository.ts`: truy vấn.
- `types.ts`: contract nội bộ.
- Test tập trung vào nghiệp vụ thay vì snapshot giao diện.

### 8.3. Xác thực và session

Ưu tiên P0:

- Không tin email do cookie client cung cấp làm danh tính.
- Sau login hợp lệ, sinh token ngẫu nhiên đủ mạnh; cookie chỉ chứa token opaque.
- DB lưu hash token, member, expiry và revoke.
- Cookie: `HttpOnly`, `Secure` ở production, `SameSite=Lax/Strict` phù hợp, path `/`.
- Rotate session sau login/đổi mật khẩu; logout thu hồi server-side.
- Rate limit login và mutation nhạy cảm.
- `getCurrentMember` trả từ session đã kiểm chứng.
- Page chưa đăng nhập không gọi/serialize toàn bộ dữ liệu dự án.

### 8.4. Transaction và outbox

- Mutation chính + audit + notification intent nằm cùng transaction khi khả thi.
- Discord/external notification dùng outbox/job sau commit.
- UI nhận `success`, entity ID/version và cảnh báo side effect nếu cần.
- Không ném lỗi Discord như thể mutation chính đã thất bại.

### 8.5. File storage

Contract logic độc lập provider:

- `createUploadIntent`
- `completeUpload`
- `getDownloadUrl`
- `deleteOrArchiveAsset`

Nếu deploy serverless:

- Browser upload trực tiếp object storage bằng signed URL.
- Backend xác nhận metadata/checksum sau upload.
- Không proxy video lớn qua Next.js function.

Nếu deploy VPS:

- Volume bền vững ngoài source repo.
- Backup, quyền filesystem, quota và cleanup job.

### 8.6. Background jobs

Các việc cần job:

- Tạo audio nhiều đoạn.
- Ghép/chuẩn hóa media phía server nếu cần.
- Upload và theo dõi trạng thái publish.
- Đồng bộ analytics.
- Discord/email retry.

Job cần idempotency, visibility timeout/lease, retry có backoff và dead-letter/manual retry.

---

## 9. Cấu trúc không gian làm việc

### 9.1. Điều hướng cấp một

#### Nhóm “Công việc”

- Việc của tôi
- Ý tưởng & sản xuất
- Lịch phát hành
- Inbox

#### Nhóm “Công cụ”

- Phòng âm thanh
- Trang đăng video
- Tài nguyên kênh

#### Nhóm “Theo dõi”

- Báo cáo & analytics
- Timeline/Gantt (chỉ giữ nếu team thực sự dùng)
- Portfolio

#### Nhóm “Quản trị” — Core

- Kênh & nền tảng
- Thành viên & quyền
- Kết nối dịch vụ
- Audit log

#### Luôn có

- Hướng dẫn quy trình
- Hồ sơ cá nhân

### 9.2. Trang “Việc của tôi”

Mục tiêu: mở web là biết việc cần làm.

Cấu trúc:

1. “Cần tôi xử lý” — nút hành động trực tiếp.
2. “Sắp đến hạn” — trong 72 giờ.
3. “Đang chờ người khác” — ghi rõ đang chờ ai và từ khi nào.
4. “Bị trả sửa” — feedback gần nhất và hạn nộp lại.
5. “Hoàn thành gần đây” — tối đa 5 mục.

Mỗi card hiển thị:

- Tên công việc, kênh/nền tảng.
- Bước hiện tại.
- Hành động của người đang xem.
- Deadline và mức cảnh báo.
- Người nhận tiếp theo.
- Trạng thái lưu/phiên bản liên quan.

Không hiển thị nhiều KPI tổng quan trên đầu nếu người dùng không thể hành động từ chúng.

### 9.3. Khu “Ý tưởng & sản xuất”

Hai cách xem:

- Danh sách mặc định để tìm/lọc/đọc dễ.
- Board theo bước để họp vận hành.

Bộ lọc:

- Kênh, nền tảng, đợt pitching.
- Bước, reviewer/assignee.
- Trễ hạn, chờ tôi, bị block.
- Từ khóa và tag.

Board phải có đủ cột nghiệp vụ hoặc nhóm gọn:

- Idea
- Script
- Production
- QC
- Core review
- Chờ đăng
- Đã đăng

Card không nhồi toàn bộ metadata; mở drawer/trang chi tiết để xem lịch sử.

### 9.4. Form idea

Luồng đề xuất:

#### Bước 1 — Chọn hướng

- Kênh/nền tảng.
- Đợt pitching hoặc idea tự đề xuất.
- Tuyến nội dung.
- Hiển thị định hướng/format/reference của kênh.

#### Bước 2 — Phát triển ý

- Tên idea.
- Insight.
- Hook dự kiến.
- Vấn đề/phạm vi.
- Góc nhìn.
- Ba luận điểm.
- Giá trị người xem nhận được.
- CTA.
- Reference/footage.

#### Bước 3 — Xem và nộp

- Bản đọc như một pitch hoàn chỉnh.
- Cảnh báo trường thiếu và deadline.
- Chỉ đóng form/xóa nháp sau server xác nhận thành công.

Tự lưu:

- Debounce, không ghi localStorage ở mọi keystroke đồng bộ.
- Hiện “Đang lưu / Đã lưu lúc… / Mất mạng / Có xung đột”.
- DB draft là nguồn chính khi online; local là fallback.
- Khi hai tab sửa cùng nháp, dùng revision để báo conflict.

### 9.5. Trang chi tiết công việc

Thay drawer dài bằng một trang có URL riêng: `/work/[id]`.

Header:

- Tên, kênh, bước, deadline, assignee.
- Hành động chính theo vai trò.
- Blocker/trễ hạn.

Tabs:

- Tổng quan
- Idea
- Script
- Tài nguyên & voice
- Production
- Review/feedback
- Publish
- Lịch sử

Panel bên phải hoặc section đầu:

- Điều kiện hoàn thành bước hiện tại.
- Ai đang giữ việc.
- Người nhận tiếp theo.
- Checklist còn thiếu.

### 9.6. Script workspace

- Matrix phân cảnh: time range, mục đích, voice, visual/footage/graphic/subtitle, BGM/SFX, reference.
- Thêm/xóa/sắp xếp hàng rõ ràng.
- Autosave draft + version history.
- So sánh phiên bản khi revision.
- Comment/feedback gắn hàng hoặc time range.
- Khi approved, bản đó read-only; “Tạo bản sửa” sinh version mới.

### 9.7. Phòng âm thanh

Khi logic backend đã sẵn sàng:

- Chọn công việc + script version approved.
- Chọn voice profile đúng kênh.
- Hiển thị provider/model/version và trạng thái thật.
- Chia đoạn tự động nhưng cho chỉnh.
- Mỗi đoạn có text, số từ, status, audio player, regenerate và lỗi.
- Generate all chạy job nền; reload vẫn theo dõi được.
- Ghép file chỉ khi tất cả đoạn đạt hoặc cho phép tải partial rõ ràng.
- Output lưu thành media asset version và gắn vào công việc.

Các trạng thái:

- Chưa cấu hình provider.
- Provider khởi động/cold start.
- Đang xếp hàng.
- Đang tạo X/Y.
- Partial failure.
- Hết quota/cần thao tác quản trị.
- Complete.

### 9.8. Production và QC

Producer:

- Xem script approved và asset checklist.
- Upload/link draft + source project.
- Self-QC trước khi nộp.

Editor:

- Player/URL và script đặt cạnh nhau.
- Feedback theo timecode/category/severity.
- Có nút “Đánh dấu đã sửa” và reviewer xác nhận.
- QC checklist lưu người kiểm tra và thời gian.
- “Gửi Core” chỉ bật khi điều kiện đủ.

Core:

- Chỉ xem final review version.
- Tóm tắt QC, rủi ro và publish package dự kiến.
- Duyệt hoặc yêu cầu sửa cụ thể.

### 9.9. Trang đăng video

Ba nhóm:

- Chờ Core duyệt.
- Chờ đăng/đang đăng/hẹn lịch.
- Đã đăng/lỗi.

Publish package:

- Final asset/version.
- Kênh ngoài đã chọn và danh tính hiển thị rõ.
- Title, caption, hashtag, thumbnail.
- Lịch và timezone.
- Chế độ đăng: thủ công hoặc provider API.

Luồng thủ công:

1. Tải/mở final asset.
2. Mở nền tảng chính thức.
3. Người dùng đăng/hẹn lịch.
4. Dán URL/ID chính thức.
5. Hệ thống kiểm tra format URL và lưu Published sau xác nhận.

Luồng API:

1. Tạo publishing job.
2. Hiển thị progress thật.
3. Lưu external ID.
4. Poll/webhook trạng thái.
5. Chỉ ghi Published khi provider xác nhận phù hợp.

### 9.10. Trang hướng dẫn

Đây là **trang công khai độc lập**, không yêu cầu đăng nhập và không phụ thuộc dữ liệu workspace. URL chính: `/huong-dan`.

Yêu cầu truy cập:

- Người chưa đăng nhập mở trực tiếp `/huong-dan` và đọc đầy đủ nội dung.
- Route không gọi `getAllData`, không đọc member/session để dựng nội dung và không redirect sang login.
- Nội dung SOP lấy từ dữ liệu tĩnh đã kiểm duyệt trong source hoặc nguồn public riêng.
- Không nhúng email thành viên, deadline nội bộ, link Drive private, webhook, token, ID tài nguyên nhạy cảm hoặc ảnh có dữ liệu thật.
- Nếu nút “Mở công cụ” dẫn vào workspace cần đăng nhập, phải ghi rõ “Cần đăng nhập” và giữ nguyên vị trí người dùng muốn tới sau login.
- Trang dùng layout/header riêng; không hiện sidebar, notification, tìm kiếm công việc hoặc thông tin tài khoản của workspace.

Mục tiêu đọc hiểu:

- Trong 30 giây: hiểu dự án đi từ định hướng đến analytics.
- Trong 3 phút: biết vai trò Core, Editor, Producer và các cổng duyệt.
- Khi chọn một quy trình: biết input, người làm, hành động, output, người nhận và deadline/SLA.
- Người mới có thể tìm đúng hướng dẫn bằng tên việc hoặc câu hỏi như “nộp idea”, “tạo voice”, “đăng video”.

Cấu trúc trang:

1. Hero ngắn: “Từ một idea đến video đã đăng”.
2. Sơ đồ vận hành tổng có thể bấm từng bước.
3. “Bạn đang ở vai trò nào?” với ba lối vào Core, Editor và Producer.
4. Tìm kiếm không dấu và bộ lọc vai trò/giai đoạn/công cụ.
5. Danh mục SOP.
6. Nội dung SOP theo 6 phần.
7. Glossary trạng thái và mẫu bàn giao/feedback.
8. Ngày cập nhật, phiên bản tài liệu và người duyệt nội dung.

Mỗi SOP phải có:

- Mục tiêu, khi nào dùng và người sử dụng.
- Bối cảnh, input, output, công cụ và SLA.
- Các bước theo mẫu: Input → Người làm → Hành động → Output → Người nhận → Deadline.
- Minh họa lấy từ UI cuối cùng, đã làm mờ dữ liệu riêng; đánh số vùng thao tác và có alt text.
- Ví dụ đúng; thêm ví dụ sai khi giúp tránh lỗi phổ biến.
- Tiêu chí đánh giá, cách phản hồi và mẫu feedback.
- Bài luyện tập/onboarding.
- Liên kết màn hình thật; nhãn rõ nếu màn hình cần đăng nhập.

Nghiệm thu riêng cho trang công khai:

- Mở cửa sổ ẩn danh vào `/huong-dan` trả HTTP 200 và đọc được toàn bộ SOP.
- Network log không có request lấy members, ideas, notifications, settings hoặc dữ liệu dự án.
- Source/HTML public không chứa secret hay dữ liệu cá nhân nội bộ.
- Search hoạt động với tiếng Việt có dấu và không dấu.
- Điều hướng bằng bàn phím, focus, heading và link có nhãn rõ.
- Dùng được ở 360 px, tablet và desktop.
- Khi JavaScript tải chậm, nội dung cốt lõi vẫn hiển thị được; ưu tiên Server Component/static rendering cho nội dung, Client Component nhỏ cho tìm/lọc.

### 9.11. Giao diện chung

- Một màu nhấn chính, màu trạng thái chỉ dùng khi mang ý nghĩa.
- Giảm gradient, emoji trang trí, badge và card lồng card.
- Kiểu chữ, khoảng cách, input, table, modal và empty state thống nhất.
- Hành động chính mỗi màn hình tối đa một nút nổi bật.
- Desktop ưu tiên danh sách/table; mobile dùng card gọn.
- Modal chỉ cho tác vụ ngắn; tác vụ dài dùng trang riêng.
- Focus, label, keyboard, contrast và reduced motion phải dùng được.

---

## 10. Hệ thống thông báo và bàn giao

### 10.1. Sự kiện cần thông báo

- Được giao idea/script/production/review.
- Đợt pitching mới/gần hết hạn.
- Nộp sản phẩm thành công.
- Yêu cầu sửa và deadline.
- Trễ hạn hoặc blocker.
- Core duyệt/chuyển chờ đăng.
- Publish thất bại/cần kết nối lại.
- Video đã đăng/analytics đến kỳ xem.

### 10.2. Inbox trong app

- Nhóm theo công việc.
- Đánh dấu đã đọc không làm mất action item.
- Notification dẫn thẳng đến đúng tab/version/feedback.
- Có ưu tiên: cần làm, cảnh báo, thông tin.

### 10.3. Discord

- Là kênh thông báo, không phải nguồn dữ liệu chính.
- Webhook lỗi được retry qua outbox.
- Không đưa token, link signed nhạy cảm hoặc dữ liệu riêng vào message.
- Mỗi event có dedupe key để tránh gửi trùng.

---

## 11. Analytics và vòng phản hồi

Mốc đề xuất:

- 24 giờ.
- 7 ngày.
- 28 ngày hoặc cuối kỳ chiến dịch.

Mỗi snapshot lưu:

- Thời điểm đo và tuổi bài.
- Views/reach.
- Retention/watch time.
- CTR nếu nền tảng cung cấp.
- Comments/shares/saves nếu cần.
- Ghi chú định tính.

Insight bắt buộc có:

1. Dữ liệu quan sát.
2. Giả thuyết.
3. Thay đổi cho nội dung tiếp theo.
4. Owner và thời điểm kiểm chứng.

Không kết luận dựa trên view đơn lẻ hoặc so các video ở mốc tuổi khác nhau mà không ghi rõ.

---

## 12. Xử lý ngoại lệ quan trọng

| Tình huống | Hành vi mong muốn |
|---|---|
| Đợt pitching hết hạn khi form đang mở | Giữ nháp; chặn submit; cho chọn đợt khác hoặc idea tự đề xuất nếu policy cho phép |
| Kênh bị archive | Không cho tạo mới; công việc cũ vẫn đọc được |
| Double click submit | Một idea duy nhất |
| Mạng mất khi autosave | Lưu local, báo offline, sync khi online |
| Hai tab sửa cùng nháp | Báo conflict, không âm thầm ghi đè |
| Assignee bị vô hiệu hóa | Giữ lịch sử; yêu cầu Core reassign |
| Script sửa sau duyệt | Tạo version mới, mất hiệu lực cho production mới |
| Final video thay sau Core duyệt | Yêu cầu Core duyệt lại version mới |
| Audio provider hết quota | Giữ job/text/đoạn đã xong; cho retry sau |
| Một audio segment lỗi | Job partial, regenerate riêng đoạn |
| Publish request timeout | Kiểm tra external ID/status trước retry |
| OAuth token hết hạn/revoked | Chuyển action_required; không xóa package |
| Hẹn lịch trên platform | Ghi Scheduled, không ghi Published |
| URL bài đăng sai nền tảng | Chặn xác nhận và giải thích format đúng |
| Discord lỗi | Dữ liệu chính vẫn thành công; outbox retry |

---

## 13. Lộ trình triển khai

### Giai đoạn 0 — Đóng băng và chuẩn hóa nền tảng

Mục tiêu: biết chính xác code nào là nguồn chính.

Việc làm:

- Ghi snapshot schema và action hiện tại.
- Liệt kê action trùng giữa `idea-actions`, `script-actions`, `production-actions`, `qc-actions`, `core-actions`, `ynda-workflow-actions`.
- Chọn implementation đích, đánh dấu legacy và kế hoạch chuyển call site.
- Bỏ `ignoreBuildErrors` sau khi xử lý lỗi type thật.
- Xác định host production, database production/test và storage target.
- Tạo feature flags cho workspace mới nếu cần.

Nghiệm thu:

- Có sơ đồ call site → service → bảng DB.
- Không còn mơ hồ action nào là chuẩn.
- Có môi trường test tách production.

### Giai đoạn 1 — Xác thực và biên dữ liệu (P0)

Mục tiêu: không ai giả cookie để thành Core hoặc đọc dữ liệu dự án.

Việc làm:

- Session server-side.
- Chặn `getAllData` khi chưa xác thực.
- Permission policy dùng chung.
- Không serialize secrets/webhook không cần thiết.
- Rate limit login và action quan trọng.
- Test giả cookie, inactive member, expired/revoked session.

Nghiệm thu:

- Tất cả test permission pass.
- Devtools sửa cookie email không đổi được danh tính.
- Trang login không tải payload dữ liệu nội bộ.

### Giai đoạn 2 — State machine, versioning và audit (P0)

Mục tiêu: luồng từ idea đến Core review nhất quán.

Việc làm:

- Workflow service trung tâm.
- Migration status/version/review.
- Gộp action trùng.
- Approval gắn version.
- Transaction + audit/outbox.
- Backfill dữ liệu cũ.

Nghiệm thu:

- Không thể bỏ gate bằng action cũ.
- Mỗi transition có actor, from/to, target version và timestamp.
- Thay version làm mất approval đúng quy tắc.

### Giai đoạn 3 — Idea workspace và autosave (P1)

Mục tiêu: idea dễ viết và không mất dữ liệu.

Việc làm:

- `idea_drafts` + revision.
- Debounced server autosave + local fallback.
- Form ba bước và validation server/client dùng chung.
- Submit idempotent.
- Feedback/revision cho idea.

Nghiệm thu:

- Refresh/đổi máy phục hồi nháp.
- Offline không mất nội dung.
- Double submit tạo một idea.
- Đợt hết hạn được xử lý rõ.

### Giai đoạn 4 — Script, media và review (P1)

Mục tiêu: mỗi sản phẩm có source/version/review rõ ràng.

Việc làm:

- Script versions và comment theo segment.
- Media asset service/object storage.
- Upload intent/checksum/permissions.
- Review request/feedback chuẩn.
- Production self-QC, Editor QC, Core review.

Nghiệm thu:

- Asset private chỉ người có quyền mở được.
- Approval luôn trỏ đúng version.
- Feedback có vị trí, owner, trạng thái resolved.

### Giai đoạn 5 — Audio domain (P1)

Mục tiêu: logic âm thanh hoàn chỉnh dù provider có thể thay.

Việc làm trong app:

- Voice profile registry.
- Audio jobs/segments.
- Provider interface, queue và persistence.
- UI resume/retry/regenerate.
- Lưu output vào media asset.

Phần có thể giao AI khác:

- Làm provider adapter Hugging Face hoặc dịch vụ khác theo interface.
- Sửa Space/model/build và credentials.

Nghiệm thu logic:

- Mock provider chạy full flow.
- Reload vẫn thấy job.
- Partial failure không mất đoạn thành công.
- Provider chưa cấu hình có empty state đúng.

### Giai đoạn 6 — Publishing domain (P1/P2)

Mục tiêu: dùng được thủ công trước, API nối sau.

Việc làm trong app:

- Publish package/version.
- Manual publish flow.
- Channel connection metadata.
- Publishing job/state/retry.
- URL validation và analytics seed.

Phần có thể giao AI khác:

- YouTube OAuth/uploader adapter.
- TikTok adapter khi đủ điều kiện.

Nghiệm thu logic:

- Manual flow chạy mà không cần API.
- Mock provider xử lý queued → processing → published/failed.
- Retry không tạo post trùng.

### Giai đoạn 7 — Workspace UI và hướng dẫn (P2)

Mục tiêu: toàn bộ sản phẩm nhất quán và dễ đào tạo.

Việc làm:

- Điều hướng mới.
- Trang chi tiết có URL riêng.
- Dashboard hành động.
- Design tokens/component patterns.
- Responsive/accessibility.
- Ảnh SOP lấy từ UI cuối.

Nghiệm thu:

- Producer mới hoàn thành một vòng theo hướng dẫn mà không phải hỏi lại tên nút.
- Mobile không mất action chính.
- Keyboard/focus/label/contrast đạt kiểm tra cơ bản.

### Giai đoạn 8 — Analytics, hardening và rollout (P2)

Mục tiêu: đưa vào vận hành có kiểm soát.

Việc làm:

- Analytics snapshots/insights.
- Observability, cleanup, backup và restore drill.
- Security review.
- Migration dry-run.
- Pilot một kênh và một nhóm nhỏ.
- Sửa lỗi, sau đó rollout toàn team.

Nghiệm thu:

- Hoàn thành một vòng thật từ idea đến analytics.
- Có cách rollback/khôi phục.
- Không có lỗi P0/P1 còn mở.

---

## 14. Backlog ưu tiên

### P0 — phải làm trước tính năng mới

- Session server-side và data authorization.
- Chuẩn hóa state machine/action trùng.
- Versioning approval.
- Chốt host + storage architecture.
- Tách môi trường test.
- Bật lại type checking trong build.

### P1 — lõi vận hành

- DB autosave và idempotent submit.
- Script version/review feedback.
- Media asset service.
- Audio job domain với mock provider.
- Manual publish + publish job domain.
- Notification outbox.

### P2 — nâng chất lượng

- Workspace redesign toàn diện.
- Analytics snapshots.
- Integration adapters thật.
- SOP screenshots/training mode.
- Gantt/timeline tối ưu hoặc loại bỏ nếu ít dùng.

### P3 — sau khi vận hành ổn

- Automation báo cáo nâng cao.
- Template content theo kênh.
- Thử nghiệm title/thumbnail.
- Search toàn cục nâng cao.
- Dashboard tải/capacity planning.

---

## 15. Chiến lược kiểm thử

### 15.1. Unit test có giá trị

- Permission policy.
- State transition matrix.
- Deadline/timezone.
- URL/platform validation.
- Idempotency/dedupe.
- Version invalidation.

### 15.2. Integration test với DB test

- Session lifecycle.
- Submit idea và double submit.
- Approve/revise theo role.
- Transaction/audit/outbox.
- Race giữa hai reviewer.
- Draft revision conflict.
- Publish job retry.

### 15.3. E2E hành trình thật

1. Producer tạo nháp và nộp idea.
2. Editor/Core trả sửa rồi duyệt.
3. Producer nộp script; Editor trả sửa rồi duyệt.
4. Producer nộp production; Editor QC.
5. Core duyệt final đúng version.
6. Editor chuẩn bị publish package.
7. Manual publish lưu URL.
8. Analytics snapshot và insight.

### 15.4. Test lỗi

- Mất mạng/autosave.
- Refresh giữa job.
- Provider timeout/quota.
- Token expired/revoked.
- File quá lớn/sai type.
- Kênh archive/member inactive.
- Hai tab hoặc hai reviewer thao tác đồng thời.

### 15.5. Quality gates

Trước khi merge/deploy:

```powershell
npx tsc --noEmit
npm run lint
npm run build
```

Thêm test command chính thức khi test suite được nối vào ứng dụng thật. Không coi harness mô phỏng độc lập là bằng chứng integration.

---

## 16. Triển khai, quan sát và khôi phục

### 16.1. Môi trường

- Local.
- Test/staging với DB/storage riêng.
- Production.

Không dùng production DB để chạy test phá dữ liệu.

### 16.2. Feature flags

- `new_idea_composer`
- `workflow_v2`
- `audio_jobs`
- `publishing_jobs`
- `provider_youtube`
- `provider_tiktok`

Tên cụ thể có thể đổi, nhưng rollout cần tắt/mở từng phần độc lập.

### 16.3. Log/metrics tối thiểu

- Request ID, actor ID, action, entity/version.
- Transition failures theo lý do.
- Autosave failure/conflict rate.
- Job queue latency/success/retry.
- Upload failure/size.
- Provider auth expiry.
- Notification outbox backlog.

Không log password, token, nội dung secret, signed URL đầy đủ hoặc sample voice riêng.

### 16.4. Backup/restore

- Backup Postgres theo lịch.
- Versioning/lifecycle object storage.
- Kiểm tra restore staging định kỳ.
- Audit retention và cleanup policy được Core chốt.

---

## 17. Cách quản lý tiến độ

`WORKLOG.md` là nhật ký thực thi. Mỗi chặng ghi:

- Ngày giờ.
- ID backlog/giai đoạn.
- Trạng thái trước và sau.
- File/schema thay đổi.
- Command/test và kết quả.
- Migration/feature flag nếu có.
- Blocker.
- Một bước tiếp theo cụ thể.

Trạng thái chuẩn:

- `TODO`: chưa bắt đầu.
- `IN_PROGRESS`: đang làm.
- `CODE`: đã viết nhưng chưa nghiệm thu.
- `WAIT_EXTERNAL`: chờ tài khoản/credential/review/provider.
- `BLOCKED`: có blocker cụ thể.
- `DONE`: đạt toàn bộ tiêu chí và có bằng chứng.

Không ghi phần trăm cảm tính. Có thể dùng số tiêu chí đạt/tổng tiêu chí.

---

## 18. Definition of Done toàn sản phẩm

Một phiên bản được coi là sẵn sàng vận hành khi:

- Session và phân quyền đã được kiểm thử server-side.
- State machine duy nhất chạy xuyên suốt, không còn action legacy có thể bypass gate.
- Idea và script có nháp server, version và feedback.
- File private lưu ở storage phù hợp host, không qua giới hạn serverless sai cách.
- QC/Core approval gắn đúng version.
- Manual publish chạy trọn vòng; API provider là tùy chọn.
- Audio/publishing job sống qua refresh và xử lý partial failure/retry.
- Dashboard trả lời đúng “tôi cần làm gì”.
- Trang hướng dẫn công khai không cần đăng nhập, không tải dữ liệu nội bộ, có nội dung và ảnh đã làm sạch đúng UI cuối.
- Typecheck, lint, build và test nghiệp vụ đạt.
- Có staging, backup, restore và rollout plan.
- Đã pilot thành công ít nhất một sản phẩm từ idea tới analytics.

---

## 19. Việc bắt đầu ngay khi quay lại code

1. Không sửa thêm UI trước khi hoàn thành audit action/schema.
2. Tạo bảng liệt kê action trùng và call site đang dùng.
3. Viết test chứng minh lỗ hổng cookie/session hiện tại, sau đó thay session server-side.
4. Chặn `getAllData` với người chưa xác thực.
5. Chốt hosting/storage cùng người sở hữu dự án.
6. Thiết kế workflow service và migration versioning trên DB test.
7. Sau khi P0 ổn, hoàn thiện idea draft rồi mới đến audio/publishing domain.

Prompt bàn giao cho AI tiếp theo:

> Làm tiếp dự án `D:\workflow`. Đọc `PLAN_TONG_THE.md` và `WORKLOG.md` trước. Chỉ chọn một mục P0/P1 có tiêu chí nghiệm thu rõ, kiểm tra `AGENTS.md` và tài liệu Next.js 16.3.2 liên quan trước khi code. Giữ nguyên các thay đổi hiện có, không chạy deploy script, không dùng production DB để test, không đánh dấu DONE nếu chưa có bằng chứng. Cập nhật WORKLOG sau khi hoàn tất chặng.

---

## 20. Phân công Codex và Antigravity để tiết kiệm quota

Phân công theo tính chất việc, không theo tên file. Một người/agent giữ quyền sở hữu mỗi chặng; người còn lại review hoặc nhận chặng kế tiếp. Không để hai agent sửa cùng một file trong cùng thời điểm.

### 20.1. Việc nên giao Codex

Codex nên giữ các phần cần đọc rộng toàn repository, suy luận nghiệp vụ và phát hiện rủi ro chéo:

| Nhóm việc | Vì sao nên để Codex làm | Đầu ra bắt buộc |
|---|---|---|
| Audit auth/session và data exposure | Liên quan cookie, server action, page load, DB và quyền toàn hệ thống | Threat model ngắn, test tái hiện, patch, test permission |
| Chốt state machine và gộp action trùng | Cần so nhiều implementation/call site và giữ tương thích dữ liệu cũ | Transition matrix, service chuẩn, migration/call-site plan |
| Versioning và approval rules | Sai một điểm có thể cho đăng nhầm bản hoặc bypass gate | Schema, invariant, test race/version invalidation |
| Migration dữ liệu | Cần thận trọng với dữ liệu đang có, backfill và rollback | Migration tăng dần, dry-run, số liệu kiểm chứng |
| Storage/job/publishing architecture | Có trade-off host, file lớn, idempotency và external state | Provider-neutral contracts, failure model, acceptance tests |
| Review PR/chặng lớn của Antigravity | Cần kiểm tra security, dữ liệu và logic có lệch plan không | Findings theo mức độ, test bổ sung, quyết định merge |
| Debug lỗi khó xuyên nhiều lớp | Cần lần từ UI → action → DB → provider | Nguyên nhân gốc, fix nhỏ nhất, regression test |

Codex không nên tiêu quota vào các vòng chỉnh màu, copy/paste form hàng loạt, thêm hàng chục screenshot hoặc sửa văn bản lặp lại khi đã có spec rõ.

### 20.2. Việc nên giao Antigravity

Antigravity nên nhận các chặng đã có contract, wireframe và tiêu chí nghiệm thu cụ thể, đặc biệt khi cần nhiều thao tác triển khai lặp lại:

| Nhóm việc | Điều kiện giao | Đầu ra bắt buộc |
|---|---|---|
| Xây/refactor component giao diện | Design tokens, props, state và acceptance đã chốt | Component responsive, loading/error/empty/disabled states |
| Chuyển drawer dài thành route/tab | Route map và data contract đã có | Các trang, navigation, back/forward và mobile behavior |
| Áp design system trên nhiều màn hình | Có component mẫu và token chuẩn | Thay đổi đồng nhất, không tự đổi nghiệp vụ |
| Viết screenshot/minh họa SOP | UI đã ổn và có dữ liệu demo sạch | Ảnh đã làm mờ, số thứ tự, alt text, đường dẫn asset |
| Bổ sung form field/CRUD đơn giản | Server contract và permission đã xong | UI validation, error mapping, test happy/empty/error |
| Chạy responsive/accessibility pass | Danh sách viewport và checklist rõ | Danh sách lỗi, patch, bằng chứng từng viewport |
| Viết test theo ma trận đã định nghĩa | Test fixtures và expected transitions đã chốt | Test không mock lại chính logic cần kiểm chứng |
| Kết nối provider ngoài | Có tài liệu bàn giao, credentials do người dùng tự cấu hình và contract backend cố định | Adapter riêng, không đổi state machine/domain |

Antigravity không tự quyết định schema production, quyền, state transition, xóa dữ liệu cũ hoặc đổi contract domain. Nếu gặp điểm chưa rõ, ghi blocker vào `WORKLOG.md` thay vì đoán.

### 20.3. Việc có thể giao bên nào cũng được

- Sửa lint/type lỗi cục bộ đã có nguyên nhân rõ.
- Viết tài liệu theo implementation đã chạy.
- Thêm unit test thuần cho utility.
- Tối ưu copy/label sau khi nghiệp vụ đã chốt.

Chọn agent đang có đủ context và ít phải đọc lại nhất.

### 20.4. Luồng phối hợp tiết kiệm quota

```text
Codex: audit/chốt contract và acceptance
                ↓
Antigravity: triển khai chặng rõ phạm vi
                ↓
Antigravity: chạy type/lint/test và cập nhật WORKLOG
                ↓
Codex: review diff + invariant + rủi ro
                ↓
Antigravity: sửa findings cơ học
                ↓
Codex: duyệt logic cuối của chặng
```

Với thay đổi UI thuần đã có spec, có thể bỏ vòng review Codex ở giữa và chỉ review cuối theo batch.

### 20.5. Quy tắc bàn giao giữa hai agent

Mỗi prompt giao việc phải có:

1. Một mục tiêu duy nhất và danh sách file được phép sửa.
2. Những file chỉ được đọc.
3. Invariant không được phá.
4. Tiêu chí nghiệm thu và command phải chạy.
5. Nêu rõ không deploy/commit/push nếu chưa được yêu cầu.
6. Yêu cầu cập nhật `WORKLOG.md` với trạng thái thật.

Mẫu giao Antigravity:

> Đọc `PLAN_TONG_THE.md` mục [số mục] và checkpoint cuối trong `WORKLOG.md`. Thực hiện duy nhất [hạng mục] trong các file [danh sách]. Không đổi schema, permission, state machine hoặc contract server. Phải có loading/error/empty/disabled và mobile. Chạy [commands]. Nếu contract thiếu hoặc mâu thuẫn, dừng phần phụ thuộc và ghi blocker; không tự đoán. Cập nhật WORKLOG, không deploy/commit/push.

Mẫu giao Codex:

> Đọc `PLAN_TONG_THE.md` và `WORKLOG.md`. Audit/thiết kế/triển khai [hạng mục logic]. Trước khi sửa, lập invariant và test tái hiện. Giữ tương thích dữ liệu hoặc cung cấp migration/backfill/rollback. Rà mọi call site và action trùng. Chạy type/lint/test/build phù hợp, cập nhật WORKLOG và không deploy/commit/push.

### 20.6. Phân công theo roadmap hiện tại

| Chặng | Owner đề xuất | Reviewer | Ghi chú |
|---|---|---|---|
| Giai đoạn 0: audit action/schema | Codex | Antigravity có thể kiểm tra inventory | Cần quyết định kiến trúc |
| Giai đoạn 1: session/data auth | Codex | Antigravity chạy test UI/login | P0 bảo mật |
| Giai đoạn 2: workflow/versioning | Codex | Antigravity bổ sung test từ matrix | P0 nghiệp vụ |
| Giai đoạn 3: draft backend | Codex | Antigravity | Conflict/idempotency do Codex chốt |
| Giai đoạn 3: form idea UI | Antigravity | Codex review contract | Spec đã có |
| Giai đoạn 4: media/review domain | Codex | Antigravity | Schema và quyền |
| Giai đoạn 4: workspace UI | Antigravity | Codex review gate/version | Nhiều component |
| Giai đoạn 5: audio job domain | Codex | Antigravity | Provider-neutral |
| Giai đoạn 5: HF adapter/Space | Antigravity hoặc AI tích hợp khác | Codex chỉ review contract | Theo note bàn giao |
| Giai đoạn 6: publishing domain | Codex | Antigravity | External state/idempotency |
| YouTube/TikTok adapter | Antigravity hoặc AI tích hợp khác | Codex review security/contract | Cần user cấu hình tài khoản |
| Trang `/huong-dan` công khai | Antigravity | Codex review privacy/data boundary | Spec công khai ở mục 9.10 |
| Screenshot SOP + responsive pass | Antigravity | Người dùng duyệt nội dung | Làm sau UI ổn định |

### 20.7. Cách giảm số token thực tế

- Mỗi task chỉ giao một chặng nhỏ đủ hoàn thành trong một lượt.
- Trỏ đến mục cụ thể trong plan; không paste lại toàn bộ yêu cầu.
- Bắt buộc agent đọc `WORKLOG.md`, tránh quét lại repository từ đầu.
- Agent triển khai tự chạy test và ghi bằng chứng trước khi bàn giao.
- Gom review UI theo batch; review logic/security ngay từng chặng.
- Không yêu cầu Codex và Antigravity cùng lập lại một plan.
- Không mở tích hợp ngoài trước khi contract domain và credential owner rõ ràng.
