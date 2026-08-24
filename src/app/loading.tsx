export default function Loading() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center font-sans text-gray-200" style={{ background: '#0a0a0a' }}>
      <div className="w-12 h-12 border-4 border-[#3ED6C4] border-t-transparent rounded-full animate-spin mb-4"></div>
      <h2 className="text-xl font-bold tracking-wider" style={{ fontFamily: "Oswald, sans-serif" }}>YNDA WORKFLOW</h2>
      <p className="text-xs text-gray-500 mt-2 font-mono">Đang tải dữ liệu từ server...</p>
    </div>
  );
}
