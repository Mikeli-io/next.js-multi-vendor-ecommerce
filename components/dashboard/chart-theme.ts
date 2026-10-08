/**
 * Chart.js draws on a canvas, which cannot resolve CSS custom properties. These
 * helpers read the design tokens from the document at draw time, so charts stay
 * on-token without copying hex values into component code.
 */

export type SeriesColor = "iris" | "success" | "warning" | "info" | "deep";

const TOKEN: Record<SeriesColor, string> = {
  iris: "--iris-500",
  success: "--success-solid",
  warning: "--warning-solid",
  info: "--info-solid",
  deep: "--iris-900",
};

/** A CSS variable's resolved value, or `fallback` during server rendering. */
export function token(name: string, fallback = "#000000"): string {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

export function seriesColor(color: SeriesColor): string {
  return token(TOKEN[color]);
}

/** `#6544e0` + `0.22` → `rgba(101, 68, 224, 0.22)`. */
export function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const n = Number.parseInt(full, 16);
  if (Number.isNaN(n)) return hex;
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** The body font as next/font registered it, for axis ticks. */
export function bodyFont(): string {
  if (typeof window === "undefined") return "sans-serif";
  return getComputedStyle(document.body).fontFamily;
}
