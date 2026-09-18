"use client";

export default function ProductionMapView() {
  return (
    <section className="h-[calc(100vh-7rem)] min-h-[680px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <iframe
        className="h-full w-full border-0"
        src="/api/production-map"
        title="Bản đồ vận hành video"
      />
    </section>
  );
}
