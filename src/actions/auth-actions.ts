"use server";

import { cookies } from "next/headers";
import { adminAuth } from "../lib/firebase-admin";
import { getSpreadsheet } from "../lib/sheets";

export async function loginWithTokenAction(idToken: string) {
  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const email = decodedToken.email;
    if (!email) throw new Error("Tài khoản Google này không có email.");

    const doc = await getSpreadsheet();
    const sheet = doc.sheetsByTitle["Members"];
    if (!sheet) throw new Error("Database thiếu tab 'Members'");

    const rows = await sheet.getRows();
    const member = rows.find(r => r.get('id') === email);
    
    if (!member) {
      throw new Error(`Email ${email} chưa được cấp quyền. Liên hệ Core để thêm vào tab Members.`);
    }

    const cookieStore = await cookies();
    cookieStore.set("currentMemberEmail", email, { 
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

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("currentMemberEmail");
}

export async function getCurrentMember() {
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

    return {
      id: member.get('id'),
      name: member.get('name'),
      role: member.get('role')
    };
  } catch (err) {
    console.error("Lỗi xác thực session Google Sheets:", err);
    return null;
  }
}
