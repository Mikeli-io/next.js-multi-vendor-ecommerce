import type { Metadata } from "next";

import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/ui/logo";
import { LockIcon, ShieldIcon, UsersIcon } from "@/components/ui/icons";
import { signInAsAdmin } from "@/lib/actions/login";

export const metadata: Metadata = { title: "Admin login · Covet" };

/**
 * There is no design file for this screen — the `login.dc.html` in the admin
 * folder is byte-identical to the customer one — so it is composed from the
 * same system in the darker operations tone, reusing the shared login form.
 *
 * There is no admin registration page anywhere in the app: ADMIN rows come
 * only from `prisma/seed.mts`.
 */

const NOTES = [
  { Icon: UsersIcon, label: "Vendor, customer and catalog oversight" },
  { Icon: ShieldIcon, label: "Access restricted to platform operators" },
] as const;

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <div className="relative flex flex-1 flex-col justify-between overflow-hidden bg-[linear-gradient(140deg,var(--ink)_0%,var(--iris-900)_70%,var(--iris-800)_100%)] px-[7%] py-16">
        <div className="pointer-events-none absolute -right-16 -top-20 size-[300px] rounded-full bg-white/[0.05]" />

        <div className="relative">
          <Logo href="/" tone="light" size={28} />
          <p className="mt-[18px] max-w-[320px] text-[14px] leading-[1.5] text-white/70">
            Platform operations for the Covet marketplace.
          </p>
        </div>

        <div className="relative">
          <h1 className="m-0 max-w-[460px] font-display text-[38px] font-extrabold leading-[1.05] tracking-[-0.02em] text-surface lg:text-[46px]">
            Covet admin.
          </h1>
          <ul className="mt-8 flex flex-col gap-4">
            {NOTES.map(({ Icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-surface">
                <span className="grid size-[38px] flex-none place-items-center rounded-[11px] bg-white/[0.14]">
                  <Icon size={19} />
                </span>
                <span className="text-[13.5px] font-medium leading-[1.4]">
                  {label}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-[12px] leading-none text-white/50">
          Unauthorized access is monitored.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-bg px-[7%] py-12">
        <div className="w-full max-w-[440px]">
          <span className="mb-6 grid size-12 place-items-center rounded-[14px] bg-iris-50 text-iris-500">
            <LockIcon />
          </span>

          <h2 className="m-0 font-display text-[30px] font-extrabold leading-none tracking-[-0.01em] text-ink">
            Admin sign in
          </h2>
          <p className="mb-9 mt-4 text-[14px] leading-[1.5] text-muted">
            This area is restricted to Covet platform operators.
          </p>

          <LoginForm
            action={signInAsAdmin}
            emailPlaceholder="admin@covet.com"
            submitLabel="Sign in to admin"
          />

          <p className="mt-7 border-t border-line-soft pt-5 text-[12.5px] leading-[1.5] text-muted">
            Admin accounts are provisioned by the Covet team. There is no public
            registration for this area.
          </p>
        </div>
      </div>
    </div>
  );
}
