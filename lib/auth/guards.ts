import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { Role, VendorStatus } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { AppRole, AppVendorStatus } from "./roles";
import {
  LOGIN_PATH_BY_ROLE,
  UNAUTHORIZED_PATH,
  VENDOR_STATUS_PATH,
} from "./routes";

/**
 * The server-side authorization layer. Everything that touches protected data
 * — pages, Server Actions, Route Handlers — goes through here. `proxy.ts` is a
 * UX gate only; these functions are the boundary that actually holds.
 */

// Fail to compile if the Prisma enums and the bundler-safe literals ever drift.
export const ROLES = {
  CUSTOMER: "CUSTOMER",
  VENDOR: "VENDOR",
  ADMIN: "ADMIN",
} satisfies Record<AppRole, Role>;

export const VENDOR_STATUSES = {
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  SUSPENDED: "SUSPENDED",
} satisfies Record<AppVendorStatus, VendorStatus>;

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  vendor: { id: string; storeName: string; slug: string; status: AppVendorStatus } | null;
};

/**
 * The authenticated user, re-read from the database rather than trusted from
 * the token. Costs one query per request (memoized across a render pass) and in
 * exchange a deleted user, a changed role or a suspended store is honoured
 * immediately instead of when the JWT happens to expire.
 *
 * Returns `null` for guests and for sessions that no longer resolve to a user;
 * an invalid or expired cookie makes `auth()` return `null`, not throw, so this
 * never turns a stale session into a server error.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      vendor: {
        select: { id: true, storeName: true, slug: true, status: true },
      },
    },
  });

  return user;
});

/** Any authenticated user, or redirect to the sign-in page for `fallbackRole`. */
export async function requireUser(
  fallbackRole: AppRole = "CUSTOMER",
): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(LOGIN_PATH_BY_ROLE[fallbackRole]);
  return user;
}

/**
 * An authenticated user holding exactly `role`.
 *
 * Guests go to that role's sign-in page. A signed-in user with the wrong role
 * goes to `/unauthorized` — they are authenticated, just not permitted, and
 * bouncing them to a login form would be misleading.
 */
export async function requireRole(role: AppRole): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(LOGIN_PATH_BY_ROLE[role]);
  if (user.role !== role) redirect(UNAUTHORIZED_PATH);
  return user;
}

export type VendorUser = CurrentUser & {
  vendor: NonNullable<CurrentUser["vendor"]>;
};

/** A VENDOR user together with their store, whatever its approval status. */
export async function requireVendor(): Promise<VendorUser> {
  const user = await requireRole("VENDOR");
  if (!user.vendor) {
    // A VENDOR without a store row means the two were not created together.
    // Registration is transactional, so this should be unreachable.
    redirect(UNAUTHORIZED_PATH);
  }
  return user as VendorUser;
}

/**
 * A VENDOR whose store is APPROVED. Anything else is sent to the status screen,
 * so a pending, rejected or suspended store can never render the operational
 * vendor dashboard.
 */
export async function requireApprovedVendor(): Promise<VendorUser> {
  const user = await requireVendor();
  if (user.vendor.status !== "APPROVED") redirect(VENDOR_STATUS_PATH);
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  return requireRole("ADMIN");
}
