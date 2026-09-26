import { NavTarget } from "@/components/ui/nav-target";

/**
 * The dark storefront footer from the customer designs. The design's
 * newsletter sign-up, social links and street address are not rendered: none
 * has a real destination or backend yet.
 */

const COLUMNS: ReadonlyArray<{
  title: string;
  links: ReadonlyArray<{ label: string; href?: string }>;
}> = [
  {
    title: "Quick Links",
    links: [
      { label: "Profile Info", href: "/dashboard" },
      { label: "Wish List" },
      { label: "Featured Products" },
      { label: "Best Selling" },
      { label: "Track Order" },
    ],
  },
  {
    title: "Other",
    links: [
      { label: "About Us" },
      { label: "Terms & Conditions" },
      { label: "Privacy Policy" },
      { label: "Refund Policy" },
      { label: "Return Policy" },
    ],
  },
];

export function StorefrontFooter() {
  return (
    <footer className="mt-14 bg-ink">
      <div className="mx-auto grid max-w-[var(--container-max)] grid-cols-1 gap-10 px-[var(--cpad)] pt-[60px] sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr]">
        <div className="sm:col-span-2 lg:col-span-1">
          <p className="mb-4 font-display text-[26px] font-extrabold leading-none tracking-[-0.02em] text-surface">
            Covet<span className="text-iris-400">.</span>
          </p>
          <p className="max-w-[280px] text-[13.5px] leading-[1.6] text-on-ink-muted">
            A curated multi-vendor marketplace bringing independent sellers and
            beloved brands under one trusted checkout.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title}>
            <p className="mb-[18px] font-display text-[14px] font-semibold leading-none text-surface">
              {column.title}
            </p>
            <ul className="flex flex-col gap-3 text-[13.5px] leading-none">
              {column.links.map((link) => (
                <li key={link.label}>
                  <NavTarget
                    href={link.href}
                    className="text-on-ink-muted hover:text-surface"
                  >
                    {link.label}
                  </NavTarget>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-11 max-w-[var(--container-max)] border-t border-white/[0.08] px-[var(--cpad)] pb-[34px] pt-7 text-[12.5px] leading-none text-on-ink-faint">
        © 2026 Covet Marketplace. All rights reserved.
      </div>
    </footer>
  );
}
