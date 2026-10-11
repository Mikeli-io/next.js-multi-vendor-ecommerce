import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { MerchandisingBadges, PRODUCT_MANAGE_CRUMB } from "@/components/admin-products/admin-product-parts";
import { MerchandisingSwitch, ProductReviewActions } from "@/components/admin-products/product-review-actions";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ActiveBadge, ApprovalBadge, ProductThumb, money } from "@/components/products/product-parts";
import { ArrowLeftIcon, StarIcon } from "@/components/ui/icons";
import { requireAdmin } from "@/lib/auth/guards";
import { formatDate } from "@/lib/format";
import { getAdminProduct } from "@/lib/products/admin-queries";
import { productIdSchema } from "@/lib/validation/product";

export const metadata: Metadata = { title: "Product Details · Covet admin" };

const CARD = "rounded-[18px] border border-line-soft bg-surface shadow-xs";
const none = <span className="font-normal text-muted-soft">—</span>;

/** "Seller : Pets Store" rows, as in the design. */
function InfoRows({ rows }: { rows: Array<[string, ReactNode]> }) {
  return (
    <dl>
      {rows.map(([label, value]) => (
        <div key={label} className="grid grid-cols-[120px_12px_1fr] gap-[6px] py-[7px] text-[13.5px]">
          <dt className="text-muted">{label}</dt>
          <span aria-hidden="true" className="text-muted-soft">:</span>
          <dd className="min-w-0 break-words font-semibold text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

function CardHeader({ children }: { children: ReactNode }) {
  return <h2 className="bg-field px-[22px] py-4 font-display text-[14px] font-bold text-ink">{children}</h2>;
}

/**
 * Admin Product Details, after AdminProductDetails.dc.html, on the real
 * Product schema. Left out of the design (no such data): language tabs,
 * Product Type / Unit, Product Video, Visit Shop (no storefront yet) and
 * Delete (not part of moderation). Reviews keep the design's table frame
 * with its empty state — there is no review system yet.
 */
export default async function AdminProductDetailsPage({ params }: PageProps<"/admin/products/[id]">) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!productIdSchema.safeParse(id).success) notFound();
  const product = await getAdminProduct(id);
  if (!product) notFound();

  const listView = product.approvalStatus.toLowerCase();
  const discount = product.discount
    ? product.discountType === "PERCENTAGE"
      ? `${Number(product.discount)}%`
      : money(product.discount)
    : null;
  const images = [...(product.thumbnail ? [product.thumbnail] : []), ...product.gallery];
  const approved = product.approvalStatus === "APPROVED";

  return (
    <DashboardShell
      role="admin"
      breadcrumb={[PRODUCT_MANAGE_CRUMB, { label: `${listView[0].toUpperCase()}${listView.slice(1)} Products`, href: `/admin/products/${listView}` }, { label: product.name }]}
      user={{ name: admin.name, subtitle: "Master Admin" }}
    >
      <Link href={`/admin/products/${listView}`} className="flex w-fit items-center gap-2 text-[13px] font-semibold text-muted hover:text-ink">
        <ArrowLeftIcon size={16} />
        Back to list
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-[24px] font-extrabold leading-none tracking-[-0.01em] text-ink">Product Details</h1>
          <p className="mt-[10px] text-[12.5px] text-muted-soft">
            Created At {formatDate(product.createdAt)} · Updated {formatDate(product.updatedAt)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <ApprovalBadge status={product.approvalStatus} />
            <ActiveBadge active={product.isActive} />
            {product.isFeatured || product.isPopular ? <MerchandisingBadges featured={product.isFeatured} popular={product.isPopular} /> : null}
          </div>
        </div>
        <ProductReviewActions id={product.id} name={product.name} status={product.approvalStatus} merchandised={product.isFeatured || product.isPopular} />
      </div>

      <section className={`${CARD} p-5 sm:p-[26px_28px]`}>
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
          <div className="min-w-0">
            <div className="relative mb-[14px] aspect-square overflow-hidden rounded-2xl border border-line-soft bg-bg-subtle">
              {images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element -- local upload
                <img src={images[0]} alt={product.name} className="size-full object-cover" />
              ) : (
                <span className="absolute inset-0 grid place-items-center text-[12px] text-muted-soft">No image</span>
              )}
            </div>
            {images.length > 1 ? (
              <ul aria-label="More images" className="mb-5 flex flex-wrap gap-[10px]">
                {images.slice(1).map((src, i) => (
                  <li key={src} className="size-[60px] overflow-hidden rounded-[10px] border border-line">
                    {/* eslint-disable-next-line @next/next/no-img-element -- local upload */}
                    <img src={src} alt={`${product.name} image ${i + 2}`} className="size-full object-cover" />
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mb-4 rounded-2xl border border-line-soft p-5 text-center">
              <p className="font-display text-[15px] font-bold text-ink">{product.vendor.storeName}</p>
              <p className="mt-2 text-[12px] text-muted">
                {product.vendor.productCount} product{product.vendor.productCount === 1 ? "" : "s"}
              </p>
              <Link
                href={`/admin/vendors/${product.vendor.id}`}
                className="mt-[14px] inline-flex h-[42px] items-center justify-center rounded-[11px] bg-iris-500 px-[26px] font-display text-[13px] font-bold text-surface transition-colors hover:bg-iris-600 hover:text-surface"
              >
                View vendor
              </Link>
            </div>
            <div className="flex gap-6 rounded-2xl border border-line-soft p-5" title="Orders aren't tracked yet">
              <div>
                <p className="font-display text-[22px] font-extrabold text-ink">—</p>
                <p className="mt-2 text-[11px] text-muted">Total Order</p>
              </div>
              <div className="w-px bg-line-soft" />
              <div>
                <p className="font-display text-[22px] font-extrabold text-ink">—</p>
                <p className="mt-2 text-[11px] text-muted">Total Order Amount</p>
              </div>
            </div>
          </div>

          <div className="min-w-0">
            <div className="mb-5 flex flex-wrap items-center justify-end gap-4 border-b border-line-soft pb-3 text-[13px]">
              <span className="flex items-center gap-[5px] font-display font-bold text-muted-soft" title="Reviews aren't available yet">
                <StarIcon size={15} />—
              </span>
              <span className="text-muted">Reviews not available yet</span>
            </div>
            <h2 className="mb-4 break-words font-display text-[24px] font-bold leading-[1.2] tracking-[-0.01em] text-ink">{product.name}</h2>
            {product.shortDescription ? <p className="mb-3 text-[14px] font-semibold text-ink">{product.shortDescription}</p> : null}
            <p className="mb-5 whitespace-pre-line break-words text-[13.5px] leading-[1.6] text-ink-soft">
              <span className="font-bold text-ink">Description:</span> {product.description}
            </p>
            <div className="grid grid-cols-1 gap-x-10 border-t border-line-soft pt-4 md:grid-cols-2">
              <InfoRows
                rows={[
                  ["Seller", product.vendor.storeName],
                  ["Brand", product.brand?.name ?? none],
                  ["Category", product.category.name],
                  ["Sub Category", product.subCategory?.name ?? none],
                  ["Sub Sub Cat.", product.subSubCategory?.name ?? none],
                  ["Product SKU", product.sku ?? none],
                ]}
              />
              <InfoRows
                rows={[
                  ["Unit Price", money(product.price)],
                  ["Compare At", product.compareAtPrice ? money(product.compareAtPrice) : none],
                  ["Discount", discount ?? none],
                  ["Tax Rate", product.taxRate ? `${Number(product.taxRate)}%` : none],
                  ["Current Stock", product.variations.length ? `${product.stock} (${product.variations.length} variations)` : String(product.stock)],
                  ["Slug", <span key="slug" className="font-mono text-[12.5px]">{product.slug}</span>],
                ]}
              />
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-[22px] lg:grid-cols-2">
        <section className={`${CARD} overflow-hidden`}>
          <CardHeader>Product SEO &amp; meta data</CardHeader>
          <div className="px-6 py-[22px]">
            <p className="mb-3 font-display text-[14px] font-bold text-ink">{product.metaTitle ?? <span className="font-normal text-muted-soft">No meta title</span>}</p>
            <p className="text-[13px] leading-[1.55] text-muted">{product.metaDescription ? `Description: ${product.metaDescription}` : "No meta description."}</p>
          </div>
        </section>
        <section className={`${CARD} overflow-hidden`}>
          <CardHeader>Merchandising</CardHeader>
          <div className="flex flex-col gap-3 px-6 py-[22px]">
            <MerchandisingSwitch
              id={product.id}
              flag="featured"
              label="Featured Product"
              description="Highlight it in featured placements."
              value={product.isFeatured}
              approved={approved}
            />
            <MerchandisingSwitch
              id={product.id}
              flag="popular"
              label="Popular Product"
              description="Show it among popular products."
              value={product.isPopular}
              approved={approved}
            />
          </div>
        </section>
      </div>

      {product.variations.length ? (
        <section className={`${CARD} overflow-hidden`}>
          <CardHeader>Variations ({product.variations.length})</CardHeader>
          <div className="overflow-x-auto p-5">
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
                    <td className="px-4 py-3 text-muted">{Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`).join(", ")}</td>
                    <td className="px-4 py-3 font-display font-bold text-ink">{money(v.price)}</td>
                    <td className={`px-4 py-3 ${v.stock === 0 ? "text-error" : "text-ink-soft"}`}>{v.stock}</td>
                    <td className="px-4 py-3 text-muted">{v.sku ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className={`${CARD} p-5 sm:p-[22px_24px]`} aria-label="Reviews">
        <div className="overflow-x-auto rounded-[14px] border border-line-soft">
          <div className="grid min-w-[820px] grid-cols-[50px_90px_1.2fr_90px_1.4fr_100px_110px_90px_90px] gap-3 bg-field px-[18px] py-[14px] text-[11px] font-semibold uppercase tracking-[0.04em] text-muted">
            {["SL", "Review ID", "Reviewer", "Rating", "Review", "Reply", "Date", "Status", "Action"].map((h, i, all) => (
              <span key={h} className={i === all.length - 1 ? "text-right" : undefined}>{h}</span>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center px-8 py-14 text-center">
          <span className="mb-4 grid size-16 place-items-center rounded-[18px] bg-field text-muted-soft">
            <StarIcon size={26} />
          </span>
          <p className="text-[14px] font-medium text-muted-soft">No review found</p>
          <p className="mt-1 text-[12.5px] text-muted-soft">Product reviews aren&apos;t available yet.</p>
        </div>
      </section>
    </DashboardShell>
  );
}
