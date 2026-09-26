import type { NextAuthConfig } from "next-auth";

import { LOGIN_PATH_BY_ROLE, UNAUTHORIZED_PATH } from "@/lib/auth/routes";

/**
 * Configuration shared by the full auth instance (`auth.ts`) and by `proxy.ts`.
 *
 * `providers` is empty here on purpose: the Credentials provider needs Prisma
 * and bcrypt, and the proxy must not drag a database client into the request
 * path it runs on for *every* route. The proxy only decodes the session cookie.
 */
export const authConfig = {
  session: {
    // Credentials authentication requires JWT sessions; a database session
    // strategy is not supported for it by Auth.js.
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
  pages: {
    signIn: LOGIN_PATH_BY_ROLE.CUSTOMER,
    error: UNAUTHORIZED_PATH,
  },
  callbacks: {
    // Runs on sign-in (with `user`) and on every subsequent session read.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.vendorId = user.vendorId;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.vendorId = token.vendorId;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
