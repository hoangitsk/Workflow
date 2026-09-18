"use client";

/**
 * Công cụ tạo giọng đọc theo phân cảnh — Ý Niệm Điện Ảnh
 * -----------------------------------------------------------------------
 * Một component Next.js (client component) độc lập, gộp cả 4 khu vực:
 *   1) Header: chọn kênh + trạng thái Hugging Face Space + nút ping
 *   2) Input Workspace: dán kịch bản + đếm từ + tự động phân đoạn
 *   3) Chunk Manager: danh sách thẻ phân cảnh, tạo/nghe/làm lại từng đoạn
 *   4) Bottom Action Bar: tạo hàng loạt, gộp file .wav, xuất .zip
 *
 * TÍCH HỢP BACKEND:
 *   - Tìm các đoạn có nhãn "// TODO: gọi API thật ở đây" bên dưới —
 *     đó là những chỗ cần thay bằng fetch() tới Hugging Face Space thật.
 *   - Cần cài đặt: npm install jszip lucide-react
 */

import { useCallback, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Radio,
  RefreshCw,
  Scissors,
  Play,
  Pause,
  Download,
  FolderArchive,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Cấu hình kênh — mỗi kênh ứng với một mã giọng + endpoint riêng ở backend
// ---------------------------------------------------------------------------
type Channel = {
  id: string;
  label: string;
  voiceCode: string;
  spaceEndpoint: string;
};

const CHANNELS: Channel[] = [
  { id: "a", label: "Kênh A", voiceCode: "vi-female-warm-01", spaceEndpoint: "https://hf.space/channel-a" },
  { id: "b", label: "Kênh B", voiceCode: "vi-male-deep-02", spaceEndpoint: "https://hf.space/channel-b" },
  { id: "c", label: "Kênh C", voiceCode: "vi-female-bright-03", spaceEndpoint: "https://hf.space/channel-c" },
  { id: "d", label: "Kênh D", voiceCode: "vi-male-narrator-04", spaceEndpoint: "https://hf.space/channel-d" },
];

type SpaceStatus = "ready" | "cold" | "disconnected";

type SceneStatus = "idle" | "generating" | "done" | "error";

type Scene = {
  id: string;
  index: number;
  text: string;
  status: SceneStatus;
  audioUrl?: string;
  audioBuffer?: AudioBuffer;
};

const WORD_LIMIT = 150;
const SPLIT_MIN = 100;
const SPLIT_MAX = 140;

// ---------------------------------------------------------------------------
// Tiện ích
// ---------------------------------------------------------------------------
function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Cắt kịch bản dài thành các đoạn 100–140 từ, chỉ ngắt tại dấu chấm câu
 * (. ! ?) hoặc xuống dòng, để không cắt ngang một cụm từ.
 */
function smartSplit(script: string): string[] {
  const sentences = script
    .replace(/\r\n/g, "\n")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current: string[] = [];
  let currentWords = 0;

  for (const sentence of sentences) {
    const sentenceWords = countWords(sentence);

    if (currentWords > 0 && currentWords + sentenceWords > SPLIT_MAX) {
      chunks.push(current.join(" "));
      current = [];
      currentWords = 0;
    }

    current.push(sentence);
    currentWords += sentenceWords;

    if (currentWords >= SPLIT_MIN && currentWords <= SPLIT_MAX) {
      chunks.push(current.join(" "));
      current = [];
      currentWords = 0;
    }
  }

  if (current.length) chunks.push(current.join(" "));
  return chunks;
}

/** Ghép nhiều AudioBuffer nối tiếp nhau thành một AudioBuffer duy nhất. */
function concatBuffers(ctx: AudioContext | OfflineAudioContext, buffers: AudioBuffer[]): AudioBuffer {
  const channels = buffers[0].numberOfChannels;
  const sampleRate = buffers[0].sampleRate;
  const totalLength = buffers.reduce((sum, b) => sum + b.length, 0);
  const out = ctx.createBuffer(channels, totalLength, sampleRate);

  for (let ch = 0; ch < channels; ch++) {
    const outData = out.getChannelData(ch);
    let offset = 0;
    for (const b of buffers) {
      outData.set(b.getChannelData(Math.min(ch, b.numberOfChannels - 1)), offset);
      offset += b.length;
    }
  }
  return out;
}

/** Chuyển AudioBuffer thành file .wav (PCM 16-bit) dạng Blob. */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numFrames = buffer.length;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const dataSize = numFrames * blockAlign;
  const bufferArr = new ArrayBuffer(44 + dataSize);
  const view = new DataView(bufferArr);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, dataSize, true);

  const channelData: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) channelData.push(buffer.getChannelData(ch));

  let offset = 44;
  for (let i = 0; i < numFrames; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channelData[ch][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
      offset += 2;
    }
  }

  return new Blob([bufferArr], { type: "audio/wav" });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Component chính
// ---------------------------------------------------------------------------
export default function TTSStudio() {
  const [channelId, setChannelId] = useState<string>(CHANNELS[0].id);
  const [channelMenuOpen, setChannelMenuOpen] = useState(false);
  const [spaceStatus, setSpaceStatus] = useState<SpaceStatus>("cold");
  const [pinging, setPinging] = useState(false);

  const [script, setScript] = useState("");
  const [scenes, setScenes] = useState<Scene[]>([]);

  const [batchRunning, setBatchRunning] = useState(false);
  const [batchProgress, setBatchProgress] = useState({ done: 0, total: 0 });
  const [merging, setMerging] = useState(false);
  const [zipping, setZipping] = useState(false);

  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const channel = useMemo(() => CHANNELS.find((c) => c.id === channelId)!, [channelId]);
  const wordCount = countWords(script);
  const overLimit = wordCount > WORD_LIMIT;

  // --- Trạng thái Space ------------------------------------------------
  const statusMeta: Record<SpaceStatus, { label: string; dot: string; text: string; bg: string }> = {
    ready: { label: "Sẵn sàng", dot: "bg-emerald-500", text: "text-emerald-800", bg: "bg-emerald-50 border-emerald-200" },
    cold: { label: "Đang khởi động", dot: "bg-amber-500", text: "text-amber-800", bg: "bg-amber-50 border-amber-200" },
    disconnected: { label: "Mất kết nối", dot: "bg-rose-500", text: "text-rose-800", bg: "bg-rose-50 border-rose-200" },
  };

  const pingServer = useCallback(async () => {
    setPinging(true);
    try {
      // TODO: gọi API thật ở đây — ping endpoint để đánh thức HF Space
      // await fetch(`${channel.spaceEndpoint}/health`);
      await new Promise((r) => setTimeout(r, 1400));
      setSpaceStatus("ready");
    } catch {
      setSpaceStatus("disconnected");
    } finally {
      setPinging(false);
    }
  }, [channel]);

  // --- Phân đoạn ---------------------------------------------------------
  const handleSmartSplit = () => {
    const chunks = smartSplit(script);
    setScenes(
      chunks.map((text, i) => ({
        id: `scene-${Date.now()}-${i}`,
        index: i + 1,
        text,
        status: "idle",
      }))
    );
  };

  // --- Tạo giọng cho một phân cảnh (mô phỏng gọi backend) ---------------
  const generateScene = useCallback(
    async (sceneId: string) => {
      setScenes((prev) => prev.map((s) => (s.id === sceneId ? { ...s, status: "generating" } : s)));

      try {
        const scene = scenes.find((s) => s.id === sceneId);
        const durationSec = Math.max(1.2, (scene ? countWords(scene.text) : 20) / 2.8);

        // TODO: gọi API thật ở đây — thay khối mô phỏng bên dưới bằng:
        // const res = await fetch(channel.spaceEndpoint + "/generate", {
        //   method: "POST",
        //   body: JSON.stringify({ text: scene.text, voice: channel.voiceCode }),
        // });
        // const blob = await res.blob();
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const offline = new OfflineAudioContext(1, Math.ceil(ctx.sampleRate * durationSec), ctx.sampleRate);
        const osc = offline.createOscillator();
        const gain = offline.createGain();
        osc.frequency.value = 180 + Math.random() * 60;
        gain.gain.setValueAtTime(0.0001, 0);
        gain.gain.exponentialRampToValueAtTime(0.18, 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, durationSec);
        osc.connect(gain).connect(offline.destination);
        osc.start(0);
        osc.stop(durationSec);
        const rendered = await offline.startRendering();
        const blob = audioBufferToWav(rendered);
        const url = URL.createObjectURL(blob);

        await new Promise((r) => setTimeout(r, 500));

        setScenes((prev) =>
          prev.map((s) => (s.id === sceneId ? { ...s, status: "done", audioUrl: url, audioBuffer: rendered } : s))
        );
      } catch {
        setScenes((prev) => prev.map((s) => (s.id === sceneId ? { ...s, status: "error" } : s)));
      }
    },
    [scenes, channel]
  );

  // --- Tạo hàng loạt theo hàng đợi tuần tự -------------------------------
  const generateAll = async () => {
    setBatchRunning(true);
    setBatchProgress({ done: 0, total: scenes.length });
    for (let i = 0; i < scenes.length; i++) {
      await generateScene(scenes[i].id);
      setBatchProgress({ done: i + 1, total: scenes.length });
    }
    setBatchRunning(false);
  };

  // --- Gộp & tải 1 file .wav ---------------------------------------------
  const mergeAndDownload = async () => {
    const ready = scenes.filter((s) => s.audioBuffer);
    if (!ready.length) return;
    setMerging(true);
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const merged = concatBuffers(ctx, ready.map((s) => s.audioBuffer!));
      const blob = audioBufferToWav(merged);
      downloadBlob(blob, `${channel.label.replace(/\s+/g, "_")}_full.wav`);
    } finally {
      setMerging(false);
    }
  };

  // --- Xuất bộ file rời .zip ----------------------------------------------
  const exportZip = async () => {
    const ready = scenes.filter((s) => s.audioBuffer);
    if (!ready.length) return;
    setZipping(true);
    try {
      // Cần: npm install jszip
      const { default: JSZip } = await import("jszip");
      const zip = new JSZip();
      ready.forEach((s) => {
        const blob = audioBufferToWav(s.audioBuffer!);
        zip.file(`scene_${String(s.index).padStart(2, "0")}.wav`, blob);
      });
      const content = await zip.generateAsync({ type: "blob" });
      downloadBlob(content, `${channel.label.replace(/\s+/g, "_")}_scenes.zip`);
    } finally {
      setZipping(false);
    }
  };

  const togglePlay = (scene: Scene) => {
    if (!scene.audioUrl) return;
    if (playingId === scene.id) {
      audioElRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioElRef.current) {
      audioElRef.current.src = scene.audioUrl;
      audioElRef.current.play();
      setPlayingId(scene.id);
    }
  };

  const doneCount = scenes.filter((s) => s.status === "done").length;

  return (
    <div className="min-h-screen bg-[#F1E7DC] text-[#271E1B]">
      <audio ref={audioElRef} onEnded={() => setPlayingId(null)} className="hidden" />

      {/* ---------------- Header ---------------- */}
      <header className="sticky top-0 z-20 border-b border-[#C8A898] bg-[#F1E7DC]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-5 py-3">
          <div className="mr-auto">
            <p className="text-sm font-medium tracking-tight text-[#381412]">Tạo giọng đọc — Ý Niệm Điện Ảnh</p>
            <p className="text-xs text-[#734D44]">Mã giọng hiện tại: {channel.voiceCode}</p>
          </div>

          {/* Chọn kênh */}
          <div className="relative">
            <button
              onClick={() => setChannelMenuOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg border border-[#C8A898] bg-white px-3 py-2 text-sm font-medium text-[#381412] shadow-sm hover:bg-[#F1E7DC]"
            >
              <Radio size={15} className="text-[#552824]" />
              {channel.label}
              <ChevronDown size={15} className={`transition-transform ${channelMenuOpen ? "rotate-180" : ""}`} />
            </button>
            {channelMenuOpen && (
              <div className="absolute right-0 z-30 mt-1 w-48 overflow-hidden rounded-lg border border-[#C8A898] bg-white shadow-lg">
                {CHANNELS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setChannelId(c.id);
                      setChannelMenuOpen(false);
                      setSpaceStatus("cold");
                    }}
                    className={`block w-full px-3 py-2 text-left text-sm hover:bg-[#F1E7DC] ${
                      c.id === channelId ? "bg-[#F1E7DC] font-medium text-[#381412]" : "text-[#552824]"
                    }`}
                  >
                    {c.label}
                    <span className="ml-2 text-xs text-[#A98A7C]">{c.voiceCode}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Huy hiệu trạng thái */}
          <span
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${statusMeta[spaceStatus].bg} ${statusMeta[spaceStatus].text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusMeta[spaceStatus].dot}`} />
            {statusMeta[spaceStatus].label}
          </span>

          {/* Ping */}
          <button
            onClick={pingServer}
            disabled={pinging}
            className="flex items-center gap-1.5 rounded-lg bg-[#381412] px-3 py-2 text-sm font-medium text-[#F1E7DC] shadow-sm hover:bg-[#552824] disabled:opacity-60"
          >
            {pinging ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Kiểm tra kết nối
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-6 pb-28">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[400px_1fr] lg:items-start">
          {/* ---------------- Input Workspace (cố định bên trái) ---------------- */}
          <section className="rounded-xl border border-[#C8A898] bg-white p-4 shadow-sm lg:sticky lg:top-20">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#381412]">Kịch bản gốc</h2>
              <span
                className={`text-xs font-medium ${overLimit ? "text-amber-600" : "text-[#734D44]"}`}
              >
                {wordCount} từ
              </span>
            </div>

            <textarea
              value={script}
              onChange={(e) => setScript(e.target.value)}
              placeholder="Dán toàn bộ kịch bản video vào đây…"
              rows={14}
              className={`w-full resize-y rounded-lg border p-3 text-sm leading-relaxed outline-none focus:ring-2 ${
                overLimit
                  ? "border-amber-300 bg-amber-50 focus:ring-amber-300"
                  : "border-[#E4C7B5] bg-[#F1E7DC]/40 focus:ring-[#C8A898]"
              }`}
            />

            {overLimit && (
              <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                Dài hơn {WORD_LIMIT} từ có thể khiến giọng đọc kém tự nhiên — nên chia nhỏ trước khi tạo.
              </div>
            )}

            <button
              onClick={handleSmartSplit}
              disabled={!script.trim()}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-[#381412] px-3 py-2 text-sm font-medium text-[#381412] hover:bg-[#381412] hover:text-[#F1E7DC] disabled:cursor-not-allowed disabled:border-[#C8A898] disabled:text-[#A98A7C] disabled:hover:bg-transparent"
            >
              <Scissors size={15} />
              Tự động phân đoạn
            </button>

            {scenes.length > 0 && (
              <p className="mt-3 text-center text-xs text-[#A98A7C]">
                Đã chia thành {scenes.length} phân cảnh — chỉnh sửa kịch bản và bấm lại để chia lại.
              </p>
            )}
          </section>

          {/* ---------------- Chunk Manager (cuộn riêng bên phải) ---------------- */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#381412]">Phân cảnh</h2>
              {scenes.length > 0 && (
                <span className="text-xs text-[#734D44]">
                  {doneCount}/{scenes.length} đã tạo xong
                </span>
              )}
            </div>

            {scenes.length === 0 ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-[#C8A898] bg-white/60 px-6 text-center">
                <Scissors size={20} className="mb-2 text-[#C8A898]" />
                <p className="text-sm text-[#734D44]">
                  Dán kịch bản bên trái rồi bấm "Tự động phân đoạn" — các thẻ phân cảnh sẽ xuất hiện ở đây.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-3">
                {scenes.map((scene) => {
                  const scWords = countWords(scene.text);
                  return (
                    <div
                      key={scene.id}
                      className="flex flex-col rounded-xl border border-[#E4C7B5] bg-white p-4 shadow-sm"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-xs font-semibold uppercase tracking-wide text-[#734D44]">
                          Phân cảnh {scene.index}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="text-xs text-[#A98A7C]">{scWords} từ</span>
                          <SceneStatusIcon status={scene.status} />
                        </span>
                      </div>

                      <p className="mb-3 flex-1 text-sm leading-relaxed text-[#271E1B]">{scene.text}</p>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => generateScene(scene.id)}
                          disabled={scene.status === "generating"}
                          className="flex items-center gap-1.5 rounded-md bg-[#552824] px-3 py-1.5 text-xs font-medium text-[#F1E7DC] hover:bg-[#381412] disabled:opacity-60"
                        >
                          {scene.status === "generating" ? (
                            <Loader2 size={13} className="animate-spin" />
                          ) : scene.status === "done" ? (
                            <RefreshCw size={13} />
                          ) : null}
                          {scene.status === "done" ? "Làm lại" : "Tạo giọng"}
                        </button>

                        {scene.status === "done" && scene.audioUrl && (
                          <button
                            onClick={() => togglePlay(scene)}
                            className="flex items-center gap-1.5 rounded-md border border-[#C8A898] px-3 py-1.5 text-xs font-medium text-[#381412] hover:bg-[#F1E7DC]"
                          >
                            {playingId === scene.id ? <Pause size={13} /> : <Play size={13} />}
                            {playingId === scene.id ? "Đang phát" : "Nghe thử"}
                          </button>
                        )}

                        {scene.status === "error" && (
                          <span className="text-xs font-medium text-rose-600">Lỗi — thử lại</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ---------------- Bottom Action Bar ---------------- */}
      {scenes.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#C8A898] bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-5 py-3">
            <button
              onClick={generateAll}
              disabled={batchRunning}
              className="flex items-center gap-1.5 rounded-lg bg-[#381412] px-4 py-2 text-sm font-medium text-[#F1E7DC] shadow-sm hover:bg-[#552824] disabled:opacity-60"
            >
              {batchRunning ? <Loader2 size={15} className="animate-spin" /> : null}
              {batchRunning
                ? `Đang tạo ${batchProgress.done}/${batchProgress.total} đoạn…`
                : "Xuất toàn bộ kịch bản"}
            </button>

            {batchRunning && (
              <div className="h-1.5 w-32 overflow-hidden rounded-full bg-[#E4C7B5]">
                <div
                  className="h-full bg-[#381412] transition-all"
                  style={{ width: `${(batchProgress.done / Math.max(1, batchProgress.total)) * 100}%` }}
                />
              </div>
            )}

            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={mergeAndDownload}
                disabled={merging || doneCount === 0}
                className="flex items-center gap-1.5 rounded-lg border border-[#381412] px-3 py-2 text-sm font-medium text-[#381412] hover:bg-[#381412] hover:text-[#F1E7DC] disabled:cursor-not-allowed disabled:border-[#C8A898] disabled:text-[#A98A7C] disabled:hover:bg-transparent"
              >
                {merging ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                Gộp &amp; Tải 1 file (.wav)
              </button>
              <button
                onClick={exportZip}
                disabled={zipping || doneCount === 0}
                className="flex items-center gap-1.5 rounded-lg border border-[#381412] px-3 py-2 text-sm font-medium text-[#381412] hover:bg-[#381412] hover:text-[#F1E7DC] disabled:cursor-not-allowed disabled:border-[#C8A898] disabled:text-[#A98A7C] disabled:hover:bg-transparent"
              >
                {zipping ? <Loader2 size={15} className="animate-spin" /> : <FolderArchive size={15} />}
                Tải bộ file rời (.zip)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SceneStatusIcon({ status }: { status: SceneStatus }) {
  switch (status) {
    case "generating":
      return <Loader2 size={14} className="animate-spin text-[#734D44]" />;
    case "done":
      return <CheckCircle2 size={14} className="text-emerald-600" />;
    case "error":
      return <XCircle size={14} className="text-rose-600" />;
    default:
      return <span className="h-2 w-2 rounded-full bg-[#E4C7B5]" />;
  }
}
