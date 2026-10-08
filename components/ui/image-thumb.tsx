import Image from "next/image";

/**
 * An uploaded catalog image (brand logo, category image) in a rounded tile,
 * or the item's initial when it has none.
 * `unoptimized`: images are served straight from development-stage local
 * storage (lib/uploads) and each upload gets a unique name, so the optimizer's
 * cache adds nothing but a stale-image risk.
 */
export function ImageThumb({
  src,
  name,
  size = 46,
  className = "",
}: {
  src: string | null;
  name: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      style={{ width: size, height: size }}
      className={`relative grid flex-none place-items-center overflow-hidden rounded-[10px] border border-line-soft bg-field ${className}`}
    >
      {src ? (
        <Image src={src} alt={name} fill sizes={`${size}px`} unoptimized className="object-contain p-1" />
      ) : (
        <span
          aria-hidden="true"
          style={{ fontSize: Math.round(size * 0.38) }}
          className="font-display font-bold uppercase text-muted-soft"
        >
          {name.trim().charAt(0)}
        </span>
      )}
    </span>
  );
}
