import type { ReactNode } from "react";

type Tone = "success" | "warning" | "error" | "info" | "accent" | "neutral";

const TONES: Record<Tone, string> = {
  success: "bg-success-bg text-success",
  warning: "bg-warning-bg text-warning",
  error: "bg-error-bg text-error",
  info: "bg-info-bg text-info",
  accent: "bg-accent-bg text-accent-fg",
  // Inactive / off states that are not an error.
  neutral: "bg-field text-muted",
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
