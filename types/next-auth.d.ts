import type { DefaultSession } from "next-auth";
import type { AppRole } from "@/lib/auth/roles";

/**
 * The session payload is deliberately small: identity plus what routing needs.
 * No password hash, no store approval status (that is read fresh from the
 * database by the guards, so an admin's approve/suspend takes effect at once).
 */
declare module "next-auth" {
  interface User {
    role: AppRole;
    vendorId: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: AppRole;
      vendorId: string | null;
    } & DefaultSession["user"];
  }
}

/**
 * Augment `@auth/core/jwt`, not `next-auth/jwt`: the latter only re-exports
 * with `export *`, so declarations merged onto it never reach the `JWT`
 * interface the callbacks are actually typed against.
 */
declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: AppRole;
    vendorId: string | null;
  }
}

export {};
