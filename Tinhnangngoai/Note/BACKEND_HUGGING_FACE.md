# Backend trước — cách thiết lập và làm tiếp

Cập nhật 17/09/2026. Đọc WORKLOG.md ở gốc để biết trạng thái thật; note này mô tả kiến trúc và thao tác, không đánh dấu các phần chưa chạy là hoàn tất.

## 1. Sơ đồ hệ thống cần đạt

```text
Người dùng → Web Next.js → Session + phân quyền → Postgres
                 │                    │
                 │                    ├─ Bản nháp idea, phiên bản, trạng thái duyệt
                 │                    ├─ Voice registry + audio jobs
                 │                    └─ Voice registry + audio jobs
                 │
                 ├─ Upload có chữ ký → Kho object storage riêng tư
                 ├─ Audio job → Worker/Hugging Face → WAV → Kho file
                 └─ WAV master → kho file nội bộ
```

Người dùng không cần có sẵn API âm thanh. Mình xây bộ chạy mô hình; mẫu giọng riêng chỉ cần ở bước tạo giọng của kênh. Không cần train từ đầu để thử kết nối.

## 2. Việc cần làm đầu tiên

### Bước 1 — chốt nơi web chạy

Repo có dấu hiệu triển khai Vercel, nhưng chưa xác nhận host production hiện tại. Kiểm tra dự án hosting và domain thật trước.

- Nếu Next.js ở Vercel: file lớn đi từ trình duyệt thẳng vào object storage qua signed URL. Route server chỉ cấp quyền và ghi metadata.
- `/api/media` hiện có ghi file trên ổ máy và cho 250 MB. Không dùng route đó làm upload production trên Vercel: giới hạn payload function hiện là 4,5 MB. [Nguồn Vercel](https://vercel.com/docs/functions/limitations).
- Nếu VPS/Node server: có thể dùng MEDIA_UPLOAD_DIR là đường dẫn tuyệt đối đến volume bền vững, có backup; đặt ngoài source repository. Đây là lựa chọn vận hành cần chốt, chưa cấu hình tự động.
- Không lưu file duy nhất vào thư mục tạm của serverless hoặc filesystem Space.

### Bước 2 — sửa xác thực và dữ liệu trả về

Code auth hiện nhận email từ cookie `currentMemberEmail`; cần thay bằng session ngẫu nhiên/chữ ký được kiểm chứng. Trước khi nối OAuth kênh, thêm expiry, revoke/logout, secure cookie và kiểm tra quyền cho mỗi mutation.

Trang gốc hiện gọi getAllData dù chưa có currentMember. Cần giới hạn dữ liệu phía server và không gửi webhook/secrets xuống client. Đây là phát hiện từ code hiện tại, chưa được sửa trong lượt viết note.

### Bước 3 — giữ đúng cổng duyệt

- Idea đạt → giao Producer/deadline.
- Script APPROVED → mới sản xuất.
- QC đạt → Core duyệt.
- Core duyệt đúng phiên bản final → công việc hoàn tất.
- Thay video final/nội dung quan trọng sau duyệt → version mới và kiểm tra lại; không giữ approval cũ một cách mặc định.
- YNDA không có chức năng kết nối hoặc đăng lên YouTube, TikTok hay nền tảng khác.

## 3. Thiết lập Hugging Face đã làm trực tiếp

Owner: **Harlanitsk**.
Tên Space: **ynda-voice-studio**.
Đường dẫn: [Hugging Face Space của dự án](https://huggingface.co/spaces/Harlanitsk/ynda-voice-studio).

Đã đăng nhập bằng chính phiên người dùng. Đã tạo Space **Private** trên lựa chọn **Gradio / ZeroGPU Free** mà dashboard cung cấp. Không mua PRO, không thuê GPU trả phí.

Bộ source local: `services/hf-voice/` gồm app.py, requirements.txt, packages.txt và README.md. Kiểm tra cú pháp Python đã pass; phải xem checkpoint WORKLOG để biết build/inference trên HF đã đạt chưa.

### Vì sao chọn cách này?

- Tài khoản hiện tại không cho chọn Docker/CPU Basic; dashboard cho chọn ZeroGPU Free.
- Dùng Gradio phù hợp ZeroGPU. Đây là môi trường thử có quota, không cam kết chạy production liên tục. Điều kiện gói và quota có thể đổi; kiểm tra Settings trước khi nâng cấp. [Tổng quan Spaces](https://huggingface.co/docs/hub/spaces-overview), [ZeroGPU](https://huggingface.co/docs/hub/spaces-zerogpu).
- Đã chuyển source sang F5-TTS v1 Base. F5-TTS nhận WAV tham chiếu, transcript của WAV và văn bản cần đọc để suy luận; checkpoint sẽ tự tải ở lần chạy đầu. [SDK F5-TTS](https://github.com/SWivid/F5-TTS), [API F5TTS](https://github.com/SWivid/F5-TTS/blob/main/src/f5_tts/api.py).
- Checkpoint F5-TTS có giấy phép CC-BY-NC; chưa dùng cho mục đích thương mại khi chưa làm rõ giấy phép phù hợp.

### Cách bạn dùng thử khi Space báo Running

1. Mở tab App.
2. Nhập một câu ngắn, ví dụ: “Xin chào, đây là phần kiểm tra giọng đọc cho dự án Ý Niệm Điện Ảnh.”
3. Sau khi đã thêm giọng, chọn ID giọng và giữ tốc độ 1.
4. Bấm Tạo âm thanh, chờ xử lý. Nghe và tải WAV.

### Khi bạn đã có file mẫu và transcript

Gửi cho mình **một cặp file cho từng giọng**; chưa cần gửi bây giờ:

1. `kenh_a.wav`: chỉ một người nói, âm thanh rõ, và bạn có quyền sử dụng giọng đó.
2. `kenh_a.txt`: đúng từng chữ (kể cả dấu câu) của người nói trong `kenh_a.wav`.
3. Mình sẽ đưa cặp đó vào Space **Private** tại `voices/kenh_a.wav` và `voices/kenh_a.txt`, rồi kiểm tra bằng một câu ngắn.

Không tải file mẫu thật lên Git hoặc Space Public. F5-TTS clone từ tham chiếu, không phải train/fine-tune một model mới.

**Cloning** là đọc văn bản theo mẫu giọng. **Fine-tuning/training** là cập nhật mô hình bằng bộ dữ liệu huấn luyện. Chưa có bộ dữ liệu nên không ghi “đã train giọng kênh”.

### Cách xem lỗi

- Building: xem build log, tên package và phiên bản lỗi. Không đổi phần cứng ngẫu nhiên để chữa lỗi dependency.
- Runtime error: xem container log; phân biệt lỗi CUDA/ZeroGPU, model download và SDK.
- Running nhưng tạo lỗi: xem lỗi cụ thể, quota và số từ. Thử câu ngắn hơn chỉ để chẩn đoán; không báo đã thành công khi chưa có file.
- Model/cold start lâu: ghi trạng thái thật; không dùng timeout giả để hiện “sẵn sàng”.
- Private Space có thể không truy cập qua API nếu thiếu HF token đúng quyền. Không đổi sang Public chỉ để né xác thực.

## 4. Nối Space vào web — adapter đã có, còn nghiệm thu Space thật

### Hợp đồng hiện tại của web

`GET /api/voice`: kiểm tra phiên, trả danh sách TTS_VOICES_JSON và configured.

`POST /api/voice`: nhận:
```json
{"text":"Lời đọc", "voiceId":"ma-giong", "speed":1}
```

Với `TTS_PROVIDER=rest`, route gọi `TTS_ENDPOINT` với body:
```json
{"text":"Lời đọc", "voice_id":"ma-giong", "speed":1}
```

Upstream phải trả binary `audio/*`. Với `TTS_PROVIDER=gradio`, backend gọi endpoint queue `gradio_api/call/synthesize`, chờ SSE hoàn tất rồi tải FileData về. Hiện chưa có dịch vụ/model thật nào đã chạy thành công để nghiệm thu.

### Hợp đồng prototype Hugging Face

- API Gradio `voices`: trả mảng giọng tham chiếu đã có đủ cặp WAV/TXT.
- API Gradio `synthesize`: text, voice_id, speed → file WAV.
- Gradio xử lý bằng job queue và FileData, không phải REST binary như route hiện tại.

**Không dán URL trang HF vào TTS_ENDPOINT rồi coi là đã nối xong.** Phải đặt đúng `TTS_PROVIDER=gradio`, cấu hình token server nếu Space private, rồi thử một câu thực tế. Config tồn tại chưa đồng nghĩa model đã sẵn sàng.

Phần đã có trong code:
1. Provider mode cho `/api/voice`: REST, Gradio hoặc mock kiểm thử.
2. Chỉ Core sửa cấu hình provider; token giữ ở server.
3. HF token đọc đúng Space riêng tư, quyền tối thiểu. Người dùng tạo/lưu trực tiếp ở Settings secrets của host, không gửi token vào chat. Cấp token mới là bước riêng, chưa thực hiện.
4. Lấy API schema của Space đang chạy, không đoán endpoint/voice id.
5. Submit job → lưu job và từng segment ở Postgres → chờ provider → lưu binary audio riêng tư.
6. Route download yêu cầu đăng nhập; tải lại trang vẫn còn job/file và master WAV.
7. Claim segment ngăn hai request cùng tạo một đoạn; timeout và retry riêng đoạn đã có. Rate limit/quota theo user vẫn còn phải bổ sung.

Các env code đang đọc:
```dotenv
TTS_PROVIDER=rest # rest | gradio | mock
TTS_ENDPOINT=
TTS_API_TOKEN=
TTS_VOICES_JSON=[]
TTS_MODEL_VERSION=
MEDIA_UPLOAD_DIR=
```

Ví dụ adapter HF/Gradio:
```dotenv
TTS_PROVIDER=gradio
TTS_ENDPOINT=https://harlanitsk-ynda-voice-studio.hf.space
TTS_API_TOKEN=
```

Khi có giọng kênh mới, đặt hai file cùng ID trong thư mục `voices/`; chỉ khi cả WAV và TXT đều có, API mới hiển thị giọng đó. Sau đó đặt `TTS_VOICES_JSON` khớp với các ID này trên host web.

## 5. Các bảng backend

| Bảng | Dữ liệu chính | Ràng buộc |
|---|---|---|
| sessions | id hash, member, expiry, revoked | Không tin email trong cookie làm danh tính |
| idea_drafts | owner, draft id, JSON nội dung, revision, updated_at | Owner-only, optimistic concurrency |
| media_assets | object key, owner, idea, size, type, checksum, version | Xác thực ownership, link có thời hạn |
| voice_profiles | channel, model/version, preset hoặc reference asset, state | Không ghi sample/embedding vào client public |
| audio_jobs / audio_segments | owner, idea/script fingerprint, voice/model, status, error, audio/master | Đã có migration; retry giữ đoạn thành công |

Migrations phải chạy thử trên DB test, không khởi tạo lại/xóa DB đang có. Dùng cơ chế truy vấn Postgres hiện tại; dự án này chưa cần đổi sang Prisma chỉ vì có sẵn skill Prisma.

## 6. Điều kiện nghiệm thu backend

- [ ] Không đăng nhập/giả cookie không đọc hay sửa được dữ liệu riêng.
- [ ] Mất mạng khi viết idea: giữ nháp; đăng nhập trên máy khác: phục hồi từ DB.
- [ ] Submit/retry/double click không tạo hai idea/job/video.
- [ ] Một câu tiếng Việt tạo được WAV thật; nghe không rỗng/lỗi.
- [ ] Đổi giọng hoặc script không tái sử dụng audio từ version cũ.
- [ ] Upload file lớn đi đúng kho và không vượt limit host.
- [ ] Người không có quyền không tải/thay final hoặc kết nối tài khoản.
- [ ] Video chưa Core duyệt không thể bị thay file final.
- [ ] Mỗi lỗi đều có thông báo thật và checkpoint trong WORKLOG.

## 7. Khi hết quota giữa chừng

Không cần nhớ nội dung chat. Mở WORKLOG.md, đọc checkpoint cuối và chạy git status. Với Hugging Face, mở lại đúng Space hiện có, xem App/Files/Logs; không tạo thêm Space trùng. Phần nào chỉ mới upload code hoặc Building phải ghi đúng như vậy, chưa đánh dấu đã tạo được âm thanh.
