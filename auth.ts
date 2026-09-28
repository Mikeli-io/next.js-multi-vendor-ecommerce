import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { authConfig } from "@/auth.config";
import { fakeVerifyPassword, verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validation/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      /**
       * Returning `null` makes Auth.js throw `CredentialsSignin`, which the
       * sign-in actions surface as one generic message. Unknown email and wrong
       * password are indistinguishable to the caller, by design.
       */
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            passwordHash: true,
            role: true,
            vendor: { select: { id: true } },
          },
        });

        if (!user) {
          // Spend the same time as a real comparison before failing.
          await fakeVerifyPassword(password);
          return null;
        }

        const passwordMatches = await verifyPassword(password, user.passwordHash);
        if (!passwordMatches) return null;

        // Only these fields reach the JWT. `passwordHash` never leaves here.
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          vendorId: user.vendor?.id ?? null,
        };
      },
    }),
  ],
});
