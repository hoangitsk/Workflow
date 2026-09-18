export type Voice = { id: string; name: string; channelGroupId?: string; description?: string };
export function getVoiceConfig(): Voice[] {
  try {
    const parsed: unknown = JSON.parse(process.env.TTS_VOICES_JSON || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is Voice => !!v && typeof v.id === "string" && typeof v.name === "string" && (!v.channelGroupId || typeof v.channelGroupId === "string"));
  } catch { return []; }
}
