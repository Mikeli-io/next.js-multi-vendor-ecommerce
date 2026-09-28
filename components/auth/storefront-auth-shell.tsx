import Link from "next/link";
import type { ReactNode } from "react";

import { Logo } from "@/components/ui/logo";
import { ReturnIcon, ShieldIcon, TruckIcon } from "@/components/ui/icons";

/**
 * Shell for the customer auth screens, following the AUTH section of
 * `designs/.../login.dc.html` and `register.dc.html`: an iris gradient brand
 * panel beside a white form card, on a `--bg` page.
 *
 * The designs embed this section in the full storefront chrome (utility bar,
 * mega-menu header, mega nav, help cards, footer). That chrome is storefront
 * work rather than auth, so this uses a slim header and footer instead.
 */

const BENEFITS = [
  { Icon: TruckIcon, label: "Free delivery on orders over $50" },
  { Icon: ShieldIcon, label: "Secure Stripe checkout & buyer protection" },
  { Icon: ReturnIcon, label: "7-day hassle-free returns" },
] as const;

export function StorefrontAuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="sticky top-0 z-40 border-b border-line-soft bg-surface">
        <div className="mx-auto flex h-[72px] w-full max-w-[var(--container-max)] items-center justify-between gap-6 px-[var(--cpad)]">
          <Logo href="/" />
          <Link
            href="/vendor/login"
            className="text-[13.5px] font-semibold text-ink-soft transition-colors duration-200 hover:text-iris-500"
          >
            Sell on Covet
          </Link>
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-[var(--container-max)] flex-1 grid-cols-1 items-stretch gap-10 px-[var(--cpad)] pb-14 pt-14 lg:grid-cols-[1.05fr_0.95fr]">
        <BrandPanel />
        <div className="flex flex-col justify-center rounded-2xl border border-line-soft bg-surface p-7 shadow-xs sm:p-[44px_46px]">
          {children}
        </div>
      </main>

      <footer className="border-t border-line-soft bg-surface">
        <div className="mx-auto w-full max-w-[var(--container-max)] px-[var(--cpad)] py-6 text-center text-[12.5px] leading-none text-muted">
          © 2026 Covet Marketplace. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

function BrandPanel() {
  return (
    <div className="relative flex min-h-[520px] flex-col justify-between overflow-hidden rounded-2xl bg-[linear-gradient(140deg,var(--iris-900)_0%,var(--iris-700)_55%,var(--iris-500)_100%)] p-[52px_48px] max-lg:hidden">
      {/* Decorative discs from the design. */}
      <div className="pointer-events-none absolute -right-10 -top-[70px] size-[280px] rounded-full bg-white/[0.07]" />
      <div className="pointer-events-none absolute -bottom-[90px] -left-[30px] size-[220px] rounded-full bg-white/[0.05]" />

      <div className="relative">
        <div className="font-display text-[28px] font-extrabold leading-none tracking-[-0.02em] text-surface">
          Covet<span className="text-iris-300">.</span>
        </div>
        <p className="mt-[18px] max-w-[320px] text-[14px] leading-[1.5] text-white/75">
          One storefront, one checkout, thousands of independent sellers and
          brands.
        </p>
      </div>

      <ul className="relative flex flex-col gap-4">
        {BENEFITS.map(({ Icon, label }) => (
          <li key={label} className="flex items-center gap-3 text-surface">
            <span className="grid size-[38px] flex-none place-items-center rounded-[11px] bg-white/[0.14]">
              <Icon />
            </span>
            <span className="text-[13.5px] font-medium leading-[1.4]">
              {label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Title + subtitle block at the top of the form card. */
export function AuthCardHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-[30px]">
      <h1 className="font-display text-[28px] font-extrabold leading-none tracking-[-0.01em] text-ink">
        {title}
      </h1>
      <p className="mt-3 text-[14px] leading-[1.5] text-muted">{subtitle}</p>
    </div>
  );
}
