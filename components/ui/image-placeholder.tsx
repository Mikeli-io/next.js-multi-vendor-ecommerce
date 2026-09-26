/**
 * The dashed placeholder block the design files use where photography will go.
 * Kept until real imagery is supplied, rather than shipping a stock image.
 */
export function ImagePlaceholder({
  label,
  className = "",
  aspect = "16/9",
}: {
  label: string;
  className?: string;
  aspect?: string;
}) {
  return (
    <div
      style={{ aspectRatio: aspect }}
      className={`relative flex w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-[#C9C6D3] bg-[#EAE8F0] ${className}`}
    >
      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(20,18,31,.02)_0_12px,transparent_12px_24px)]" />
      <span className="relative px-6 text-center font-mono text-[12px] font-medium leading-[1.4] text-muted-soft">
        {label}
      </span>
    </div>
  );
}
