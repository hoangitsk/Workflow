"use server";

import { getDb } from "../lib/db";
import { getCurrentMember } from "./auth-actions";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

export async function createChecklistAction(name: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  const sql = getDb();
  await sql.query(
    `INSERT INTO checklists (id, name, status, created_by_email)
     VALUES ($1, $2, $3, $4)`,
    [crypto.randomUUID(), name, "Chưa bắt đầu", member.id]
  );

  revalidatePath("/");
}

export async function updateChecklistStatusAction(id: string, newStatus: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  const sql = getDb();
  const res = await sql.query(
    `UPDATE checklists SET status = $1 WHERE id = $2 RETURNING id`,
    [newStatus, id]
  );
  if (res.length === 0) throw new Error("Không tìm thấy việc");

  revalidatePath("/");
}

export async function updateChecklistDetailsAction(id: string, assignedToEmail?: string, dueDate?: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  const sql = getDb();
  if (assignedToEmail !== undefined && dueDate !== undefined) {
    await sql.query(
      `UPDATE checklists SET assigned_to_email = $1, due_date = $2 WHERE id = $3`,
      [assignedToEmail, dueDate, id]
    );
  } else if (assignedToEmail !== undefined) {
    await sql.query(
      `UPDATE checklists SET assigned_to_email = $1 WHERE id = $2`,
      [assignedToEmail, id]
    );
  } else if (dueDate !== undefined) {
    await sql.query(
      `UPDATE checklists SET due_date = $1 WHERE id = $2`,
      [dueDate, id]
    );
  }

  revalidatePath("/");
}

export async function deleteChecklistAction(id: string) {
  const member = await getCurrentMember();
  if (!member) throw new Error("Chưa đăng nhập");

  const sql = getDb();
  const rows = await sql.query(`SELECT * FROM checklists WHERE id = $1 LIMIT 1`, [id]);
  const row = rows[0] as any;
  if (!row) throw new Error("Không tìm thấy việc");

  if (member.role !== "Core" && row.created_by_email !== member.id) {
    throw new Error("Chỉ Core hoặc người tạo mới được xoá");
  }

  await sql.query(`DELETE FROM checklists WHERE id = $1`, [id]);
  revalidatePath("/");
}

