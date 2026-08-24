"use server";

import { getDb } from "../lib/db";
import crypto from "crypto";

export async function recordAuditLog(
  ideaId: string, 
  memberId: string, 
  action: string, 
  metadata: any = {}
) {
  try {
    const sql = getDb();
    await sql.query(
      `INSERT INTO audit_logs (id, idea_id, member_id, action, metadata, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        crypto.randomUUID(),
        ideaId || '',
        memberId || '',
        action || '',
        typeof metadata === 'string' ? metadata : JSON.stringify(metadata),
        new Date().toISOString()
      ]
    );
  } catch (err) {
    console.error("Lỗi ghi AuditLog:", err);
  }
}

