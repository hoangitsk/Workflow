import "server-only";

export type SynthesizedAudio = { bytes: Uint8Array; mimeType: string };

export type VoiceProviderState = {
  configured: boolean;
  provider: "rest" | "gradio" | "mock" | "none";
  modelVersion: string;
};

export function getVoiceProviderState(): VoiceProviderState {
  const raw = (process.env.TTS_PROVIDER || "rest").trim().toLowerCase();
  const provider = raw === "mock" || raw === "gradio" || raw === "rest" ? raw : "rest";
  return {
    configured: provider === "mock" || !!process.env.TTS_ENDPOINT,
    provider,
    modelVersion: (process.env.TTS_MODEL_VERSION || "unversioned").trim(),
  };
}

function providerHeaders(contentType = "application/json") {
  return {
    "Content-Type": contentType,
    ...(process.env.TTS_API_TOKEN ? { Authorization: `Bearer ${process.env.TTS_API_TOKEN}` } : {}),
  };
}

function mockWav(text: string, speed: number): SynthesizedAudio {
  const sampleRate = 16_000;
  const duration = Math.min(6, Math.max(0.5, text.split(/\s+/).length * 0.12 / speed));
  const samples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);
  const write = (offset: number, value: string) => {
    for (let index = 0; index < value.length; index += 1) view.setUint8(offset + index, value.charCodeAt(index));
  };
  write(0, "RIFF");
  view.setUint32(4, buffer.byteLength - 8, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, "data");
  view.setUint32(40, samples * 2, true);
  for (let index = 0; index < samples; index += 1) {
    const envelope = Math.min(1, index / 400, (samples - index) / 400);
    const value = Math.sin((index / sampleRate) * Math.PI * 2 * 220) * 0.06 * envelope;
    view.setInt16(44 + index * 2, value * 0x7fff, true);
  }
  return { bytes: new Uint8Array(buffer), mimeType: "audio/wav" };
}

function extractGradioFileUrl(payload: unknown): string | null {
  const candidates: unknown[] = Array.isArray(payload) ? payload : [payload];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && /^https?:\/\//.test(candidate)) return candidate;
    if (candidate && typeof candidate === "object") {
      const record = candidate as Record<string, unknown>;
      for (const key of ["url", "path"]) {
        if (typeof record[key] === "string" && /^https?:\/\//.test(record[key])) return record[key] as string;
      }
    }
  }
  return null;
}

async function synthesizeWithGradio(endpoint: string, text: string, voiceId: string, speed: number): Promise<SynthesizedAudio> {
  const base = endpoint.replace(/\/$/, "");
  const start = await fetch(`${base}/gradio_api/call/synthesize`, {
    method: "POST",
    headers: providerHeaders(),
    body: JSON.stringify({ data: [text, voiceId, speed] }),
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  if (!start.ok) throw new Error(`GRADIO_START_${start.status}`);
  const eventId = String((await start.json() as { event_id?: unknown }).event_id || "");
  if (!eventId) throw new Error("GRADIO_EVENT_MISSING");
  const events = await fetch(`${base}/gradio_api/call/synthesize/${encodeURIComponent(eventId)}`, {
    headers: providerHeaders("text/event-stream"),
    cache: "no-store",
    signal: AbortSignal.timeout(150_000),
  });
  if (!events.ok) throw new Error(`GRADIO_RESULT_${events.status}`);
  const stream = await events.text();
  const complete = stream.match(/event:\s*complete\s*\r?\ndata:\s*(.+)/);
  if (!complete) {
    if (/event:\s*error/.test(stream)) throw new Error("GRADIO_GENERATION_FAILED");
    throw new Error("GRADIO_RESULT_INCOMPLETE");
  }
  let payload: unknown;
  try { payload = JSON.parse(complete[1]); } catch { throw new Error("GRADIO_RESULT_INVALID"); }
  const fileUrl = extractGradioFileUrl(payload);
  if (!fileUrl) throw new Error("GRADIO_FILE_MISSING");
  const file = await fetch(fileUrl, { headers: providerHeaders("application/octet-stream"), cache: "no-store", signal: AbortSignal.timeout(60_000) });
  if (!file.ok) throw new Error(`GRADIO_FILE_${file.status}`);
  const mimeType = file.headers.get("content-type")?.split(";")[0] || "audio/wav";
  return { bytes: new Uint8Array(await file.arrayBuffer()), mimeType };
}

export async function synthesizeSpeech(text: string, voiceId: string, speed: number): Promise<SynthesizedAudio> {
  const state = getVoiceProviderState();
  if (!state.configured) throw new Error("PROVIDER_NOT_CONFIGURED");
  if (state.provider === "mock") return mockWav(text, speed);
  const endpoint = process.env.TTS_ENDPOINT!;
  if (state.provider === "gradio") return synthesizeWithGradio(endpoint, text, voiceId, speed);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: providerHeaders(),
    body: JSON.stringify({ text, voice_id: voiceId, speed }),
    signal: AbortSignal.timeout(150_000),
    cache: "no-store",
    redirect: "error",
  });
  if (!response.ok) throw new Error(`REST_PROVIDER_${response.status}`);
  const mimeType = response.headers.get("content-type")?.split(";")[0] || "";
  if (!mimeType.startsWith("audio/")) throw new Error("REST_PROVIDER_NOT_AUDIO");
  return { bytes: new Uint8Array(await response.arrayBuffer()), mimeType };
}
