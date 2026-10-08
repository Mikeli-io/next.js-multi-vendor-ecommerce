import Link from "next/link";
import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { ImagePlaceholder } from "@/components/ui/image-placeholder";
import { LogoLockup } from "@/components/ui/logo";
import { signInWithCredentials } from "@/lib/actions/login";

export const metadata: Metadata = { title: "Vendor login · Covet" };

/**
 * Seller sign-in, from `designs/.../VendorLogin.dc.html`.
 *
 * Two blocks of the mockup are deliberately absent: the demo-credentials card
 * (it hardcodes a working email and password on a public page) and the
 * "Forgot Password" / "Remember Me" controls, which have no Phase 1 flow.
 */
export default function VendorLoginPage() {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <div className="relative flex flex-1 flex-col justify-center overflow-hidden bg-bg-dash px-[7%] py-16">
        <div className="mb-[60px]">
          <LogoLockup href="/" />
        </div>

        <h1 className="m-0 max-w-[560px] font-display text-[38px] font-extrabold leading-[1.05] tracking-[-0.02em] text-ink lg:text-[56px]">
          Make Your Business <span className="text-iris-500">Profitable...</span>
        </h1>

        <p className="mb-10 mt-[26px] max-w-[440px] text-[16px] leading-[1.6] text-muted">
          Reach thousands of shoppers across the Covet marketplace. Set up your
          store, list products, and grow — all from one seller dashboard.
        </p>

        <ImagePlaceholder
          label="seller lifestyle image"
          className="max-w-[520px]"
        />
      </div>

      <div className="flex flex-1 items-center justify-center px-[7%] py-12">
        <div className="w-full max-w-[440px]">
          <h2 className="m-0 font-display text-[30px] font-extrabold leading-none tracking-[-0.01em] text-ink">
            Sign in
          </h2>
          <div className="mb-9 mt-4 text-[15px] font-semibold leading-none text-ink">
            Welcome back to Vendor Login
          </div>

          <LoginForm
            action={signInWithCredentials}
            emailLabel="Your Email"
            emailPlaceholder="email@address.com"
            passwordPlaceholder="8+ characters required"
          />

          <p className="mt-6 text-[13px] leading-none text-muted">
            Don&apos;t have a store yet?{" "}
            <Link href="/vendor/register" className="font-semibold">
              Register New Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
