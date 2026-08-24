"use server";

import { cookies } from "next/headers";
import { getDb } from "../lib/db";
import { Member } from "../lib/types";

import bcrypt from "bcryptjs";

const loginAttempts = new Map<string, { count: number, lastTry: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_TIME_MS = 5 * 60 * 1000;

export async function loginWithCredentialsAction(emailOrUsername: string, passwordInput: string) {
  try {
    const query = emailOrUsername.toLowerCase().trim();
    
    // Rate Limiting check
    const attempt = loginAttempts.get(query) || { count: 0, lastTry: Date.now() };
    if (Date.now() - attempt.lastTry > LOCK_TIME_MS) attempt.count = 0;
    if (attempt.count >= MAX_ATTEMPTS) {
      const remainingMinutes = Math.ceil((LOCK_TIME_MS - (Date.now() - attempt.lastTry)) / 60000);
      return { error: `Thử quá nhiều lần. Vui lòng thử lại sau ${remainingMinutes} phút.` };
    }

    const sql = getDb();
    const rows = await sql.query(
      `SELECT * FROM members WHERE LOWER(TRIM(id)) = $1 OR (username IS NOT NULL AND LOWER(TRIM(username)) = $1) LIMIT 1`,
      [query]
    );

    const member = rows[0] as any;
    
    if (!member) {
      recordFailure(query, attempt);
      return { error: `Tài khoản ${emailOrUsername} không tồn tại trong hệ thống.` };
    }

    const isActive = member.active !== false;
    if (!isActive) {
      recordFailure(query, attempt);
      return { error: "Tài khoản này đã bị vô hiệu hóa / ngừng hoạt động. Vui lòng liên hệ Core." };
    }

    const savedPassword = member.password;
    const savedPhone = member.phone;

    const expectedPassword = (savedPassword && savedPassword.trim() !== "") 
      ? savedPassword.trim() 
      : (savedPhone ? savedPhone.trim() : "");

    if (!expectedPassword) {
      recordFailure(query, attempt);
      return { error: `Tài khoản ${emailOrUsername} chưa thiết lập mật khẩu.` };
    }

    const isHash = expectedPassword.startsWith("$2a$") || expectedPassword.startsWith("$2b$");
    let isMatch = false;

    if (isHash) {
      isMatch = await bcrypt.compare(passwordInput.trim(), expectedPassword);
    } else {
      isMatch = (expectedPassword === passwordInput.trim());
    }

    if (!isMatch) {
      recordFailure(query, attempt);
      return { error: "Sai mật khẩu hoặc số điện thoại xác thực." };
    }

    // Success, reset attempts
    loginAttempts.delete(query);

    const cookieStore = await cookies();
    cookieStore.set("currentMemberEmail", member.id, { 
      path: "/", 
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7
    });
    
    return true;
  } catch (err: any) {
    console.error("Login Error:", err);
    return { error: err.message || "Đăng nhập thất bại" };
  }
}

function recordFailure(query: string, attempt: { count: number, lastTry: number }) {
  attempt.count++;
  attempt.lastTry = Date.now();
  loginAttempts.set(query, attempt);
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("currentMemberEmail");
}

export async function getCurrentMember(): Promise<Member | null> {
  const cookieStore = await cookies();
  const email = cookieStore.get("currentMemberEmail")?.value;
  if (!email) return null;
  
  try {
    const sql = getDb();
    const rows = await sql.query(`SELECT * FROM members WHERE id = $1 LIMIT 1`, [email]);
    const member = rows[0] as any;
    
    if (!member) return null;
    if (member.active === false) return null;

    return {
      id: member.id,
      name: member.name,
      role: (member.role || 'P') as any,
      username: member.username || '',
      phone: member.phone || '',
      facebook: member.facebook || '',
      primaryExpertise: member.primary_expertise || '',
      secondaryExpertise: member.secondary_expertise || '',
      active: true
    };
  } catch (err) {
    console.error("Lỗi xác thực session Postgres:", err);
    return null;
  }
}

export async function changePasswordAction(oldPasswordInput: string, newPasswordInput: string) {
  const currentMember = await getCurrentMember();
  if (!currentMember) throw new Error("Chưa đăng nhập");

  if (!newPasswordInput || newPasswordInput.trim().length < 3) {
    throw new Error("Mật khẩu mới quá ngắn (tối thiểu 3 ký tự)");
  }

  const sql = getDb();
  const rows = await sql.query(`SELECT * FROM members WHERE id = $1 LIMIT 1`, [currentMember.id]);
  const memberRow = rows[0] as any;
  if (!memberRow) throw new Error("Không tìm thấy tài khoản trong hệ thống");

  const savedPassword = memberRow.password;
  const savedPhone = memberRow.phone;
  const expectedOldPassword = (savedPassword && savedPassword.trim() !== "") 
    ? savedPassword.trim() 
    : (savedPhone ? savedPhone.trim() : "");

  const isHash = expectedOldPassword.startsWith("$2a$") || expectedOldPassword.startsWith("$2b$");
  let isMatch = false;

  if (isHash) {
    isMatch = await bcrypt.compare(oldPasswordInput.trim(), expectedOldPassword);
  } else {
    isMatch = (expectedOldPassword === oldPasswordInput.trim());
  }

  if (!isMatch) {
    throw new Error("Mật khẩu cũ không chính xác");
  }

  const newHash = await bcrypt.hash(newPasswordInput.trim(), 10);
  await sql.query(`UPDATE members SET password = $1 WHERE id = $2`, [newHash, currentMember.id]);

  return true;
}


