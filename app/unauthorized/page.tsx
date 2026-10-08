import Link from "next/link";
import type { Metadata } from "next";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { LockIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/logo";
import { getCurrentUser } from "@/lib/auth/guards";
import { landingPathFor } from "@/lib/auth/routes";

export const metadata: Metadata = { title: "Not available · Covet" };

const CTA =
  "inline-flex h-[52px] items-center justify-center rounded-[12px] bg-iris-500 px-6 font-display text-[14px] font-bold leading-none text-surface transition-colors duration-200 hover:bg-iris-600 hover:text-surface";

/**
 * Where a signed-in user lands after requesting an area another role owns.
 * Public by design: it must render for guests too, or a redirect here could
 * loop.
 */
export default async function UnauthorizedPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="flex h-[72px] items-center border-b border-line-soft bg-surface px-[var(--cpad)]">
        <Logo href="/" />
      </header>

      <main className="mx-auto flex w-full max-w-[560px] flex-1 items-center px-5 py-12">
        <div className="flex w-full flex-col items-center gap-6 rounded-2xl border border-line-soft bg-surface p-8 text-center shadow-xs">
          <span className="grid size-14 place-items-center rounded-full bg-error-bg text-error">
            <LockIcon />
          </span>

          <div className="flex flex-col gap-3">
            <h1 className="font-display text-[28px] font-extrabold leading-[1.1] tracking-[-0.01em] text-ink">
              You do not have access to this area
            </h1>
            <p className="text-[14px] leading-[1.5] text-muted">
              {user
                ? "Your account does not have permission to view that page. You can head back to your own area instead."
                : "Sign in with an account that has access to this area."}
            </p>
          </div>

          <div className="flex flex-col items-center gap-3">
            {user ? (
              <>
                <Link
                  href={landingPathFor(user.role, user.vendor?.status ?? null)}
                  className={CTA}
                >
                  Back to my dashboard
                </Link>
                <SignOutButton label="Sign in as someone else" />
              </>
            ) : (
              <Link href="/login" className={CTA}>
                Go to sign in
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
