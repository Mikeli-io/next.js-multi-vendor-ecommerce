import Link from "next/link";
import type { Metadata } from "next";

import { ListCard, ListHeading, NoMatches, ROW_CLASS, ResultCount, SearchToolbar, TableFrame } from "@/components/catalog/list-parts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ProductActiveSwitch, ProductRowActions } from "@/components/products/product-actions";
import { ApprovalBadge, PRODUCT_ICON, PRODUCT_TABLE, ProductThumb, priceLabel } from "@/components/products/product-parts";
import { PlusIcon } from "@/components/ui/icons";
import { requireApprovedVendor } from "@/lib/auth/guards";
import { maskEmail } from "@/lib/format";
import { getOwnProducts } from "@/lib/products/queries";
import { param } from "@/lib/validation/catalog";
import { productListParamsSchema } from "@/lib/validation/product";

export const metadata: Metadata = { title: "Products · Covet" };

const ADD_LINK =
  "inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-[12px] bg-iris-500 px-[18px] font-display text-[13px] font-bold leading-none text-surface transition-colors duration-200 hover:bg-iris-600 hover:text-surface";

/**
 * Product List, after VendorProductList.dc.html. Only the signed-in vendor's
 * products are queried; the search narrows within them in the database.
 *
 * Not built from the design: Product Type (no such field), Export and Filter
 * (no export/filter feature), and the row's barcode action (no such feature).
 */
export default async function ProductListPage({ searchParams }: PageProps<"/vendor/products">) {
  const user = await requireApprovedVendor();
  const params = productListParamsSchema.parse({ q: param((await searchParams).q) });
  const { total, products } = await getOwnProducts(params);

  return (
    <DashboardShell
      role="vendor"
      breadcrumb={[{ label: "Products", href: "/vendor/products" }, { label: "Product List" }]}
      user={{ name: user.name, subtitle: maskEmail(user.email) }}
    >
      <ListHeading
        title="Product List"
        icon={PRODUCT_ICON}
        count={total}
        action={
          <Link href="/vendor/products/new" className={ADD_LINK}>
            <PlusIcon size={16} />
            Add new product
          </Link>
        }
      />

      <ListCard>
        {total === 0 ? (
          <EmptyState
            icon={PRODUCT_ICON}
            title="No products yet"
            body="You haven't listed any products. Add your first product to start selling."
            action={
              <Link href="/vendor/products/new" className={ADD_LINK}>
                <PlusIcon size={16} />
                Add new product
              </Link>
            }
          />
        ) : (
          <>
            <SearchToolbar action="/vendor/products" q={params.q} placeholder="Search by Product Name" />
            {params.q ? <ResultCount shown={products.length} total={total} noun="products" /> : null}
            {products.length === 0 ? (
              <NoMatches clearHref="/vendor/products" noun="products" />
            ) : (
              <TableFrame label="Products" columns={PRODUCT_TABLE.columns} headers={PRODUCT_TABLE.headers} minWidth={PRODUCT_TABLE.minWidth}>
                {products.map((p, index) => (
                  <div key={p.id} role="row" className={`${PRODUCT_TABLE.columns} ${ROW_CLASS}`}>
                    <span role="cell" className="text-[13px] font-medium text-muted">{index + 1}</span>
                    <span role="cell" className="flex min-w-0 items-center gap-3">
                      <ProductThumb src={p.thumbnail} name={p.name} />
                      <span className="min-w-0">
                        <Link href={`/vendor/products/${p.id}`} className="block truncate text-[13.5px] font-semibold text-ink hover:text-iris-500">
                          {p.name}
                        </Link>
                        <span className="mt-1 block truncate text-[11px] text-muted-soft">
                          {p.sku ? `SKU ${p.sku}` : "No SKU"}
                          {p.variationCount ? ` · ${p.variationCount} variation${p.variationCount === 1 ? "" : "s"}` : ""}
                        </span>
                      </span>
                    </span>
                    <span role="cell" className="font-display text-[13.5px] font-bold text-ink">{priceLabel(p.price, p.variationPrice)}</span>
                    <span role="cell" className={`text-[13px] font-medium ${p.stock === 0 ? "text-error" : "text-ink-soft"}`}>{p.stock}</span>
                    <span role="cell"><ApprovalBadge status={p.approvalStatus} /></span>
                    <span role="cell"><ProductActiveSwitch id={p.id} name={p.name} active={p.isActive} /></span>
                    <span role="cell"><ProductRowActions id={p.id} name={p.name} /></span>
                  </div>
                ))}
              </TableFrame>
            )}
          </>
        )}
      </ListCard>
    </DashboardShell>
  );
}
