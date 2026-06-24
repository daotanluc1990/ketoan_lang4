export function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4 flex flex-col justify-between gap-2 md:flex-row md:items-end">
      <div>
        <h3 className="text-base font-bold text-lang-brown">{title}</h3>
        {description ? <p className="mt-1 text-sm text-black/55">{description}</p> : null}
      </div>
    </div>
  );
}
