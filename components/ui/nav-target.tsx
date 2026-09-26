import Link from "next/link";
import type { ReactNode } from "react";

/**
 * A navigation item that links when its destination exists, and otherwise
 * renders the same element inert. The dashboard designs show navigation for
 * areas later phases will build (orders, products, POS, ...); drawing them as
 * dead `#` links would be worse than drawing them as not-yet-available.
 */
export function NavTarget({
  href,
  className,
  children,
  label,
}: {
  /** Omit when the destination is not built yet. */
  href?: string;
  className: string;
  children: ReactNode;
  /** Accessible name, for icon-only targets. */
  label?: string;
}) {
  if (href) {
    return (
      <Link href={href} className={className} aria-label={label}>
        {children}
      </Link>
    );
  }

  return (
    <span
      role="link"
      aria-disabled="true"
      aria-label={label}
      title="Coming soon"
      className={`${className} cursor-default`}
    >
      {children}
    </span>
  );
}
