"""Private YNDA F5-TTS inference Space. No voice samples or credentials live in source."""

import os
import tempfile
from pathlib import Path

import gradio as gr
import spaces
from f5_tts.api import F5TTS

VOICE_DIR = Path(__file__).parent / "voices"
OUTPUT_DIR = Path(tempfile.gettempdir()) / "ynda-f5-output"
OUTPUT_DIR.mkdir(exist_ok=True)
MODEL: F5TTS | None = None


def available_voices() -> list[tuple[str, str]]:
    """Expose only a voice when its WAV and exact transcript are both present."""
    if not VOICE_DIR.exists():
        return []
    voices: list[tuple[str, str]] = []
    for wav in sorted(VOICE_DIR.glob("*.wav")):
        transcript = wav.with_suffix(".txt")
        if transcript.is_file() and transcript.read_text(encoding="utf-8").strip():
            voices.append((wav.stem.replace("_", " ").title(), wav.stem))
    return voices


def voices():
    return [{"id": voice_id, "name": label, "type": "reference"} for label, voice_id in available_voices()]


def get_model() -> F5TTS:
    global MODEL
    if MODEL is None:
        MODEL = F5TTS(model="F5TTS_v1_Base")
    return MODEL


@spaces.GPU(duration=60)
def synthesize(text: str, voice_id: str, speed: float):
    text = (text or "").strip()
    if not text or len(text.split()) > 150 or len(text) > 10_000:
        raise gr.Error("Nhập 1–150 từ, tối đa 10.000 ký tự cho mỗi đoạn.")

    speed = float(speed)
    if not 0.75 <= speed <= 1.25:
        raise gr.Error("Tốc độ cần nằm trong khoảng 0,75–1,25.")

    voice_id = (voice_id or "").strip()
    reference_audio = VOICE_DIR / f"{voice_id}.wav"
    reference_text = VOICE_DIR / f"{voice_id}.txt"
    if voice_id not in {voice[1] for voice in available_voices()}:
        raise gr.Error("Giọng chưa được cấu hình đủ file WAV và transcript TXT.")

    handle, output_path = tempfile.mkstemp(suffix=".wav", prefix="YNDA_F5_", dir=OUTPUT_DIR)
    os.close(handle)
    try:
        get_model().infer(
            ref_file=str(reference_audio),
            ref_text=reference_text.read_text(encoding="utf-8").strip(),
            gen_text=text,
            speed=speed,
            file_wave=output_path,
        )
    except Exception as exc:
        Path(output_path).unlink(missing_ok=True)
        raise gr.Error(f"F5-TTS chưa tạo được âm thanh: {exc}") from exc
    return output_path


with gr.Blocks(title="YNDA · F5-TTS", delete_cache=(3600, 3600)) as demo:
    gr.Markdown("# Phòng âm thanh YNDA · F5-TTS\nMỗi giọng cần một file WAV mẫu và transcript chính xác cùng tên trong thư mục `voices/`.")
    text = gr.Textbox(label="Lời đọc", lines=6, placeholder="Nhập lời đọc tiếng Việt, tối đa 150 từ.")
    with gr.Row():
        voice = gr.Dropdown(choices=available_voices(), label="Giọng đã cấu hình")
        speed = gr.Slider(0.75, 1.25, value=1, step=0.05, label="Tốc độ")
    generate = gr.Button("Tạo âm thanh", variant="primary")
    output = gr.Audio(label="Nghe và tải WAV", type="filepath", format="wav")
    generate.click(synthesize, inputs=[text, voice, speed], outputs=output, api_name="synthesize", concurrency_limit=1)
    with gr.Accordion("Cách thêm giọng", open=False):
        gr.Markdown("Tải cặp `voices/kenh_a.wav` và `voices/kenh_a.txt` lên Space **Private**. Nội dung TXT phải đúng từng chữ người nói trong WAV.")
        info = gr.JSON(label="Danh sách giọng")
        gr.Button("Đọc danh sách giọng").click(voices, outputs=info, api_name="voices", queue=False)

demo.queue(max_size=8, default_concurrency_limit=1).launch()
