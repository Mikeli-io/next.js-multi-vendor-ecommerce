import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { NotAvailable } from "@/components/catalog/list-parts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SectionCard } from "@/components/dashboard/section-card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftIcon, BoxIcon, FileIcon, ReceiptIcon, ShopFrontIcon, UserIcon } from "@/components/ui/icons";
import { ImageThumb } from "@/components/ui/image-thumb";
import { NotProvided, OwnerPhone, VENDOR_MANAGE_CRUMB, VendorStatusBadge } from "@/components/vendors/vendor-parts";
import { VendorStatusActions } from "@/components/vendors/vendor-status-actions";
import { requireAdmin } from "@/lib/auth/guards";
import { formatDate } from "@/lib/format";
import { param } from "@/lib/validation/catalog";
import { vendorIdSchema } from "@/lib/validation/vendor";
import { getVendor } from "@/lib/vendors/queries";

export const metadata: Metadata = { title: "Vendor · Covet admin" };

const NO_PRODUCTS = "Products aren't in the catalog yet";

/** Label / value pairs in the detail cards. */
function Details({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-[11px] font-semibold uppercase leading-none tracking-[0.06em] text-muted-soft">{label}</dt>
          <dd className="mt-2 break-words text-[14px] font-semibold leading-[1.35] text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A date-only value (stored at UTC midnight), shown without timezone drift. */
function formatDay(date: Date): string {
  return formatDate(`${date.toISOString().slice(0, 10)}T12:00:00`);
}

/**
 * The admin's review point for a store: its summary, owner and store
 * details, business TIN, and the status actions its current status allows.
 * Profile and TIN fields are optional (self-registration collects none), so
 * each falls back to "Not provided".
 */
export default async function VendorDetailPage({ params, searchParams }: PageProps<"/admin/vendors/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!vendorIdSchema.safeParse(id).success) notFound();
  const vendor = await getVendor(id);
  if (!vendor) notFound();

  // Opened from the review queue → lead back there.
  const fromApproval = param((await searchParams).from) === "approval";
  const back = fromApproval
    ? { label: "Vendor Approval", href: "/admin/vendor-approval" }
    : { label: "Vendor List", href: "/admin/vendors" };

  return (
    <DashboardShell
      role="admin"
      breadcrumb={[VENDOR_MANAGE_CRUMB, back, { label: vendor.storeName }]}
      user={{ name: admin.name, subtitle: "Master Admin" }}
    >
      <Link href={back.href} className="flex w-fit items-center gap-2 text-[13px] font-semibold text-muted hover:text-ink">
        <ArrowLeftIcon size={16} />
        {back.label}
      </Link>

      <section className="overflow-hidden rounded-xl border border-line-soft bg-surface shadow-xs">
        {vendor.coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- local upload; see ImageThumb for why it is unoptimized
          <img src={vendor.coverImage} alt={`${vendor.storeName} cover`} className="aspect-[4/1] max-h-[220px] w-full object-cover" />
        ) : null}
        <div className="p-5 sm:p-[24px_26px]">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="flex min-w-0 items-center gap-4">
              {vendor.logo ? (
                <ImageThumb src={vendor.logo} name={vendor.storeName} size={64} />
              ) : (
                <span
                  aria-hidden="true"
                  className="grid size-16 flex-none place-items-center rounded-lg bg-iris-50 font-display text-[26px] font-extrabold uppercase text-iris-500"
                >
                  {vendor.storeName.trim().charAt(0)}
                </span>
              )}
              <div className="min-w-0">
                <h1 className="break-words font-display text-[26px] font-extrabold leading-[1.1] tracking-[-0.01em] text-ink">
                  {vendor.storeName}
                </h1>
                <div className="mt-2 flex flex-wrap items-center gap-3 text-[13px] text-muted">
                  <VendorStatusBadge status={vendor.status} />
                  <span>Registered {formatDate(vendor.createdAt)}</span>
                </div>
              </div>
            </div>
            <VendorStatusActions id={vendor.id} storeName={vendor.storeName} status={vendor.status} />
          </div>

          {vendor.status === "PENDING" ? (
            <p className="mt-5 rounded-lg bg-warning-bg px-4 py-3 text-[13px] leading-normal text-warning">
              This store is waiting for review. Until it is approved, the vendor can sign in but can&apos;t use the
              seller dashboard.
            </p>
          ) : null}

          <div className="mt-6 rounded-lg bg-bg-subtle p-5">
            <Details
              rows={[
                ["Store name", vendor.storeName],
                ["Email", vendor.owner.email],
                ["Phone", <OwnerPhone key="p" phone={vendor.owner.phone} />],
                ["Registered", formatDate(vendor.createdAt)],
                ["Status", <VendorStatusBadge key="s" status={vendor.status} />],
              ]}
            />
          </div>
        </div>
      </section>

      <SectionCard title="Product statistics" icon={BoxIcon}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            ["Total Products", vendor.products.total],
            ["Active Products", vendor.products.active],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-lg border border-line-soft bg-bg-subtle p-[18px]">
              <p className="text-[12.5px] font-medium leading-[1.2] text-muted">{label}</p>
              <p className="mt-3 font-display text-[26px] font-extrabold leading-none text-ink">
                {value ?? <NotAvailable title={NO_PRODUCTS} />}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[12.5px] text-muted-soft">Active counts the products the vendor has switched on, whatever their approval status.</p>
      </SectionCard>

      <div className="grid grid-cols-1 gap-[22px] lg:grid-cols-2">
        <SectionCard title="Owner Information" icon={UserIcon} size="md">
          {vendor.image ? (
            <div className="mb-5">
              <ImageThumb src={vendor.image} name={vendor.owner.name} size={72} />
            </div>
          ) : null}
          <Details
            rows={[
              ["Name", vendor.owner.name],
              ["Email", vendor.owner.email],
              ["Phone", <OwnerPhone key="p" phone={vendor.owner.phone} />],
              ["Account created", formatDate(vendor.owner.createdAt)],
              ["Account type", "Vendor"],
            ]}
          />
        </SectionCard>
        <SectionCard title="Store Information" icon={ShopFrontIcon} size="md">
          <Details
            rows={[
              ["Store name", vendor.storeName],
              ["Store URL", <span key="slug" className="font-mono text-[13px]">/store/{vendor.slug}</span>],
              ["Shop address", vendor.address ?? <NotProvided key="a" />],
              ["Registered", formatDate(vendor.createdAt)],
              ["Last updated", formatDate(vendor.updatedAt)],
            ]}
          />
        </SectionCard>
      </div>

      <SectionCard title="Business TIN" icon={ReceiptIcon} size="md">
        <Details
          rows={[
            ["TIN", vendor.tinNumber ?? <NotProvided key="t" />],
            [
              "Expire date",
              vendor.tinExpireDate ? (
                <span key="e" className="flex flex-wrap items-center gap-2">
                  {formatDay(vendor.tinExpireDate)}
                  {vendor.tinExpireDate.toISOString().slice(0, 10) < new Date().toISOString().slice(0, 10) ? (
                    <Badge tone="error">Expired</Badge>
                  ) : null}
                </span>
              ) : (
                <NotProvided key="e" />
              ),
            ],
            [
              "Certificate",
              vendor.hasTinCertificate ? (
                <a
                  key="c"
                  href={`/admin/vendors/${vendor.id}/tin-certificate`}
                  target="_blank"
                  rel="noopener"
                  className="inline-flex items-center gap-2 text-iris-500 hover:text-iris-600"
                >
                  <FileIcon size={16} />
                  View certificate
                </a>
              ) : (
                <NotProvided key="c" />
              ),
            ],
          ]}
        />
      </SectionCard>
    </DashboardShell>
  );
}
