# YNDA WORKFLOW NỘI BỘ (BẢN HOÀN CHỈNH v4)

Hệ thống quản lý quy trình sản xuất nội dung số và portfolio cá nhân cho đội ngũ YNDA.

---

## 🌟 TÍNH NĂNG CHÍNH

1. **Bảo Mật & Xác Thực Thật (Server-Side Authorization)**:
   - Phân quyền nghiêm ngặt theo vai trò (`Core`, `Editor - E`, `Producer - P`).
   - Mọi hành động (nộp kịch bản, duyệt idea, nộp video, QA) đều được xác thực danh tính từ phiên đăng nhập thực tế, chặn vượt quyền ở server.
2. **Cấu Trúc 2 Cấp (Kênh → Nền Tảng → Ý Tưởng)**:
   - `ChannelGroup` (Kênh Chính, Kênh Phụ...) gắn với danh mục `Platform` mở (YouTube, TikTok, Facebook Reels...).
   - Ý tưởng gắn trực tiếp với `PlatformChannel` tương ứng.
3. **Quy Trình State Machine Chuẩn & Mô Tả Bắt Buộc**:
   - `PITCH` → `ASSIGNMENT` → `SCRIPT` → `PRODUCTION` → `QA` → `COMPLETE`.
   - Bắt buộc nhập `description` chi tiết khi nộp idea.
   - Bắt buộc nhập `publishedLink` (link video đã xuất bản thật) khi QA hoàn thành.
4. **Dashboard Cá Nhân "Việc Của Tôi Hôm Nay" (Mặc Định)**:
   - Trả lời ngay cho mỗi thành viên: *Hôm nay làm gì, cho idea nào, hạn khi nào*.
   - Tự động đẩy các việc trễ hạn lên đầu với viền đỏ cảnh báo.
5. **Khung Trao Đổi Bình Luận (Threaded Comments)**:
   - Trao đổi trực tiếp trong từng Idea mà không làm xáo trộn trạng thái nghiệp vụ.
   - Tự động thông báo tới người liên quan và bắn tin nhắn vào Discord.
6. **Gantt 2 Tầng & Lịch Đăng Bài**:
   - **Gantt theo Kênh**: Nhóm các hàng theo nền tảng, điều hướng tháng linh hoạt.
   - **Timeline Tổng**: Khung nhìn toàn bộ dự án trên 1 canvas duy nhất.
   - **Lịch Đăng Bài (Content Calendar)**: Lên lịch đăng bài và hỗ trợ link nhúng Notion/Google Calendar.
7. **Trung Tâm Thông Báo In-App (🔔) & Discord Webhook**:
   - Nhận thông báo thời gian thực khi được giao việc, video cần QA, QA chưa đạt, nhắc tên trong bình luận.
8. **Nhật Ký Thay Đổi Bất Biến (Audit Log) & Báo Cáo Tuần**:
   - Lưu trữ toàn bộ lịch sử thao tác hệ thống.
   - Báo cáo tuần tự động tổng hợp năng suất, tỷ lệ QA và gửi trực tiếp vào kênh Discord `#core`.
9. **Portfolio Cá Nhân & Link Công Khai**:
   - Tự động ghi nhận credit thật (Idea gốc, Kịch bản, Biên tập, Sản xuất, QA).
   - Trang `/portfolio/[memberId]` công khai cho phép ứng viên gửi nhà tuyển dụng.

---

## 🚀 HƯỚNG DẪN CHẠY & TRIỂN KHAI

### 1. Cài đặt và chạy Local
```bash
npm install
npm run dev
```
Truy cập [http://localhost:3000](http://localhost:3000).

### 2. Khởi tạo cơ sở dữ liệu (Google Sheets)
```bash
node init-sheet.mjs
```

### 3. Triển khai Vercel (Production)
Chạy script tự động:
```bat
deploy.bat
```
Hoặc liên kết Git repository với Vercel và cấu hình các biến môi trường:
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_SPREADSHEET_ID`
- `DISCORD_WEBHOOK_URL` (tuỳ chọn)

---
*Phát triển bởi đội ngũ YNDA.*

