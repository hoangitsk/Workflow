"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-sans text-slate-800 p-4 bg-[#F8FAFC]">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl text-center max-w-md w-full">
        <div className="w-14 h-14 bg-rose-50 border border-rose-200 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Đã có lỗi xảy ra</h2>
        <p className="text-xs text-slate-600 mb-4 leading-relaxed">
          Không thể nạp dữ liệu từ máy chủ hoặc cơ sở dữ liệu. Vui lòng thử tải lại trang hoặc kiểm tra kết nối mạng.
        </p>
        {error?.digest && (
          <div className="mb-5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-left">
            <span className="text-[10px] font-mono font-semibold text-slate-500 block mb-0.5">Mã lỗi (Digest):</span>
            <code className="text-xs font-mono text-slate-800 break-all select-all font-bold">{error.digest}</code>
          </div>
        )}
        <div className="flex gap-2 justify-center">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Thử lại
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors border border-slate-200"
          >
            Tải lại trang
          </button>
        </div>
      </div>
    </div>
  );
}
