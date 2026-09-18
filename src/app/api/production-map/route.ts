import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves the editable production-map source as a standalone document.
 * Keeping the source at the repository root lets the team update index.html
 * without having to duplicate it inside the React application.
 */
export async function GET() {
  const html = await readFile(path.join(process.cwd(), "index.html"), "utf8");

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
