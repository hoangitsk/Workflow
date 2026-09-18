"use client";
import { useEffect, useState } from "react";

/** Browser drafts are scoped to an account and a document; never submitted automatically. */
export function useLocalDraft<T extends Record<string, string>>(key: string, initial: T) {
  const [value, setValue] = useState(initial);
  const [ready, setReady] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [notice, setNotice] = useState("Đang mở bản nháp…");
  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
          const valid = Object.fromEntries(Object.entries(initial).map(([name, fallback]) => [name, typeof (parsed as Record<string, unknown>)[name] === "string" ? (parsed as Record<string, string>)[name] : fallback])) as T;
          setValue(valid);
          setNotice("Đã khôi phục bản nháp trên trình duyệt này");
        } else setNotice("Bản nháp cũ không hợp lệ. Bạn có thể bắt đầu lại.");
      } else setNotice("Tự lưu trên trình duyệt này");
    } catch { setNotice("Không đọc được bản nháp. Hãy giữ trang mở đến khi nộp xong."); }
    setReady(true);
    // The initial fields define the schema for this mounted draft. Key changes remount the editor.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  function save(next = value) {
    try { localStorage.setItem(key, JSON.stringify(next)); setNotice(`Đã lưu nháp lúc ${new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`); }
    catch { setNotice("Không lưu được bản nháp: bộ nhớ trình duyệt bị chặn hoặc đã đầy."); }
  }
  function update(patch: Partial<T>) {
    const next = { ...value, ...patch };
    setValue(next);
    if (autoSave) save(next); else setNotice("Có thay đổi chưa lưu nháp");
  }
  function clear() {
    try { localStorage.removeItem(key); } catch { /* Submission still succeeds if storage is unavailable. */ }
    setValue(initial);
  }
  return { value, update, ready, autoSave, setAutoSave, notice, save, clear };
}
