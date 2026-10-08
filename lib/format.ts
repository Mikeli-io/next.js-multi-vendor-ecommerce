const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
});

/** `1234.5` → `$1,234.50`. Prices are always shown in Sora (DESIGN_SYSTEM.md §3). */
export function formatMoney(amount: number): string {
  return money.format(amount);
}

/**
 * `james.dawson@gmail.com` → `j****@g***l.com`, matching how the dashboard
 * topbars show the signed-in account without printing the full address on a
 * screen that is often shared or screenshotted.
 */
export function maskEmail(email: string): string {
  const [local = "", domain = ""] = email.split("@");
  const dot = domain.lastIndexOf(".");
  const host = dot > 0 ? domain.slice(0, dot) : domain;
  const tld = dot > 0 ? domain.slice(dot) : "";
  const maskedHost =
    host.length <= 2 ? host : `${host[0]}${"*".repeat(host.length - 2)}${host.at(-1)}`;
  return `${local[0] ?? ""}****@${maskedHost}${tld}`;
}

/** First word of a display name, for greetings like "Hello, Ada". */
export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

/** `2026-09-26T…` → `Sep 26, 2026`. */
export function formatDate(value: Date | string): string {
  return date.format(new Date(value));
}
