import Link from "next/link";
import type { Metadata } from "next";

import {
  AuthCardHeading,
  StorefrontAuthShell,
} from "@/components/auth/storefront-auth-shell";
import { CustomerRegisterForm } from "@/components/auth/customer-register-form";

export const metadata: Metadata = { title: "Create your account · Covet" };

/**
 * Customer registration, from `designs/.../register.dc.html`.
 *
 * The mockup's "or sign up with Google / Facebook" block is not rendered:
 * Phase 1 is email and password only, with no OAuth.
 */
export default function CustomerRegisterPage() {
  return (
    <StorefrontAuthShell>
      <AuthCardHeading
        title="Create your account"
        subtitle="Join Covet to shop across thousands of sellers."
      />

      <CustomerRegisterForm />

      <p className="mt-7 text-center text-[13.5px] leading-none text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold">
          Sign in
        </Link>
      </p>
    </StorefrontAuthShell>
  );
}
