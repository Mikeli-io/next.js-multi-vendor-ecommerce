import Link from "next/link";

import { CartIcon } from "./icons";

/** The Covet wordmark: Sora 800 with an iris period (DESIGN_SYSTEM.md §1). */
export function Logo({
  href = "/",
  tone = "ink",
  size = 26,
}: {
  href?: string;
  tone?: "ink" | "light";
  size?: number;
}) {
  return (
    <Link
      href={href}
      style={{ fontSize: `${size}px` }}
      className={`font-display font-extrabold leading-none tracking-[-0.02em] ${
        tone === "light" ? "text-surface hover:text-surface" : "text-ink hover:text-ink"
      }`}
    >
      Covet
      <span className={tone === "light" ? "text-iris-300" : "text-iris-500"}>
        .
      </span>
    </Link>
  );
}

/** The seller-side lockup: iris tile with a cart glyph beside the wordmark. */
export function LogoLockup({ href = "/" }: { href?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-11 flex-none place-items-center rounded-[13px] bg-iris-500 text-surface">
        <CartIcon />
      </span>
      <Logo href={href} size={30} />
    </div>
  );
}
