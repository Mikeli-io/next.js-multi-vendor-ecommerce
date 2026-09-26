import type { ComponentType, ReactNode } from "react";

import type { IconProps } from "@/components/ui/icons";

/**
 * The design system's empty and error states (DESIGN_SYSTEM.md §10): icon,
 * message and — where one exists — a primary action.
 *
 * - `inline` sits inside a widget card that has nothing to list yet.
 * - `panel`  stands alone as a page-level card (dashed for empty, error-toned
 *   for error), as in the designs' "Empty" and "Error" preview states.
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
  variant = "inline",
  tone = "neutral",
}: {
  icon: ComponentType<IconProps>;
  title: string;
  body: string;
  action?: ReactNode;
  variant?: "inline" | "panel";
  tone?: "neutral" | "error";
}) {
  const chip =
    tone === "error"
      ? "bg-error-bg text-error-solid"
      : "bg-iris-50 text-iris-400";

  if (variant === "inline") {
    return (
      <div className="flex flex-col items-center rounded-lg border border-dashed border-line-strong px-6 py-9 text-center">
        <span
          className={`mb-4 grid size-[52px] place-items-center rounded-[15px] ${chip}`}
        >
          <Icon size={24} strokeWidth={1.7} />
        </span>
        <p className="font-display text-[15px] font-bold leading-[1.2] text-ink">
          {title}
        </p>
        <p className="mt-2 max-w-[300px] text-[13px] leading-normal text-muted">
          {body}
        </p>
        {action ? <div className="mt-5">{action}</div> : null}
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center rounded-xl bg-surface px-6 py-14 text-center sm:px-8 sm:py-[72px] ${
        tone === "error"
          ? "border border-error/20"
          : "border border-dashed border-line-strong"
      }`}
    >
      <span
        className={`mb-[22px] grid size-[78px] place-items-center rounded-2xl ${chip}`}
      >
        <Icon size={36} strokeWidth={1.6} />
      </span>
      <p className="font-display text-[20px] font-bold leading-[1.2] text-ink">
        {title}
      </p>
      <p className="mt-3 max-w-[360px] text-[14px] leading-normal text-muted">
        {body}
      </p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
