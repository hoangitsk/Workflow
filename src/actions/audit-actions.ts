"use server";

import { getSpreadsheet } from "../lib/sheets";
import crypto from "crypto";

export async function recordAuditLog(
  ideaId: string, 
  memberId: string, 
  action: string, 
  metadata: any = {}
) {
  try {
    const doc = await getSpreadsheet();
    const sheet = doc.sheetsByTitle["AuditLogs"];
    if (!sheet) return;

    await sheet.addRow({
      id: crypto.randomUUID(),
      ideaId: ideaId || '',
      memberId: memberId || '',
      action: action || '',
      metadata: typeof metadata === 'string' ? metadata : JSON.stringify(metadata),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    console.error("Lỗi ghi AuditLog:", err);
  }
}
