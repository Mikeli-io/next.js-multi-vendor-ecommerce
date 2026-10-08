import type { AppRole, AppVendorStatus } from "./roles";

/**
 * Route ownership, in one place, shared by `proxy.ts` (optimistic gate) and
 * `lib/auth/guards.ts` (the real, server-side check).
 *
 * Deliberately: no redirect target here is ever taken from the request. Every
 * destination below is a fixed literal, so no open-redirect is possible.
 */

export const UNAUTHORIZED_PATH = "/unauthorized";

/**
 * Sign-in and registration screens. Public, and additionally the pages a user
 * who already has a session should be bounced away from.
 */
export const AUTH_ENTRY_PATHS = [
  "/login",
  "/register",
  "/vendor/login",
  "/vendor/register",
  "/admin/login",
] as const;

/**
 * Everything reachable without a session.
 *
 * `/unauthorized` is public but is *not* an auth entry: it must keep rendering
 * for a signed-in user, since that is exactly who gets sent there. Bouncing
 * signed-in users off it would send them straight back to their own dashboard
 * and swallow every role-mismatch redirect.
 */
export const PUBLIC_PATHS = [
  ...AUTH_ENTRY_PATHS,
  UNAUTHORIZED_PATH,
] as const;

/** Entire namespaces owned by a single role. Order matters: first match wins. */
export const PROTECTED_AREAS = [
  { prefix: "/admin", role: "ADMIN", loginPath: "/admin/login" },
  { prefix: "/vendor", role: "VENDOR", loginPath: "/vendor/login" },
  { prefix: "/dashboard", role: "CUSTOMER", loginPath: "/login" },
] as const satisfies ReadonlyArray<{
  prefix: string;
  role: AppRole;
  loginPath: string;
}>;

/** Where a role's sign-in lives; also where logout returns them. */
export const LOGIN_PATH_BY_ROLE: Record<AppRole, string> = {
  CUSTOMER: "/login",
  VENDOR: "/vendor/login",
  ADMIN: "/admin/login",
};

/** The vendor screen that explains a non-approved store's state. */
export const VENDOR_STATUS_PATH = "/vendor/status";

export function isPublicPath(pathname: string): boolean {
  return (PUBLIC_PATHS as readonly string[]).includes(pathname);
}

export function isAuthEntryPath(pathname: string): boolean {
  return (AUTH_ENTRY_PATHS as readonly string[]).includes(pathname);
}

export function areaForPath(pathname: string) {
  return PROTECTED_AREAS.find(
    (area) => pathname === area.prefix || pathname.startsWith(`${area.prefix}/`),
  );
}

/**
 * The single source of truth for post-login routing.
 *
 * A vendor only reaches the operational dashboard when the store is APPROVED;
 * every other status lands on the status screen instead.
 */
export function landingPathFor(
  role: AppRole,
  vendorStatus?: AppVendorStatus | null,
): string {
  switch (role) {
    case "ADMIN":
      return "/admin/dashboard";
    case "VENDOR":
      return vendorStatus === "APPROVED"
        ? "/vendor/dashboard"
        : VENDOR_STATUS_PATH;
    case "CUSTOMER":
    default:
      return "/dashboard";
  }
}
