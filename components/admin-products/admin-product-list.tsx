import Link from "next/link";

import { ListCard, ListHeading, NoMatches, Pagination, ROW_CLASS, ResultCount, SearchToolbar, TableFrame } from "@/components/catalog/list-parts";
import { RowActions, ViewAction } from "@/components/catalog/row-actions";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ActiveBadge, ApprovalBadge, ProductThumb, priceLabel } from "@/components/products/product-parts";
import { requireAdmin } from "@/lib/auth/guards";
import { getAdminProducts } from "@/lib/products/admin-queries";
import { adminProductListParamsSchema, type AdminProductView } from "@/lib/validation/admin-product";
import { param } from "@/lib/validation/catalog";
import { ADMIN_PRODUCT_ICON, ADMIN_PRODUCT_TABLE, MerchandisingBadges, PRODUCT_MANAGE_CRUMB, VIEW_META } from "./admin-product-parts";

/**
 * One Admin Product Management list — Pending, Approved, Rejected, Featured or
 * Popular — after AdminVendorProductList.dc.html. All five routes render this
 * with their `view`; the query decides which products it holds.
 *
 * Read-only here: approval and the Featured/Popular switches live on the
 * details page; the vendor's own Active switch is shown, never changed.
 */
export async function AdminProductList({
  view,
  searchParams,
}: {
  view: AdminProductView;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const admin = await requireAdmin();
  const params = adminProductListParamsSchema.parse({ q: param(searchParams.q), page: param(searchParams.page) });
  const { total, matching, page, pageCount, pageSize, products } = await getAdminProducts(view, params);
  const meta = VIEW_META[view];
  const path = `/admin/products/${view}`;

  return (
    <DashboardShell role="admin" breadcrumb={[PRODUCT_MANAGE_CRUMB, { label: meta.title }]} user={{ name: admin.name, subtitle: "Master Admin" }}>
      <ListHeading title={meta.title} icon={ADMIN_PRODUCT_ICON} count={total} />
      <ListCard>
        {total === 0 ? (
          <EmptyState icon={ADMIN_PRODUCT_ICON} title="No products found" body={meta.empty} />
        ) : (
          <>
            <SearchToolbar action={path} q={params.q} placeholder="Search by product, SKU or store" />
            {params.q ? <ResultCount shown={matching} total={total} noun="products" /> : null}
            {products.length === 0 ? (
              <NoMatches clearHref={path} noun="products" />
            ) : (
              <TableFrame label={meta.title} columns={ADMIN_PRODUCT_TABLE.columns} headers={ADMIN_PRODUCT_TABLE.headers} minWidth={ADMIN_PRODUCT_TABLE.minWidth}>
                {products.map((p, index) => (
                  <div key={p.id} role="row" className={`${ADMIN_PRODUCT_TABLE.columns} ${ROW_CLASS}`}>
                    <span role="cell" className="text-[13px] font-medium text-muted">{(page - 1) * pageSize + index + 1}</span>
                    <span role="cell" className="flex min-w-0 items-center gap-3">
                      <ProductThumb src={p.thumbnail} name={p.name} size={44} />
                      <span className="min-w-0">
                        <Link href={`/admin/products/${p.id}`} className="block truncate text-[13.5px] font-semibold text-ink hover:text-iris-500">
                          {p.name}
                        </Link>
                        <span className="mt-1 block truncate text-[11px] text-muted-soft">
                          {p.sku ? `SKU ${p.sku}` : "No SKU"}
                          {p.variationCount ? ` · ${p.variationCount} variation${p.variationCount === 1 ? "" : "s"}` : ""}
                        </span>
                        <Link href={`/admin/vendors/${p.vendor.id}`} className="mt-1 block truncate text-[11px] font-medium text-iris-500 hover:text-iris-600">
                          Sold by {p.vendor.storeName}
                        </Link>
                      </span>
                    </span>
                    <span role="cell" className="font-display text-[13.5px] font-bold text-ink">{priceLabel(p.price, p.variationPrice)}</span>
                    <span role="cell" className={`text-[13px] font-medium ${p.stock === 0 ? "text-error" : "text-ink-soft"}`}>{p.stock}</span>
                    <span role="cell"><ApprovalBadge status={p.approvalStatus} /></span>
                    <span role="cell"><MerchandisingBadges featured={p.isFeatured} popular={p.isPopular} /></span>
                    <span role="cell"><ActiveBadge active={p.isActive} /></span>
                    <span role="cell">
                      <RowActions>
                        <ViewAction href={`/admin/products/${p.id}`} label={`View ${p.name}`} />
                      </RowActions>
                    </span>
                  </div>
                ))}
              </TableFrame>
            )}
            <Pagination path={path} page={page} pageCount={pageCount} pageSize={pageSize} matching={matching} noun="products" keep={{ q: params.q }} />
          </>
        )}
      </ListCard>
    </DashboardShell>
  );
}
