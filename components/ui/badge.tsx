import type { ReactNode } from "react";

type Tone = "success" | "warning" | "error" | "info" | "accent";

const TONES: Record<Tone, string> = {
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  error: "bg-error-bg text-error",
  info: "bg-info-bg text-info",
  accent: "bg-accent-bg text-accent-fg",
};

export function Badge({
  tone = "accent",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-[11px] py-[5px] text-[11px] font-semibold ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
