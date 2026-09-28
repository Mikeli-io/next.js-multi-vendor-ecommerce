import Link from "next/link";
import type { Metadata } from "next";

import {
  AuthCardHeading,
  StorefrontAuthShell,
} from "@/components/auth/storefront-auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { signInWithCredentials } from "@/lib/actions/login";

export const metadata: Metadata = { title: "Sign in · Covet" };

/**
 * Customer sign-in, from `designs/.../login.dc.html`.
 *
 * The mockup's "or continue with Google / Facebook" block is not rendered:
 * Phase 1 is email and password only, with no OAuth.
 */
export default function CustomerLoginPage() {
  return (
    <StorefrontAuthShell>
      <AuthCardHeading
        title="Welcome back"
        subtitle="Sign in to your Covet account to continue."
      />

      <LoginForm action={signInWithCredentials} />

      <p className="mt-7 text-center text-[13.5px] leading-none text-muted">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-semibold">
          Create one
        </Link>
      </p>
    </StorefrontAuthShell>
  );
}
