# Hướng dẫn kết nối YouTube và TikTok

Cập nhật 17/09/2026. Đây là các bước chuẩn bị tài khoản/API. Backend OAuth và upload của web CHƯA được viết. Các callback dưới đây là đường dẫn dự kiến cần triển khai, hiện chưa dùng để đăng nhập được.

## 1. Những thứ cần chuẩn bị trước

- Tên miền HTTPS ổn định của web; tránh dùng URL preview đổi theo mỗi deploy.
- Tài khoản sở hữu/quản lý kênh YouTube và TikTok.
- Một nơi lưu secrets phía server; local dùng .env.local, production dùng Environment Variables của host.
- Chính sách riêng tư, điều khoản sử dụng và thông tin liên hệ thật khi gửi app xét duyệt. Chưa tự bịa URL hay thông tin doanh nghiệp.
- Phân biệt: Client ID/Client key nhận diện ứng dụng; Client secret thuộc ứng dụng; access/refresh token được cấp sau khi CHỦ KÊNH kết nối. Một API key đơn thuần không cấp quyền đăng video.

## 2. YouTube — tạo ứng dụng và quyền upload

### Các thao tác bạn làm trong Google Cloud

1. Mở [Google Cloud Console](https://console.cloud.google.com/), tạo/chọn project dành cho YNDA.
2. Vào **APIs & Services → Library**, bật **YouTube Data API v3**.
3. Vào **Google Auth Platform**: điền Branding (tên app, email hỗ trợ/liên hệ), chọn Audience phù hợp. Nếu dùng Gmail cá nhân, cấu hình External và thêm chính email quản lý kênh vào Test users khi thử nghiệm.
4. Trong Data Access, chuẩn bị scope upload `https://www.googleapis.com/auth/youtube.upload`. Backend có thể cần thêm `youtube.readonly` để hiện đúng channel đang kết nối; chỉ xin quyền thật sự dùng.
5. Vào **Clients → Create client → Web application**. Nhập redirect URI khớp chính xác với backend dự kiến, gồm scheme, path và dấu `/` cuối:
   - Local: `http://localhost:3000/api/integrations/youtube/callback`
   - Production: `https://TEN-MIEN-CUA-BAN/api/integrations/youtube/callback`
6. Lưu Client ID và Client secret trực tiếp vào nơi cấu hình máy chủ. Không gửi secret vào chat, không commit JSON credentials. Backend sẽ tạo nút “Kết nối YouTube”; bạn đăng nhập đúng chủ kênh và chấp thuận tại Google.

Đường dẫn cấu hình và cơ chế OAuth/refresh được mô tả trong [hướng dẫn OAuth server-side của YouTube](https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps). Tên nhóm UI có thể thay đổi theo giao diện Cloud Console.

### Các biến môi trường dự kiến — chưa được code đọc

```dotenv
APP_BASE_URL=https://TEN-MIEN-CUA-BAN
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REDIRECT_URI=https://TEN-MIEN-CUA-BAN/api/integrations/youtube/callback
OAUTH_TOKEN_ENCRYPTION_KEY=
```

Không điền `YOUTUBE_API_KEY` rồi kỳ vọng đăng được video. Không dùng service account Google Sheets đang có cho kênh YouTube thông thường.

### Backend còn phải làm

- Route connect tạo OAuth state gắn session, callback kiểm tra state/expiry/one-time và đổi code lấy token; request offline access khi cần refresh.
- Lưu token mã hóa ở DB riêng, khóa giải mã ở secret manager. Không trả token trong initialData/client props.
- Lưu external channel ID, tên kênh và scope được cấp; yêu cầu chọn lại nếu user cấp nhầm kênh/Brand Account.
- Upload theo resumable session, lưu video ID để retry không tạo bản trùng. Upload thành công không đồng nghĩa video đã xử lý xong/công khai.
- Đọc processing/privacy status; chỉ chuyển published khi đúng điều kiện. Test đầu tiên dùng một file thử và quyền private, sau khi user đồng ý upload file đó.

### Hai cổng xét duyệt riêng

- OAuth consent verification và YouTube API compliance audit là hai việc khác nhau. Tài liệu videos.insert nêu video từ API project chưa xác minh tạo sau 28/07/2020 bị giới hạn private; audit cần thiết để gỡ giới hạn theo quy trình của YouTube. Không hứa cứ có Client ID là đăng public được. [Nguồn videos.insert](https://developers.google.com/youtube/v3/docs/videos/insert).
- Với External app ở Testing và các scope YouTube, refresh token thường hết hạn sau 7 ngày. Khi gặp `invalid_grant`, cần cho người dùng kết nối lại và xử lý đúng lifecycle; không thử refresh vô hạn. [Nguồn vòng đời OAuth](https://developers.google.com/identity/protocols/oauth2).

## 3. TikTok — kiểm tra tính phù hợp trước khi xin API

**Mô hình hiện tại là web nội bộ để quản lý các kênh của team. Direct Post Guidelines của TikTok liệt kê loại công cụ chỉ đăng vào tài khoản của chính bạn/team là trường hợp không chấp nhận. Vì vậy không chọn Direct Post làm điều kiện bắt buộc để hệ thống vận hành, không khai sai mục đích để xin duyệt.** [Hướng dẫn sử dụng Direct Post](https://developers.tiktok.com/docs/en/content-sharing-guidelines).

Hai luồng kỹ thuật khác nhau:

| Luồng | Scope | Kết quả |
|---|---|---|
| Upload để người dùng hoàn tất | `video.upload` | Gửi video vào luồng inbox; chủ tài khoản cần mở TikTok để biên tập/đăng. Không phải đã xuất bản. |
| Direct Post | `video.publish` | Đăng từ ứng dụng sau khi đủ approval/audit và user chọn tùy chọn hợp lệ. |

Upload API không tự bảo đảm app nội bộ được duyệt; cần mô tả trung thực để TikTok quyết định. Nếu không phù hợp, giữ trang chuẩn bị nội dung + tải file + mở TikTok Studio + lưu URL, hoặc đánh giá dịch vụ đăng bài có tích hợp được chấp thuận.

### Các bước lấy Client key/secret nếu tiếp tục đăng ký

1. Mở [TikTok for Developers](https://developers.tiktok.com/), đăng nhập developer account.
2. Vào **Manage apps → Connect an app**, chọn owner và điền App details: tên, mô tả, biểu tượng, website.
3. Chọn nền tảng Web. Thêm **Login Kit** và **Content Posting API**; chọn scope theo luồng mong muốn.
4. Cấu hình website, Privacy Policy, Terms of Service bằng URL thật và xác minh quyền URL theo dashboard. Làm Sandbox để thử trước.
5. Vào App details → Credentials lấy Client key và Client secret; lưu ở server.
6. Production cần hồ sơ xét duyệt và video demo đầy đủ; chưa coi trạng thái Draft hoặc Sandbox là API đã được duyệt.

[Nguồn đăng ký TikTok app](https://developers.tiktok.com/docs/en/getting-started-create-an-app).

### Callback và cấu hình dự kiến

Web Login Kit yêu cầu callback HTTPS tuyệt đối, tĩnh, không query/hash. Dùng `https://TEN-MIEN-CUA-BAN/api/integrations/tiktok/callback`; không đăng ký `http://localhost` cho luồng web này. [Nguồn Login Kit Web](https://developers.tiktok.com/docs/en/login-kit-web).

```dotenv
TIKTOK_CLIENT_KEY=
TIKTOK_CLIENT_SECRET=
TIKTOK_REDIRECT_URI=https://TEN-MIEN-CUA-BAN/api/integrations/tiktok/callback
```

Các tên env/callback là thiết kế cho dự án; hiện chưa có routes đọc chúng.

### Backend cho từng lựa chọn

- Login Kit: state chống CSRF, kiểm tra scope bị từ chối, đổi code và refresh token trên server; mã hóa token và gắn đúng user/channel.
- Upload: gọi `POST /v2/post/publish/inbox/video/init/`, gửi binary đến upload URL (hoặc dùng URL nguồn hợp lệ), lưu publish_id. Hiện nhắc người dùng mở inbox để hoàn tất; không tự đánh dấu COMPLETE. `PULL_FROM_URL` cần quyền domain/URL prefix đã xác minh. [Nguồn Upload API](https://developers.tiktok.com/docs/en/content-posting-api-reference-upload-video).
- Direct Post chỉ triển khai khi phù hợp/được duyệt: lấy creator_info mới, cho chọn privacy hợp lệ, không tự chọn sẵn privacy; rồi init, upload, kiểm tra kết quả. Client chưa audit bị giới hạn private. [Nguồn bắt đầu Direct Post](https://developers.tiktok.com/docs/en/content-posting-api-get-started).

## 4. Thứ tự nên làm cho dự án này

1. Chốt domain, harden đăng nhập và kho video.
2. Tạo Google project + YouTube OAuth client. Xây và thử YouTube private trước.
3. TikTok: dùng luồng chuẩn bị/đăng thủ công ngay; đánh giá eligibility trước khi đầu tư Direct Post.
4. Xây token store, publishing_jobs và retry/polling dùng chung, tránh trạng thái “đã đăng” giả.
5. Việc cần bạn tự thực hiện: đăng nhập, chấp thuận quyền cho đúng kênh và bước xác minh tài khoản/doanh nghiệp nếu nền tảng yêu cầu. Không cần gửi mật khẩu cho người viết code.

## 5. Checklist bàn giao thông tin (không secret)

- [ ] Domain production và môi trường thử.
- [ ] Google Project ID, Client ID và xác nhận đã lưu secret ở host.
- [ ] Danh sách tên/ID các kênh cần kết nối.
- [ ] TikTok App ID/Client key và trạng thái sandbox/review/scope.
- [ ] URL Privacy Policy và Terms đã xuất bản/xác minh.
- [ ] Đồng ý chọn file thử cụ thể trước khi upload thử lên nền tảng.
