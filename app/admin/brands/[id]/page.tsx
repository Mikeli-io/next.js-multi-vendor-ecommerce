import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import {
  BrandStatusToggle,
  DeleteBrandButton,
  EditBrandButton,
} from "@/components/brands/brand-actions";
import { BRAND_BREADCRUMB } from "@/components/brands/brand-list-parts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SectionCard } from "@/components/dashboard/section-card";
import { ArrowLeftIcon, BoxIcon } from "@/components/ui/icons";
import { ImageThumb } from "@/components/ui/image-thumb";
import { requireAdmin } from "@/lib/auth/guards";
import { getBrand } from "@/lib/brands/queries";
import { formatDate } from "@/lib/format";
import { brandIdSchema } from "@/lib/validation/brand";

export const metadata: Metadata = { title: "Brand · Covet admin" };

/** Read-only brand details, with Edit and Delete for the admin. */
export default async function BrandDetailsPage({ params }: PageProps<"/admin/brands/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;

  // A malformed id can never match; skip the query and 404 straight away.
  if (!brandIdSchema.safeParse(id).success) notFound();
  const brand = await getBrand(id);
  if (!brand) notFound();

  const details: Array<[string, ReactNode]> = [
    ["Slug", <span key="slug" className="font-mono text-[13px]">{brand.slug}</span>],
    ["Created", formatDate(brand.createdAt)],
    [
      "Products",
      brand.productCount ?? <span key="p" className="text-muted-soft">— not in catalog yet</span>,
    ],
  ];

  return (
    <DashboardShell
      role="admin"
      breadcrumb={[...BRAND_BREADCRUMB, { label: "Brands", href: "/admin/brands" }, { label: brand.name }]}
      user={{ name: admin.name, subtitle: "Master Admin" }}
    >
      <Link
        href="/admin/brands"
        className="flex w-fit items-center gap-2 text-[13px] font-semibold text-muted hover:text-ink"
      >
        <ArrowLeftIcon size={16} />
        All brands
      </Link>

      <section className="rounded-xl border border-line-soft bg-surface p-5 shadow-xs sm:p-[24px_26px]">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <ImageThumb src={brand.image} name={brand.name} size={120} className="rounded-lg" />

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="break-words font-display text-[26px] font-extrabold leading-[1.1] tracking-[-0.01em] text-ink">
                  {brand.name}
                </h1>
                <div className="mt-3">
                  <BrandStatusToggle id={brand.id} name={brand.name} status={brand.status} />
                </div>
              </div>
              <div className="flex gap-3">
                <EditBrandButton
                  variant="button"
                  brand={{ id: brand.id, name: brand.name, image: brand.image, status: brand.status }}
                />
                <DeleteBrandButton variant="button" id={brand.id} name={brand.name} redirectTo="/admin/brands" />
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-1 gap-4 rounded-lg bg-bg-subtle p-5 sm:grid-cols-3">
              {details.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[11px] font-semibold uppercase leading-none tracking-[0.06em] text-muted-soft">
                    {label}
                  </dt>
                  <dd className="mt-2 text-[14px] font-semibold leading-[1.3] text-ink">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <SectionCard title="Products" icon={BoxIcon}>
        {/* No Product model exists yet, so there is nothing to list. Once the
            Product → Brand relation exists, list this brand's products here
            with the shared product-list pattern. */}
        <EmptyState
          icon={BoxIcon}
          title="No products yet"
          body="Products assigned to this brand will be listed here once the product catalog is built."
        />
      </SectionCard>
    </DashboardShell>
  );
}
