import type { ComponentProps } from "react";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "md" | "sm";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-iris-500 text-surface hover:bg-iris-600 disabled:bg-iris-300",
  secondary:
    "border border-line bg-surface text-ink-soft hover:bg-field disabled:text-muted-soft",
  ghost: "bg-transparent text-ink-soft hover:bg-field disabled:text-muted-soft",
  // DESIGN_SYSTEM.md §8: error fg on error-soft; solid on hover.
  destructive:
    "bg-error-bg text-error hover:bg-error hover:text-surface disabled:opacity-60",
};

// Sizes are a prop rather than a caller-supplied class, so a height override
// can never collide with the default one in the generated stylesheet.
const SIZES: Record<Size, string> = {
  md: "h-[52px] px-6 text-[14px]",
  sm: "h-11 px-[18px] text-[13px]",
};

/** Sora 700 label, 12px radius — the auth designs' button. */
export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return (
    <button
      {...props}
      className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-[12px] font-display font-bold leading-none transition-colors duration-200 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
    />
  );
}
