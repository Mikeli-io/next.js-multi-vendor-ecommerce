import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { SectionCard } from "@/components/dashboard/section-card";
import { DeleteProductButton, ProductActiveSwitch } from "@/components/products/product-actions";
import { ActiveBadge, ApprovalBadge, PRODUCTS_CRUMB, ProductThumb, money } from "@/components/products/product-parts";
import { ArrowLeftIcon, BoxIcon, DollarIcon, EditIcon, GridIcon, ImageIcon, SearchIcon } from "@/components/ui/icons";
import { requireApprovedVendor } from "@/lib/auth/guards";
import { formatDate, maskEmail } from "@/lib/format";
import { getOwnProduct } from "@/lib/products/queries";

export const metadata: Metadata = { title: "Product · Covet" };

const none = <span className="font-normal text-muted-soft">—</span>;

/** Label / value pairs, as on the other detail pages. */
function Details({ rows, columns = 2 }: { rows: Array<[string, ReactNode]>; columns?: 1 | 2 }) {
  return (
    <dl className={`grid grid-cols-1 gap-x-6 gap-y-4 ${columns === 2 ? "sm:grid-cols-2" : ""}`}>
      {rows.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-[11px] font-semibold uppercase leading-none tracking-[0.06em] text-muted-soft">{label}</dt>
          <dd className="mt-2 break-words text-[14px] font-semibold leading-[1.35] text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * A vendor's read-only view of their own product. There is no design for this
 * page; it follows the dashboard's detail-page patterns. Another vendor's
 * product id is a 404 (see the segment layout), never a "forbidden".
 */
export default async function ProductViewPage({ params }: PageProps<"/vendor/products/[id]">) {
  const user = await requireApprovedVendor();
  const { id } = await params;
  const product = await getOwnProduct(id);
  if (!product) notFound();

  const discount = product.discount
    ? product.discountType === "PERCENTAGE"
      ? `${Number(product.discount)}%`
      : money(product.discount)
    : null;

  return (
    <DashboardShell
      role="vendor"
      breadcrumb={[PRODUCTS_CRUMB, { label: product.name }]}
      user={{ name: user.name, subtitle: maskEmail(user.email) }}
    >
      <Link href="/vendor/products" className="flex w-fit items-center gap-2 text-[13px] font-semibold text-muted hover:text-ink">
        <ArrowLeftIcon size={16} />
        Product List
      </Link>

      <section className="rounded-xl border border-line-soft bg-surface p-5 shadow-xs sm:p-[24px_26px]">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex min-w-0 items-center gap-4">
            <ProductThumb src={product.thumbnail} name={product.name} size={72} />
            <div className="min-w-0">
              <h1 className="break-words font-display text-[24px] font-extrabold leading-[1.15] tracking-[-0.01em] text-ink">{product.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[13px] text-muted">
                <ApprovalBadge status={product.approvalStatus} />
                <ActiveBadge active={product.isActive} />
                {product.sku ? <span>SKU {product.sku}</span> : null}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 rounded-[12px] border border-line px-3 py-2 text-[13px] font-semibold text-ink-soft">
              <ProductActiveSwitch id={product.id} name={product.name} active={product.isActive} />
              Active
            </label>
            <Link
              href={`/vendor/products/${product.id}/edit`}
              className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-line bg-surface px-4 font-display text-[13px] font-bold text-ink-soft transition-colors hover:bg-field"
            >
              <EditIcon size={15} />
              Edit
            </Link>
            <DeleteProductButton id={product.id} name={product.name} variant="button" redirectTo="/vendor/products" />
          </div>
        </div>

        {product.approvalStatus === "PENDING" ? (
          <p className="mt-5 rounded-lg bg-warning-bg px-4 py-3 text-[13px] leading-normal text-warning">
            Waiting for review by the Covet team. Customers won&apos;t see this product until it&apos;s approved, even while it&apos;s active.
          </p>
        ) : product.approvalStatus === "REJECTED" ? (
          <p className="mt-5 rounded-lg bg-error-bg px-4 py-3 text-[13px] leading-normal text-error">
            This product wasn&apos;t approved, so customers can&apos;t see it.
          </p>
        ) : null}
      </section>

      <div className="grid grid-cols-1 gap-[22px] lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="flex min-w-0 flex-col gap-[22px]">
          <SectionCard title="Description" icon={BoxIcon} size="md">
            {product.shortDescription ? (
              <p className="mb-4 text-[14px] font-semibold leading-[1.5] text-ink">{product.shortDescription}</p>
            ) : null}
            <p className="whitespace-pre-line break-words text-[14px] leading-[1.6] text-ink-soft">{product.description}</p>
          </SectionCard>

          <SectionCard title="Images" icon={ImageIcon} size="md">
            {product.thumbnail || product.gallery.length ? (
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(110px,1fr))] gap-3">
                {[...(product.thumbnail ? [product.thumbnail] : []), ...product.gallery].map((src, index) => (
                  <li key={src} className="relative aspect-square overflow-hidden rounded-[12px] border border-line-soft bg-bg-subtle">
                    {/* eslint-disable-next-line @next/next/no-img-element -- local upload */}
                    <img src={src} alt={index === 0 && product.thumbnail ? "Thumbnail" : `Additional image ${index}`} className="size-full object-cover" />
                    {index === 0 && product.thumbnail ? (
                      <span className="absolute bottom-2 left-2 rounded-full bg-surface/90 px-2 py-[2px] text-[10.5px] font-semibold text-iris-600">Thumbnail</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[13px] text-muted-soft">No images yet.</p>
            )}
          </SectionCard>

          {product.variations.length ? (
            <SectionCard title={`Variations (${product.variations.length})`} icon={GridIcon} size="md">
              <div className="overflow-x-auto rounded-lg border border-line-soft">
                <table className="w-full min-w-[560px] text-left text-[13px]">
                  <thead className="bg-field text-[11px] font-semibold uppercase tracking-[0.04em] text-muted">
                    <tr>
                      {["Image", "Variation", "Attributes", "Price", "Stock", "SKU"].map((h) => (
                        <th key={h} className="px-4 py-3 font-semibold">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {product.variations.map((v) => (
                      <tr key={v.id} className="border-t border-line-soft">
                        <td className="px-4 py-3"><ProductThumb src={v.image} name={v.name} size={40} /></td>
                        <td className="px-4 py-3 font-semibold text-ink">{v.name}</td>
                        <td className="px-4 py-3 text-muted">
                          {Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(", ")}
                        </td>
                        <td className="px-4 py-3 font-display font-bold text-ink">{money(v.price)}</td>
                        <td className={`px-4 py-3 ${v.stock === 0 ? "text-error" : "text-ink-soft"}`}>{v.stock}</td>
                        <td className="px-4 py-3 text-muted">{v.sku ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-[22px]">
          <SectionCard title="Pricing & Stock" icon={DollarIcon} size="md">
            <Details
              rows={[
                ["Price", money(product.price)],
                ["Compare at price", product.compareAtPrice ? money(product.compareAtPrice) : none],
                ["Discount", discount ?? none],
                ["Discount type", product.discountType === "PERCENTAGE" ? "Percentage" : "Amount"],
                ["Tax rate", product.taxRate ? `${Number(product.taxRate)}%` : none],
                [
                  "Stock",
                  <span key="s">
                    {product.stock}
                    {product.variations.length ? (
                      <span className="block text-[12px] font-normal text-muted">Total of {product.variations.length} variations</span>
                    ) : null}
                  </span>,
                ],
              ]}
            />
          </SectionCard>

          <SectionCard title="Organization" icon={GridIcon} size="md">
            <Details
              rows={[
                ["Category", product.category.name],
                ["Sub category", product.subCategory?.name ?? none],
                ["Sub sub category", product.subSubCategory?.name ?? none],
                ["Brand", product.brand?.name ?? none],
                ["SKU", product.sku ?? none],
                ["Slug", <span key="slug" className="font-mono text-[12.5px]">{product.slug}</span>],
              ]}
            />
          </SectionCard>

          <SectionCard title="SEO" icon={SearchIcon} size="md">
            <Details
              columns={1}
              rows={[
                ["Meta title", product.metaTitle ?? none],
                ["Meta description", product.metaDescription ?? none],
              ]}
            />
          </SectionCard>

          <SectionCard title="Record" icon={BoxIcon} size="md">
            <Details
              rows={[
                ["Created", formatDate(product.createdAt)],
                ["Last updated", formatDate(product.updatedAt)],
              ]}
            />
          </SectionCard>
        </div>
      </div>
    </DashboardShell>
  );
}
