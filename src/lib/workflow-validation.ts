export function isHttpUrl(value: string): boolean {
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) && !url.username && !url.password; } catch { return false; }
}
export function isPublishUrl(value: string, platform: string): boolean {
  if (!isHttpUrl(value)) return false;
  const url = new URL(value), host = url.hostname.toLowerCase().replace(/^www\./, "");
  const name = platform.toLowerCase();
  if (name.includes("youtube")) return (host === "youtu.be" && url.pathname.length > 1) || ((host === "youtube.com" || host === "m.youtube.com") && ((url.pathname === "/watch" && !!url.searchParams.get("v")) || /^\/(shorts|live)\/[^/]+/.test(url.pathname)));
  if (name.includes("tiktok")) return (host === "tiktok.com" && /\/video\/\d+/.test(url.pathname)) || (["vm.tiktok.com", "vt.tiktok.com"].includes(host) && url.pathname.length > 1);
  if (name.includes("facebook")) return (["facebook.com", "m.facebook.com", "fb.watch"].includes(host) && url.pathname.length > 1);
  return url.pathname.length > 1;
}
