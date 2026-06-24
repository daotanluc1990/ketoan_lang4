export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-black/10 bg-white p-8 text-center">
      <h3 className="text-lg font-bold text-lang-brown">{title}</h3>
      <p className="mt-2 text-sm text-black/60">{description}</p>
    </div>
  );
}
