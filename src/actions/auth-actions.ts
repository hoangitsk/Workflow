"use server";

import { cookies } from "next/headers";

import { getSpreadsheet } from "../lib/sheets";

export async function loginWithCredentialsAction(email: string, phoneOrPassword: string) {
  try {
    const doc = await getSpreadsheet();
    const sheet = doc.sheetsByTitle["Members"];
    if (!sheet) throw new Error("Database thiếu tab 'Members'");

    const rows = await sheet.getRows();
    const member = rows.find(r => r.get('id') === email);
    
    if (!member) {
      throw new Error(`Email ${email} chưa được cấp quyền.`);
    }

    const savedPassword = member.get('password');
    const savedPhone = member.get('phone');

    // Mật khẩu là cột 'password' (nếu có), hoặc 'phone' nếu cột password trống
    const expectedPassword = (savedPassword && savedPassword.trim() !== "") 
      ? savedPassword 
      : savedPhone;

    if (!expectedPassword || expectedPassword.trim() === "") {
      throw new Error(`Tài khoản ${email} chưa thiết lập mật khẩu và số điện thoại. Hãy cập nhật trên Google Sheets.`);
    }

    if (expectedPassword !== phoneOrPassword) {
      throw new Error("Sai mật khẩu (hoặc số điện thoại).");
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
