import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { SignOutButton } from "@/components/auth/sign-out-button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/ui/logo";
import { requireVendor } from "@/lib/auth/guards";
import type { AppVendorStatus } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Store status · Covet" };

const STATUS_COPY: Record<
  AppVendorStatus,
  {
    tone: "success" | "warning" | "error" | "info";
    label: string;
    title: string;
    body: string;
  }
> = {
  PENDING: {
    tone: "warning",
    label: "Pending review",
    title: "Your store is being reviewed",
    body: "Our team checks every new store before it appears on the marketplace. You will be able to open your seller dashboard as soon as the review is complete.",
  },
  REJECTED: {
    tone: "error",
    label: "Not approved",
    title: "Your store was not approved",
    body: "This store did not pass review, so the seller dashboard is unavailable. If you think this is a mistake, reply to the review email and our team will take another look.",
  },
  SUSPENDED: {
    tone: "error",
    label: "Suspended",
    title: "Your store is suspended",
    body: "Selling is paused on this store and the seller dashboard is unavailable while the suspension is in place. Contact the Covet team to resolve it.",
  },
  APPROVED: {
    tone: "success",
    label: "Approved",
    title: "Your store is approved",
    body: "Your store is live on Covet.",
  },
};

/**
 * The status screen for vendors whose store is not APPROVED. Approved vendors
 * never linger here — they are forwarded to the operational dashboard, which
 * is what makes it safe for the proxy to send any vendor to this route.
 */
export default async function VendorStatusPage() {
  const user = await requireVendor();
  const status = user.vendor.status;

  if (status === "APPROVED") redirect("/vendor/dashboard");

  const copy = STATUS_COPY[status];

  return (
    <div className="flex min-h-dvh flex-col bg-bg-dash">
      <header className="flex h-16 items-center justify-between border-b border-line bg-surface px-6 lg:px-10">
        <div className="flex items-center gap-4">
          <Logo href="/" />
          <span className="hidden text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-soft sm:inline">
            Seller
          </span>
        </div>
        <SignOutButton />
      </header>

      <main className="mx-auto flex w-full max-w-[640px] flex-1 items-center px-5 py-12 lg:px-10">
        <div className="flex w-full flex-col gap-6 rounded-2xl border border-line-soft bg-surface p-8 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-soft">
              Store status
            </p>
            <Badge tone={copy.tone}>{copy.label}</Badge>
          </div>

          <div className="flex flex-col gap-3">
            <h1 className="font-display text-[27px] font-bold tracking-[-0.01em] text-ink">
              {copy.title}
            </h1>
            <p className="text-[14px] leading-[1.5] text-muted">{copy.body}</p>
          </div>

          <dl className="flex flex-col gap-3 rounded-xl bg-bg-subtle p-5 text-[13.5px]">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Store</dt>
              <dd className="font-semibold text-ink">
                {user.vendor.storeName}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Store address</dt>
              <dd className="font-mono text-[12.5px] text-ink-soft">
                /store/{user.vendor.slug}
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Account</dt>
              <dd className="text-ink-soft">{user.email}</dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  );
}
