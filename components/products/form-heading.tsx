/** "Add New Product" / "Edit Product" with the design's short iris underline. */
export function FormHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h1 className="font-display text-[24px] font-extrabold leading-none tracking-[-0.01em] text-ink">{title}</h1>
      <div className="mt-3 h-[3px] w-11 rounded-[2px] bg-iris-500" />
      {subtitle ? <p className="mt-3 text-[13px] text-muted">{subtitle}</p> : null}
    </div>
  );
}
