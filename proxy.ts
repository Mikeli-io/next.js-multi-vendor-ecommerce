import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/auth.config";
import {
  UNAUTHORIZED_PATH,
  areaForPath,
  isAuthEntryPath,
  isPublicPath,
  landingPathFor,
} from "@/lib/auth/routes";

/**
 * Next.js 16 renamed `middleware` to `proxy`. This runs before every matched
 * request and is an **optimistic UX gate only** — it reads the session cookie
 * and nothing else, never the database.
 *
 * It is not the security boundary. Every protected page and Server Action
 * calls a guard from `lib/auth/guards.ts`, which re-reads the user server-side.
 * If this file were deleted entirely, nothing would become accessible; users
 * would just see a redirect a moment later instead of a moment sooner.
 *
 * No redirect target below comes from the request, so no open redirect exists.
 */
const { auth } = NextAuth(authConfig);

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;
  const role = session?.user?.role;

  // Public paths short-circuit before any area check. They must: `/vendor/login`
  // and `/admin/login` sit *inside* protected prefixes, and falling through
  // would redirect each sign-in page to itself forever.
  if (isPublicPath(pathname)) {
    // Signed-in users have no reason to see a sign-in or registration form.
    // `/unauthorized` is excluded: a signed-in user is precisely who lands
    // there, and bouncing them would swallow the role-mismatch redirect.
    if (role && isAuthEntryPath(pathname)) {
      // The store's status is not in the token, so vendors go to the status
      // screen; the guard there forwards approved vendors to the dashboard.
      return NextResponse.redirect(new URL(landingPathFor(role), req.nextUrl));
    }
    return NextResponse.next();
  }

  const area = areaForPath(pathname);
  if (!area) return NextResponse.next();

  if (!role) {
    return NextResponse.redirect(new URL(area.loginPath, req.nextUrl));
  }

  if (role !== area.role) {
    return NextResponse.redirect(new URL(UNAUTHORIZED_PATH, req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  // Everything except Auth.js's own endpoints, build output and static files.
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
