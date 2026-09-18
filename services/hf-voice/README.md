---
title: YNDA F5-TTS Voice Studio
emoji: 🎙️
colorFrom: green
colorTo: gray
sdk: gradio
sdk_version: 6.28.0
python_version: 3.10
app_file: app.py
pinned: false
---

# YNDA Voice Studio

Backend tạo giọng bằng F5-TTS v1 Base, dùng voice cloning từ một WAV tham chiếu và transcript chính xác.

- Mỗi giọng là một cặp file trong `voices/`: `kenh_a.wav` và `kenh_a.txt`.
- File TXT phải là lời nói trong WAV, chính xác từng chữ. Không để WAV hoặc transcript thật trong repository công khai.
- Đây là suy luận từ mẫu, không phải đã huấn luyện một model riêng cho kênh. Chỉ dùng giọng bạn có quyền sử dụng.
- Mỗi yêu cầu tối đa 150 từ. File đầu ra WAV. Tải file về trước khi Space khởi động lại.
- Space cần đặt Private. Không đưa script thật hoặc mẫu riêng lên Space Public.
- Runtime ZeroGPU có quota và cold-start; bản này chưa thay thế kho file, voice registry và job queue của web. Lần gọi đầu có thể tải model.
- Model checkpoint F5-TTS có giấy phép CC-BY-NC; cần xác nhận mục đích sử dụng phù hợp trước khi dùng thương mại.

API Gradio: `voices` trả danh sách giọng đã cấu hình; `synthesize` nhận `text`, `voice_id`, `speed` và trả file WAV. API này tương thích với Gradio adapter phía server của web.

Nguồn mô hình/SDK: https://github.com/SWivid/F5-TTS.
Không có khóa API, bản ghi mẫu hoặc thông tin đăng nhập trong repository này.
