import type { ComponentType, ReactNode } from "react";

import type { IconProps } from "@/components/ui/icons";
import { NavTarget } from "@/components/ui/nav-target";

export type Tone = "iris" | "success" | "warning" | "error" | "info";

/** Soft background + readable foreground per tone (DESIGN_SYSTEM.md §2). */
export const TONE_CHIP: Record<Tone, string> = {
  iris: "bg-iris-50 text-iris-500",
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning-solid",
  error: "bg-error-bg text-error-solid",
  info: "bg-info-bg text-info",
};

const TONE_TEXT: Record<Tone, string> = {
  iris: "text-iris-500",
  success: "text-success-solid",
  warning: "text-star",
  error: "text-error-solid",
  info: "text-info",
};

/**
 * The white panel every dashboard widget sits in. Its body is a size
 * container, so the grids inside respond to the card's width rather than the
 * viewport's — the same widget reads well with the sidebar open, collapsed, or
 * on a tablet.
 *
 * Header styles follow the designs:
 * - `lg`  — 30px tinted icon chip, 17px title (analytics, wallet, charts)
 * - `md`  — 28px tinted icon chip, 16px title (vendor product lists)
 * - `sm`  — bare coloured glyph, 15px title (admin lists)
 */
export function SectionCard({
  title,
  icon: Icon,
  tone = "iris",
  size = "lg",
  action,
  children,
  className = "",
}: {
  title: string;
  icon?: ComponentType<IconProps>;
  tone?: Tone;
  size?: "lg" | "md" | "sm";
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const padding = size === "lg" ? "p-5 sm:p-[24px_26px]" : "p-5 sm:p-[22px_24px]";
  const headerGap = size === "lg" ? "mb-5" : size === "md" ? "mb-[18px]" : "mb-4";
  const titleSize =
    size === "lg" ? "text-[17px]" : size === "md" ? "text-[16px]" : "text-[15px]";

  return (
    <section
      className={`@container min-w-0 rounded-xl border border-line-soft bg-surface shadow-xs ${padding} ${className}`}
    >
      <div
        className={`flex flex-wrap items-center justify-between gap-3 ${headerGap}`}
      >
        <div className="flex items-center gap-[10px]">
          {Icon && size !== "sm" ? (
            <span
              className={`grid flex-none place-items-center ${
                size === "lg" ? "size-[30px] rounded-[9px]" : "size-7 rounded-sm"
              } ${TONE_CHIP[tone]}`}
            >
              <Icon size={size === "lg" ? 17 : 16} />
            </span>
          ) : null}
          {Icon && size === "sm" ? (
            <Icon size={18} className={TONE_TEXT[tone]} />
          ) : null}
          <h2
            className={`font-display font-bold leading-none text-ink ${titleSize}`}
          >
            {title}
          </h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/** The "View All" link in list-card headers. */
export function ViewAll({ href }: { href?: string }) {
  return (
    <NavTarget
      href={href}
      className="text-[12.5px] font-semibold leading-none text-iris-500 hover:text-iris-600"
    >
      View All
    </NavTarget>
  );
}

/** The bordered "Overall Statistics" style pill in section headers. */
export function PeriodLabel({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-10 items-center rounded-[10px] border border-line px-[14px] text-[13px] font-medium leading-none text-ink-soft">
      {children}
    </span>
  );
}

/** A small heading that groups a row of cards ("Users", "Stores", ...). */
export function GroupHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-4 font-display text-[18px] font-bold leading-none text-ink">
      {children}
    </h2>
  );
}
