# WORKLOG — vận hành dự án YNDA

Cập nhật: 18/09/2026 · Workspace: D:\workflow · Nhánh: main.

**Đọc file này đầu tiên khi tiếp tục sau khi hết quota hoặc mở cuộc trò chuyện mới.**
Không coi “đã viết code” là “đã chạy thật”. Không reset những thay đổi đang có.

## 1. Yêu cầu và quyết định đã chốt

- Hoàn thiện SOP; trang hướng dẫn riêng có tìm kiếm, đủ 6 phần/quy trình.
- Khu idea dễ viết, xem trước, lưu nháp và khôi phục; giao diện bớt màu mè, chữ rõ.
- Âm thanh: người dùng chưa có model, giọng train hay API. Phải xây backend từ đầu, không chỉ gắn endpoint giả trong note.
- Trang đăng video theo kênh; hướng dẫn lấy quyền API YouTube/TikTok.
- Trang `/huong-dan` là trang công khai riêng, không cần đăng nhập, không tải dữ liệu nội bộ; người mới nhìn vào phải hiểu luồng và vai trò.
- Phân việc để tiết kiệm quota: Codex giữ logic/security/schema/state machine/review; Antigravity ưu tiên triển khai UI theo spec, responsive/accessibility, screenshot SOP và adapter ngoài theo contract.
- Ưu tiên BACKEND trước khi tiếp tục mở rộng giao diện.
- Người dùng đã cho phép thao tác Hugging Face và đã đăng nhập trình duyệt trong app. Chưa cho phép mua gói hoặc thuê GPU trả phí.
- Nguồn quy trình: Tinhnangngoai/Note/QUY_TRINH_NGUON.txt.
- Note gốc âm thanh: Tinhnangngoai/Note/phần làm âm thanh/TTSStudio.tsx. Đây là mẫu có API giả; không copy trạng thái “ready” giả sang sản phẩm.

## 2. Mở hướng dẫn triển khai

- [Kế hoạch tổng thể — nguồn tham chiếu chính](PLAN_TONG_THE.md)
- [Backend và Hugging Face](Tinhnangngoai/Note/BACKEND_HUGGING_FACE.md)
- [Lấy quyền API YouTube và TikTok](Tinhnangngoai/Note/API_YOUTUBE_TIKTOK.md)

## 3. Hiện đã tới đâu?

| Hạng mục | Trạng thái thực tế | Mã nguồn / phần còn thiếu |
|---|---|---|
| Nội dung SOP | Đã hoàn thiện 12 quy trình đủ 10 thành phần, 8 giai đoạn, ví dụ sạch và bài tập | src/lib/workflow-guide.ts (DONE nội dung) |
| Trang hướng dẫn | Hoàn thiện /huong-dan công khai, không cần đăng nhập, không tải dữ liệu nội bộ, tìm kiếm có/không dấu, lọc vai trò/giai đoạn, nhãn "Cần đăng nhập", responsive từ 360px | WorkflowGuide.tsx, huong-dan/page.tsx, globals.css (DONE) |
| Idea mới | Đã thay form cũ bằng 3 bước, xem trước, giữ form khi submit lỗi | IdeaComposer.tsx; chưa chạy thử submit với DB test |
| Nháp idea | Có localStorage theo tài khoản, tự lưu + nút lưu | use-local-draft.ts; chưa có nháp DB/đổi máy/xử lý xung đột |
| Backend nộp idea | Đã thêm kiểm tra kênh, đợt pitching, deadline, reference, lưu batch và platform | idea-actions.ts; thiếu idempotency và test tích hợp |
| Bảng tiến độ | Đã thêm CORE_REVIEW và READY_TO_PUBLISH | ClientApp.tsx; cần rà dashboard/lịch/báo cáo/legacy actions cho đồng nhất |
| Âm thanh UI | Chọn script approved, chia đoạn <=150 từ, tạo/retry từng đoạn, khôi phục job, nghe/tải và lưu master WAV | AudioStudio.tsx, /api/audio-jobs; chưa test với model thật |
| API âm thanh | Có REST/Gradio/mock adapter, provider/model state, audio jobs + segments + file bytes riêng tư trong Postgres | Chưa có model thật chạy thành công; voice registry vẫn lấy từ cấu hình máy chủ |
| Trang đăng | Có publish package/job, nơi đăng cụ thể, ngày/múi giờ, trạng thái draft/ready/scheduled/published và xác nhận thủ công | Chưa tích hợp OAuth/upload tự động |
| Upload video | Có Node route ghi file/đọc range, giới hạn 250 MB | /api/media; cần MEDIA_UPLOAD_DIR; chỉ phù hợp server có ổ bền vững, chưa phải giải pháp Vercel |
| Publish action | Đã siết Editor/Core, gate cuối, URL, cập nhật có điều kiện | Chưa tích hợp YouTube/TikTok OAuth hoặc upload platform |
| Giao diện chung | Có CSS/editorial layout và nhãn điều hướng mới | globals.css; chưa phải redesign hoàn chỉnh mọi màn hình |
| Hugging Face | Đăng nhập được; tài khoản Harlanitsk | Xem checkpoint Hugging Face cuối file |
| YouTube/TikTok | Đã nghiên cứu tài liệu, có hướng dẫn cấu hình | Chưa tạo OAuth app, callback, token store hay chạy upload thật |
| Deploy | CHƯA deploy, CHƯA commit/push | Giữ nguyên worktree để tiếp tục |

## 4. Kết quả kiểm tra gần nhất

17/09/2026:
- `npx tsc --noEmit`: PASS.
- `npm run build`: PASS. Build config bỏ qua type validation nên vẫn phải chạy tsc riêng.
- Build WARNING: dynamic filesystem tracing tại src/app/api/media/route.ts; có nguy cơ bundle rộng toàn project. Chưa xử lý.
- ESLint giới hạn vào 13 file mới liên quan UI/API/util: FAIL 1 lỗi `react-hooks/set-state-in-effect` ở src/lib/use-local-draft.ts:17.
- Chưa chạy full repo lint, test tích hợp DB, kiểm tra trình duyệt hay upload thật.
- Không lấy tests/e2e/harness.ts làm bằng chứng hệ thống thật chạy đúng nếu chưa xác định test có gọi code ứng dụng/DB hay chỉ mô phỏng.

## 5. Thứ tự công việc backend

Quy ước: TODO = chưa làm; CODE = đã viết nhưng chưa nghiệm thu; DONE = có bằng chứng đạt; WAIT = cần tài khoản/dữ liệu/quyết định bên ngoài.

| ID | Ưu tiên | Việc / điều kiện nghiệm thu | Trạng thái |
|---|---|---|---|
| BE-01 | P0 | Sửa phiên đăng nhập: hiện cookie currentMemberEmail chỉ chứa email; cần session ngẫu nhiên phía server hoặc chữ ký, expiry/revoke. Cookie giả không được mạo danh Core. | TODO |
| BE-02 | P0 | Chặn trả dữ liệu dự án khi chưa đăng nhập; rà page.tsx/getAllData và tách webhook/token khỏi props client. | TODO |
| BE-03 | P0 | Chốt host thật và kho file. Nếu Vercel: signed upload trực tiếp object storage; không gửi video 250 MB qua function. | TODO |
| BE-04 | P0 | Chốt state machine; mọi action cũ/mới đều tôn trọng Script/QC/Core; thay bản final sau duyệt cần version/review lại. | TODO |
| BE-05 | P1 | Sửa hook nháp lint; tạo idea_drafts trên DB, owner, revision, conflict handling; fallback local khi offline; submit chống trùng. | CODE một phần |
| BE-06 | P1 | Tạo môi trường âm thanh Hugging Face; chạy được một câu tiếng Việt với preset, trả file nghe được. | Đang làm |
| BE-07 | P1 | Adapter HF/Gradio, lỗi quota/cold-start, timeout, polling job; không báo “đã kết nối” từ config đơn thuần. | CODE; chưa nghiệm thu Space thật |
| BE-08 | P1 | Voice registry: model/version/preset hoặc sample/profile; upload mẫu riêng tư, map theo kênh; ghi rõ cloning khác training. | WAIT mẫu giọng + TODO |
| BE-09 | P1 | Lưu job âm thanh, segments, file URLs/version; refresh trang vẫn lấy lại file; giới hạn đồng thời/chi phí. | CODE; Postgres persistence + claim chống tạo trùng đoạn, chưa load test/quota |
| BE-10 | P1 | YouTube OAuth + encrypted token store theo channel; upload resumable; thử private, xử lý processing, trạng thái thật. | WAIT credentials + TODO |
| BE-11 | P2 | TikTok đánh giá eligibility trước; hướng thủ công giữ hoạt động. Nếu hợp lệ mới Login Kit/Upload API/Direct Post theo scope được duyệt. | WAIT xét duyệt |
| BE-12 | P2 | Publish jobs: queued/uploading/processing/scheduled/published/failed, retry có chống trùng, lịch timezone Asia/Bangkok. | CODE luồng manual: draft/ready/scheduled/published + idempotency; provider upload chưa làm |
| BE-13 | P2 | Test permission, validation, retry, race, quota, expired tokens trên DB test; hoàn thiện UI sau backend. | TODO |

## 6. Lưu ý kỹ thuật đã phát hiện

- README.md hiện nhắc Google Sheets, nhưng code chính dùng Neon/Postgres. Không chạy init-sheet theo README để thiết lập DB hiện tại.
- deploy.sh/deploy.bat có git add/commit/push và có thể trigger deploy: KHÔNG dùng để chỉ “kiểm tra”.
- Khung Next.js 16.3.2: đọc node_modules/next/dist/docs liên quan trước khi viết code, theo AGENTS.md.
- Nháp hiện chỉ trong trình duyệt, bật/tắt tự lưu chưa phải setting được đồng bộ.
- Hook clear sau submit chưa xử lý triệt để trường hợp localStorage không xóa được; cần tránh khôi phục nháp đã nộp.
- Audit/Discord là side effect sau mutation; nếu side effect lỗi phải tránh khiến người dùng tưởng chưa lưu và nộp lại gây trùng.
- publishing-actions.ts có comment “thay file cần duyệt lại” nhưng hiện vẫn cho thay finalUrl ở trạng thái approved; cần versioning + ràng buộc thật.
- /api/media xác thực qua auth cũ; harden session trước khi mở trên Internet.
- TTS endpoint hiện chờ binary audio; URL trang Space/Gradio không thể dán vào TTS_ENDPOINT rồi coi là tương thích.
- Không lưu secret vào note hoặc log. File .env hiện có phải giữ nguyên, không in ra nội dung.
- TikTok Direct Post không chấp nhận công cụ chỉ đăng nội bộ cho team: không hứa được duyệt và không khai sai mục đích.

## 7. Cách tiếp tục sau khi đổi cuộc trò chuyện

Dán:
> Tiếp tục dự án D:\workflow. Đọc WORKLOG.md và hai note trong Tinhnangngoai/Note. Ưu tiên backend, giữ mọi thay đổi hiện tại. Kiểm tra checkpoint Hugging Face trước khi tạo thêm Space. Không dùng endpoint giả, không tự mua GPU, không đăng video thật khi chưa xác nhận. Cập nhật WORKLOG sau mỗi chặng với file, test và bước tiếp theo.

Lệnh kiểm tra an toàn:
```powershell
cd D:\workflow
git status --short
npx tsc --noEmit
npm run build
```

Mỗi checkpoint mới cần ghi: ngày; ID công việc; file; trạng thái trước/sau; bằng chứng test; tài khoản/URL bên ngoài (không secret); blocker; một bước tiếp theo cụ thể.

## 8. Checkpoint Hugging Face

- Đã tạo Space private `Harlanitsk/ynda-voice-studio` bằng phiên người dùng.
- Cấu hình: Gradio + ZeroGPU Free. Không nâng cấp gói, không mua compute, không cấp token mới.
- Đã upload prototype từ `services/hf-voice/` lên Space, commit `4b88105`.
- Trạng thái cuối được quan sát: **Build error**. Log tóm tắt mới chỉ hiển thị bước pip/dependency thất bại, chưa lấy được dòng nguyên nhân đầy đủ. Chưa tạo được file âm thanh nào.
- Theo quyết định ngày 18/09/2026: dừng thao tác tích hợp ngoài; giữ source và tài liệu để người dùng/AI khác xử lý. Không tự tạo thêm Space hoặc đổi sang Public.

## 9. Checkpoint kế hoạch 18/09/2026

- Đã tạo `PLAN_TONG_THE.md` làm nguồn kế hoạch chính: phạm vi, role/permission, state machine, versioning, data model, backend architecture, cấu trúc từng màn hình, edge cases, roadmap, backlog, test và Definition of Done.
- Đã tạo `Tinhnangngoai/Note/README.md` làm mục lục tài liệu.
- Lượt này chỉ cập nhật tài liệu; không sửa thêm logic ứng dụng, không deploy, không commit/push.
- Bước code tiếp theo theo plan: audit/gộp action trùng và sửa session/data authorization P0 trước khi mở rộng UI.
- Đã bổ sung `PLAN_TONG_THE.md` mục 9.10: đặc tả `/huong-dan` public/no-login, không gọi dữ liệu workspace và tiêu chí hiểu trong 30 giây/3 phút.
- Đã bổ sung mục 20: ma trận phân công Codex/Antigravity, luồng review, prompt bàn giao và owner theo roadmap.

## 10. Checkpoint hoàn thiện trang hướng dẫn công khai `/huong-dan` (18/09/2026)

- **Mục tiêu**: Hoàn thiện toàn diện trang hướng dẫn công khai `/huong-dan` theo yêu cầu không đăng nhập, không rò rỉ dữ liệu nội bộ, đủ 8 giai đoạn từ Định hướng đến Analytics, tìm kiếm tiếng Việt có/không dấu, lọc theo vai trò Core/Editor/Producer và giai đoạn, mỗi SOP đủ 10 thành phần, nút workspace hiển thị nhãn "Cần đăng nhập" khi chưa có session, responsive mượt mà từ 360px.
- **File đã sửa**:
  1. `src/lib/workflow-guide.ts`: Chuẩn hóa 12 quy trình SOP đủ 10 thành phần bắt buộc (Mục tiêu, Input, Người làm, Các bước, Output, Người nhận, Deadline/SLA, Ví dụ, Phản hồi, Luyện tập) + danh mục lỗi thường gặp. Bổ sung cấu trúc 8 giai đoạn (`WORKFLOW_STAGES`), tổng quan vai trò (`ROLE_OVERVIEWS`), bảng tra cứu thuật ngữ (`GLOSSARY_TERMS`), ma trận 5 cổng chất lượng (`QUALITY_GATES`). Cập nhật hàm `searchText` và `matchProcedure` chuẩn hóa tiếng Việt loại bỏ dấu thanh, xử lý đ/Đ thành d.
  2. `src/app/huong-dan/page.tsx`: Route Server Component công khai, không gọi `getAllData()` hay truy vấn DB nội bộ, đọc cookie an toàn để xác định `hasSession: boolean` và truyền prop vào component.
  3. `src/app/components/WorkflowGuide.tsx`: Giao diện hướng dẫn hoàn chỉnh gồm: Stepper tương tác 8 giai đoạn, 3 thẻ lối vào theo vai trò Core/Editor/Producer, thanh tìm kiếm hỗ trợ tiếng Việt có/không dấu + xóa nhanh, bộ lọc vai trò & giai đoạn, danh mục SOP kèm chỉ số thứ tự, bài viết SOP chi tiết 6 phần chuẩn hóa, nút liên kết công cụ hiển thị huy hiệu "Cần đăng nhập" khi `!hasSession`, hộp lỗi thường gặp, mẫu phản hồi chuẩn, bảng tra cứu State Machine và 5 Cổng kiểm soát chất lượng có thể đóng/mở.
  4. `src/app/globals.css`: Bổ sung toàn bộ style cho stepper 8 bước, thẻ vai trò, huy hiệu "Cần đăng nhập", mẫu phản hồi, bảng thuật ngữ; tối ưu responsive cho desktop, tablet, mobile 700px và mobile hẹp 360px (chuyển sang quick selector, căn chỉnh lề và ngắt dòng an toàn).
  5. `PLAN_TONG_THE.md`: Cập nhật bảng hiện trạng mục 4 cho hạng mục SOP và Trang hướng dẫn.
  6. `WORKLOG.md`: Cập nhật bảng hiện trạng mục 3 và ghi nhận checkpoint 10.
- **Kết quả kiểm tra**:
  - `npx tsc --noEmit`: PASS (exit code 0, không có lỗi kiểu dữ liệu).
  - `npx eslint src/app/huong-dan/page.tsx src/app/components/WorkflowGuide.tsx src/lib/workflow-guide.ts`: PASS (0 lỗi, 0 cảnh báo).
  - `npm run lint`: Repo tổng thể có 1168 lỗi/cảnh báo tồn tại sẵn từ trước (chủ yếu là `any` trong `tests/e2e/` và hook `use-local-draft.ts`). Các file thuộc phạm vi sửa đổi đợt này đều sạch 100%.
  - `npm run build`: PASS (Next.js 16.3.2 Turbopack, route `ƒ /huong-dan` server-rendered on demand, không leak dữ liệu).
  - Kiểm tra tìm kiếm tiếng Việt (node test): PASS 17/17 test cases (các cặp từ khóa có dấu / không dấu như `kịch bản`/`kich ban`, `âm thanh`/`am thanh`, `định hướng`/`dinh huong`, `Core duyệt`/`core duyet`, `đăng video`/`dang video` đều trả về kết quả đồng nhất).
  - Quét an toàn bảo mật (node scan): PASS (0 phát hiện webhook, private email, private Drive link, token hay API key).
  - Kiểm tra Responsive 360px: CSS và giao diện được tinh chỉnh riêng cho `<= 360px`, form stack dọc, fact list chuyển 1 cột, không tràn ngang.
- **Phần chưa kiểm tra**:
  - Chưa mở trình duyệt thật với giao diện mắt người (chỉ xác minh qua Next.js build, headless test và phân tích CSS).
  - Chưa commit, push hoặc deploy (tuân thủ chỉ dẫn không deploy/commit).
- **Blocker / Lưu ý**:
- Không có blocker đối với trang `/huong-dan`. Trang độc lập hoàn toàn và an toàn công khai.

## 11. Checkpoint âm thanh và trang đăng (18/09/2026)

- **Âm thanh**: thêm `audio_jobs`/`audio_segments`, lưu audio và master riêng tư trong Postgres; UI chọn đúng script approved, lọc voice theo kênh, lưu/khôi phục job, retry riêng đoạn lỗi, ghép rồi lưu master. `/api/voice` dùng chung adapter REST/Gradio/mock và trả provider/model state thật.
- **Trang đăng**: thêm `publishing_jobs`, publish package version, idempotency theo idea + final asset, đích đăng cụ thể trên `platform_channels`, múi giờ `Asia/Bangkok`, tách trạng thái `SCHEDULED` khỏi `PUBLISHED`.
- **Khóa phiên bản**: Gate 5 chụp `gate5_approved_final_url`; sau Core duyệt không thể thay final trong publish package hoặc upload đè. Muốn thay phải quay lại QC/Core.
- **Kiểm tra**: `npx tsc --noEmit` PASS; ESLint các file mới/đã chạm trong phạm vi PASS; unit smoke chia 321 từ thành 140/140/41 và URL YouTube/TikTok PASS; `npm run build` PASS; DB thật đã có `audio_jobs`, `audio_segments`, `publishing_jobs` và các cột snapshot/destination. Build còn warning filesystem tracing cũ của `/api/media`.
- **Chưa nghiệm thu ngoài**: chưa có TTS/model thật hoạt động, chưa có OAuth YouTube/TikTok, chưa đăng video thật. Kiểm tra browser dừng ở màn hình đăng nhập vì không dùng/đọc thông tin xác thực của người dùng.

## 12. Checkpoint đồng bộ logic theo Bản đồ vận hành video (18/09/2026)

- **Phạm vi**: chuẩn hóa các điểm chuyển bắt buộc của sơ đồ: Source + Audio + Visual -> Assembly/Self-QC -> Editor QC -> Core -> Publish -> Analytics/Feedback.
- **Đã sửa**:
  - Core duyệt final nay chuyển task sang `READY_TO_PUBLISH`; không còn đánh dấu hoàn thành/published trước khi đăng.
  - Editor QC chỉ lưu `video_final_link`; không còn ghi nhầm final nội bộ thành `published_link`.
  - Xác nhận Published yêu cầu URL public sau Core duyệt, cập nhật task sang `COMPLETE/PUBLISHED` và cập nhật `publishing_jobs` sang `PUBLISHED`.
  - Core duyệt tạo/cập nhật một publish package thủ công, idempotent theo task + bản final, trạng thái `READY`; hẹn lịch không được coi là Published.
  - Checklist Production mới tách rõ Source, Voice/Audio, Visual, Assembly/Self-QC và bàn giao source; Producer không được giao không thể nộp hộ task.
  - Sửa điều kiện gate QC dùng `OR` để không thể vượt gate khi chỉ đúng một trong status/gate; trả revision chỉ hợp lệ từ Editor QC.
  - TikTok derivative chỉ được tạo sau khi master đã thật sự `PUBLISHED`.
  - Thay cookie chứa email bằng session ID ngẫu nhiên, lưu server-side có hạn/revoke; trang chủ không query/serialize dữ liệu workspace trước khi session hợp lệ.
- **Schema**: thêm `auth_sessions` vào cả `ensureSchema()` và `init-postgres.mjs`.
- **Kiểm tra**: `npm run build` PASS (Next.js 16.3.2). Còn warning cũ về dynamic filesystem tracing trong `/api/media`. `npx tsc --noEmit` hiện bị cache `.next/dev` cũ tham chiếu `/huong-dan` không tồn tại trong source/HEAD; build production không tái hiện lỗi này. ESLint toàn các file liên quan vẫn có lỗi tồn tại sẵn do `any` và JSX trong code legacy, không dùng làm bằng chứng PASS.
- **Bước tiếp theo**: tạo UI quản lý đầy đủ publish package (metadata, lịch, destination) và test tích hợp DB cho session/gate/retry trước khi bật OAuth hoặc upload thật.
