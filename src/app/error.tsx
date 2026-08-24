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
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-sans text-gray-200" style={{ background: '#0a0a0a' }}>
      <div className="bg-[#1D2028] p-8 rounded-lg border border-red-900/50 text-center max-w-md">
        <div className="w-16 h-16 bg-red-950/50 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl text-red-500">⚠️</span>
        </div>
        <h2 className="text-xl font-bold text-gray-100 mb-2">Không thể tải dữ liệu</h2>
        <p className="text-sm text-gray-400 mb-6">
          Có lỗi xảy ra khi kết nối hệ thống. Vui lòng thử lại hoặc báo cho Core team.
        </p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-[#3ED6C4] hover:bg-[#32b8a8] text-[#0B1615] font-semibold rounded transition-colors"
        >
          Thử lại
        </button>
      </div>
    </div>
  );
}
