# Tài Liệu Cấu Trúc Database (Vercel Neon Postgres) — YNDA Workflow

Dự án đã được nâng cấp toàn diện từ **Google Sheets API** sang **Neon Serverless PostgreSQL** (trên hạ tầng Vercel). 
Việc này loại bỏ 100% giới hạn quota (lỗi 429), tăng tốc độ truy vấn từ hàng giây xuống **~10-20ms**, và đảm bảo tính toàn vẹn dữ liệu chuẩn ACID.

---

## 1. Thông Tin Kết Nối (Environment Variables)

Các biến môi trường được cấu hình trong `.env` và tự động liên kết trên Vercel:

```env
# Connection string chính (có Connection Pooling & SSL)
DATABASE_URL="postgresql://neondb_owner:npg_JIKjVqWheM19@ep-silent-sea-aw74zc8w-pooler.c-12.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
POSTGRES_URL="postgresql://neondb_owner:npg_JIKjVqWheM19@ep-silent-sea-aw74zc8w-pooler.c-12.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"

# Direct unpooled connection
DATABASE_URL_UNPOOLED="postgresql://neondb_owner:npg_JIKjVqWheM19@ep-silent-sea-aw74zc8w.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require"
POSTGRES_URL_NON_POOLING="postgresql://neondb_owner:npg_JIKjVqWheM19@ep-silent-sea-aw74zc8w.c-12.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require"
```

> **Ghi chú:** Thông tin Google Sheets cũ vẫn được lưu trong `.env` làm nguồn sao lưu dự phòng.

---

## 2. Danh Sách Các Bảng Dữ Liệu (PostgreSQL Schema)

### 1. `members` (Thành viên & Tài khoản)
| Cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `VARCHAR(255) PRIMARY KEY` | Email của thành viên (ví dụ: `admin@ynda.vn`) |
| `password` | `VARCHAR(255)` | Mật khẩu (hỗ trợ hash bcrypt hoặc plaintext fallback) |
| `name` | `VARCHAR(255) NOT NULL` | Họ và tên hiển thị |
| `role` | `VARCHAR(50) NOT NULL` | Vai trò: `Core`, `E` (Editor), `P` (Producer) |
| `username` | `VARCHAR(100)` | Tên đăng nhập phụ nếu có |
| `phone` | `VARCHAR(50)` | Số điện thoại |
| `facebook` | `TEXT` | Link trang cá nhân Facebook |
| `primary_expertise` | `TEXT` | Chuyên môn chính (Quay phim, Dựng phim, Đạo diễn...) |
| `secondary_expertise` | `TEXT` | Chuyên môn phụ |
| `active` | `BOOLEAN NOT NULL DEFAULT TRUE` | Trạng thái hoạt động (`TRUE` / `FALSE`) |

### 2. `platforms` (Nền tảng xuất bản)
| Cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `VARCHAR(100) PRIMARY KEY` | ID nền tảng (ví dụ: `plat_yt`, `plat_tt`, `plat_reels`) |
| `name` | `VARCHAR(255) NOT NULL` | Tên nền tảng (YouTube, TikTok, Facebook Reels...) |
| `default_duration_days` | `INT NOT NULL DEFAULT 2` | Số ngày sản xuất chuẩn cho nền tảng |

### 3. `channel_groups` (Nhóm Kênh)
| Cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `VARCHAR(100) PRIMARY KEY` | ID kênh (ví dụ: `cg_mt6ynvh4`) |
| `name` | `VARCHAR(255) NOT NULL` | Tên kênh (ví dụ: `YNDA Tâm Lý Học`) |
| `color` | `VARCHAR(50) NOT NULL` | Mã màu HEX đại diện cho kênh (ví dụ: `#3b82f6`) |
| `archived` | `BOOLEAN NOT NULL DEFAULT FALSE` | Trạng thái lưu trữ / ẩn kênh |

### 4. `platform_channels` (Liên kết Kênh & Nền tảng)
| Cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `VARCHAR(100) PRIMARY KEY` | ID liên kết (`pc_{channelGroupId}_{platformId}`) |
| `channel_group_id` | `VARCHAR(100) NOT NULL` | Khóa ngoại trỏ đến `channel_groups.id` |
| `platform_id` | `VARCHAR(100) NOT NULL` | Khóa ngoại trỏ đến `platforms.id` |

### 5. `ideas` (Ý tưởng & Quy trình sản xuất)
| Cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `VARCHAR(100) PRIMARY KEY` | UUID của ý tưởng |
| `title` | `TEXT NOT NULL` | Tiêu đề ý tưởng |
| `description` | `TEXT` | Mô tả chi tiết kịch bản / ý tưởng |
| `platform_channel_id` | `VARCHAR(100)` | Kênh & nền tảng được chọn |
| `submitted_by_email` | `VARCHAR(255)` | Email người đề xuất |
| `status` | `VARCHAR(50) NOT NULL` | Trạng thái: `PITCH`, `ASSIGNMENT`, `SCRIPT`, `PRODUCTION`, `QA`, `COMPLETE`, `ARCHIVED_IDEA`, `CANCELLED` |
| `duration_days` | `INT DEFAULT 0` | Số ngày dự kiến sản xuất |
| `assigned_to_email` | `VARCHAR(255)` | Producer được giao phụ trách |
| `start_date` | `VARCHAR(50)` | Ngày bắt đầu giao việc (`YYYY-MM-DD`) |
| `end_date` | `VARCHAR(50)` | Hạn hoàn thành deadline (`YYYY-MM-DD`) |
| `script_link` | `TEXT` | Link tài liệu kịch bản |
| `video_link` | `TEXT` | Link video nháp / footage |
| `qa_feedback` | `TEXT` | Góp ý sửa chữa từ ban QA |
| `published_link` | `TEXT` | Link video đã xuất bản công khai |
| `scheduled_post_date` | `VARCHAR(50)` | Lịch đăng bài dự kiến |
| `created_at` | `VARCHAR(100)` | Thời điểm tạo |
| `assigned_at` | `VARCHAR(100)` | Thời điểm duyệt giao việc |
| `video_submitted_at` | `VARCHAR(100)` | Thời điểm nộp video |
| `credits_idea_by_email` | `VARCHAR(255)` | Ghi nhận công lao Idea gốc |
| `credits_script_by_email` | `VARCHAR(255)` | Ghi nhận công lao Viết kịch bản |
| `credits_edited_script_by_email` | `VARCHAR(255)` | Ghi nhận Biên tập kịch bản |
| `credits_produced_by_email` | `VARCHAR(255)` | Ghi nhận Sản xuất (Quay/Dựng) |
| `credits_qa_by_email` | `VARCHAR(255)` | Ghi nhận Kiểm duyệt QA |
| `credits_approved_by_email` | `VARCHAR(255)` | Ghi nhận Core duyệt |
| `cancel_reason` | `TEXT` | Lý do hủy nếu có |
| `cancelled_by_email` | `VARCHAR(255)` | Người thực hiện hủy |
| `cancelled_at` | `VARCHAR(100)` | Thời điểm hủy |
| `last_pitch_week` | `VARCHAR(50)` | Ngày pitch |
| `internal_note` | `TEXT` | Ghi chú nội bộ chỉ Core thấy |
| `rating` | `NUMERIC` | Đánh giá sao chất lượng (1 - 5) |
| `tags` | `TEXT` | Danh sách tags phân loại |

### 6. `comments` (Bình luận & Thảo luận)
| Cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `VARCHAR(100) PRIMARY KEY` | UUID bình luận |
| `idea_id` | `VARCHAR(100) NOT NULL` | ID ý tưởng được bình luận |
| `member_id` | `VARCHAR(255) NOT NULL` | Email người gửi bình luận |
| `content` | `TEXT NOT NULL` | Nội dung bình luận |
| `created_at` | `VARCHAR(100) NOT NULL` | Thời gian gửi |

### 7. `audit_logs` (Nhật ký hoạt động hệ thống)
| Cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `VARCHAR(100) PRIMARY KEY` | UUID log |
| `idea_id` | `VARCHAR(100)` | ID ý tưởng liên quan (nếu có) |
| `member_id` | `VARCHAR(255)` | Email người thực hiện thao tác |
| `action` | `TEXT NOT NULL` | Tên hành động |
| `metadata` | `TEXT` | Dữ liệu chi tiết dạng JSON |
| `timestamp` | `VARCHAR(100) NOT NULL` | Thời gian ghi nhận |

### 8. `notifications` (Thông báo trong app)
| Cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `VARCHAR(100) PRIMARY KEY` | UUID thông báo |
| `member_id` | `VARCHAR(255) NOT NULL` | Người nhận thông báo |
| `type` | `VARCHAR(50) NOT NULL` | Loại thông báo: `assigned`, `qa_pass`, `qa_fail`, `comment`, `info`, `warning` |
| `related_idea_id` | `VARCHAR(100)` | ID ý tưởng liên quan |
| `message` | `TEXT NOT NULL` | Nội dung thông báo |
| `read` | `BOOLEAN NOT NULL DEFAULT FALSE` | Đã đọc chưa |
| `created_at` | `VARCHAR(100) NOT NULL` | Thời gian tạo |

### 9. `checklists` (Danh sách việc cần làm)
| Cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | `VARCHAR(100) PRIMARY KEY` | ID công việc |
| `name` | `TEXT NOT NULL` | Tên công việc |
| `assigned_to_email` | `VARCHAR(255)` | Người phụ trách |
| `due_date` | `VARCHAR(50)` | Ngày hết hạn |
| `status` | `VARCHAR(50) NOT NULL` | Trạng thái (`Chưa bắt đầu`, `Đang thực hiện`, `Done`) |
| `created_by_email` | `VARCHAR(255)` | Người tạo |

### 10. `settings` (Cấu hình hệ thống)
| Cột | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `key` | `VARCHAR(100) PRIMARY KEY` | Tên khóa cấu hình (ví dụ: `discordWebhookUrl`, `externalCalendarUrl`) |
| `value` | `TEXT` | Giá trị cấu hình |

---

## 3. Lệnh Quản Trị Hữu Ích

- **Chạy lại tạo bảng / đồng bộ dữ liệu từ Google Sheets sang Postgres:**
  ```bash
  node init-postgres.mjs
  ```

- **Mở giao diện xem & chỉnh sửa bảng trực tiếp trên trình duyệt (Neon SQL Editor):**
  - Vào [Vercel Storage](https://vercel.com/dashboard/stores) -> Chọn database **Neon** -> Bấm **Open in Neon Console** -> Chọn **SQL Editor** hoặc **Tables**.
