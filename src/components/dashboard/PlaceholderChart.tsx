export function PlaceholderChart({ title, description, type }: { title: string; description: string; type: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-lang-brown">{title}</h3>
          <p className="mt-1 text-sm text-black/55">{description}</p>
        </div>
        <span className="rounded-full bg-lang-cream px-3 py-1 text-xs font-semibold text-lang-brown">{type}</span>
      </div>
      <div className="mt-3 grid h-56 place-items-center rounded-xl border border-dashed border-black/10 bg-lang-cream/60 text-center text-sm text-black/50">
        Chờ Phase 8–12: kết nối report engine và biểu đồ thật
      </div>
    </div>
  );
}
