"use server";

import { cookies } from "next/headers";
import { getSpreadsheet } from "../lib/sheets";
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
      throw new Error(`Thử quá nhiều lần. Vui lòng thử lại sau ${remainingMinutes} phút.`);
    }

    const doc = await getSpreadsheet();
    const sheet = doc.sheetsByTitle["Members"];
    if (!sheet) throw new Error("Database thiếu tab 'Members'");

    const rows = await sheet.getRows();
    const member = rows.find(r => {
      const id = (r.get('id') || '').toLowerCase().trim();
      const username = (r.get('username') || '').toLowerCase().trim();
      return id === query || (username && username === query);
    });
    
    if (!member) {
      recordFailure(query, attempt);
      throw new Error(`Tài khoản ${emailOrUsername} không tồn tại trong hệ thống.`);
    }

    const isActive = member.get('active') !== 'FALSE' && member.get('active') !== 'false';
    if (!isActive) {
      recordFailure(query, attempt);
      throw new Error("Tài khoản này đã bị vô hiệu hóa / ngừng hoạt động. Vui lòng liên hệ Core.");
    }

    const savedPassword = member.get('password');
    const savedPhone = member.get('phone');

    const expectedPassword = (savedPassword && savedPassword.trim() !== "") 
      ? savedPassword.trim() 
      : (savedPhone ? savedPhone.trim() : "");

    if (!expectedPassword) {
      recordFailure(query, attempt);
      throw new Error(`Tài khoản ${emailOrUsername} chưa thiết lập mật khẩu.`);
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
      throw new Error("Sai mật khẩu hoặc số điện thoại xác thực.");
    }

    // Success, reset attempts
    loginAttempts.delete(query);

    const cookieStore = await cookies();
    cookieStore.set("currentMemberEmail", member.get('id'), { 
      path: "/", 
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7
    });
    
    return true;
  } catch (err: any) {
    console.error("Login Error:", err);
    throw new Error(err.message || "Đăng nhập thất bại");
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
    const doc = await getSpreadsheet();
    const sheet = doc.sheetsByTitle["Members"];
    if (!sheet) return null;

    const rows = await sheet.getRows();
    const member = rows.find(r => r.get('id') === email);
    
    if (!member) return null;

    const isActive = member.get('active') !== 'FALSE' && member.get('active') !== 'false';
    if (!isActive) return null;

    return {
      id: member.get('id'),
      name: member.get('name'),
      role: (member.get('role') || 'P') as any,
      username: member.get('username') || '',
      phone: member.get('phone') || '',
      facebook: member.get('facebook') || '',
      primaryExpertise: member.get('primaryExpertise') || '',
      secondaryExpertise: member.get('secondaryExpertise') || '',
      active: true
    };
  } catch (err) {
    console.error("Lỗi xác thực session Google Sheets:", err);
    return null;
  }
}

export async function changePasswordAction(oldPasswordInput: string, newPasswordInput: string) {
  const currentMember = await getCurrentMember();
  if (!currentMember) throw new Error("Chưa đăng nhập");

  if (!newPasswordInput || newPasswordInput.trim().length < 3) {
    throw new Error("Mật khẩu mới quá ngắn (tối thiểu 3 ký tự)");
  }

  const doc = await getSpreadsheet();
  const sheet = doc.sheetsByTitle["Members"];
  if (!sheet) throw new Error("Database thiếu tab 'Members'");

  const rows = await sheet.getRows();
  const memberRow = rows.find(r => r.get('id') === currentMember.id);
  if (!memberRow) throw new Error("Không tìm thấy tài khoản trong hệ thống");

  const savedPassword = memberRow.get('password');
  const savedPhone = memberRow.get('phone');
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
  memberRow.set('password', newHash);
  await memberRow.save();

  return true;
}

