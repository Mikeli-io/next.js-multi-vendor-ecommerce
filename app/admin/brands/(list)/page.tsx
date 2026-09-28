import Link from "next/link";
import type { Metadata } from "next";

import {
  AddBrandButton,
  BrandRowActions,
  BrandStatusToggle,
} from "@/components/brands/brand-actions";
import { BrandImage } from "@/components/brands/brand-image";
import {
  BRAND_BREADCRUMB,
  BRAND_COLUMNS,
  BrandTableFrame,
  BrandToolbar,
  ListHeading,
} from "@/components/brands/brand-list-parts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SearchIcon, TagIcon } from "@/components/ui/icons";
import { requireAdmin } from "@/lib/auth/guards";
import { getBrands } from "@/lib/brands/queries";
import { brandListParamsSchema } from "@/lib/validation/brand";

export const metadata: Metadata = { title: "Brands · Covet admin" };

/**
 * Admin brand list. Search and the status filter are URL params, applied in
 * the database by `getBrands` (which also enforces the ADMIN role).
 *
 * No pagination yet: the project has no list-pagination pattern and brand
 * counts are small; add it here (server-side, `skip`/`take`) if that changes.
 */
export default async function BrandsPage({ searchParams }: PageProps<"/admin/brands">) {
  const admin = await requireAdmin();
  const raw = await searchParams;
  const params = brandListParamsSchema.parse({
    q: typeof raw.q === "string" ? raw.q : "",
    status: typeof raw.status === "string" ? raw.status : "all",
  });
  const { total, brands } = await getBrands(params);
  const filtered = Boolean(params.q) || params.status !== "all";

  return (
    <DashboardShell
      role="admin"
      section="catalog"
      breadcrumb={[...BRAND_BREADCRUMB, { label: "Brand Setup" }]}
      user={{ name: admin.name, subtitle: "Master Admin" }}
    >
      <ListHeading title="Brands" count={total} action={<AddBrandButton />} />

      <section className="rounded-xl border border-line-soft bg-surface p-4 shadow-xs sm:p-[22px_24px]">
        {total === 0 ? (
          <EmptyState
            icon={TagIcon}
            title="No brands yet"
            body="Brands group products from the same maker. Add your first brand to start organising the catalog."
            action={<AddBrandButton />}
          />
        ) : (
          <>
            <BrandToolbar params={params} />

            {filtered ? (
              <p className="mb-3 text-[12.5px] text-muted" aria-live="polite">
                Showing {brands.length} of {total} brand{total === 1 ? "" : "s"}
              </p>
            ) : null}

            {brands.length === 0 ? (
              <EmptyState
                icon={SearchIcon}
                title="No brands match"
                body="Try a different name, or clear the search and status filter."
                action={
                  <Link href="/admin/brands" className="text-[13.5px] font-semibold">
                    Clear filters
                  </Link>
                }
              />
            ) : (
              <BrandTableFrame>
                {brands.map((brand) => (
                  <div
                    key={brand.id}
                    role="row"
                    className={`${BRAND_COLUMNS} border-t border-line-soft py-[14px] transition-colors duration-150 hover:bg-bg-subtle`}
                  >
                    <span role="cell">
                      <BrandImage src={brand.image} name={brand.name} />
                    </span>
                    <span role="cell" className="min-w-0">
                      <Link
                        href={`/admin/brands/${brand.id}`}
                        className="block truncate text-[13.5px] font-semibold leading-[1.3] text-ink hover:text-iris-500"
                      >
                        {brand.name}
                      </Link>
                    </span>
                    <span role="cell" className="truncate font-mono text-[12.5px] text-muted">
                      {brand.slug}
                    </span>
                    <span
                      role="cell"
                      className="font-display text-[13.5px] font-bold text-ink"
                      title={brand.productCount === null ? "Products aren't in the catalog yet" : undefined}
                    >
                      {brand.productCount ?? <span className="font-normal text-muted-soft">—</span>}
                    </span>
                    <span role="cell">
                      <BrandStatusToggle id={brand.id} name={brand.name} status={brand.status} />
                    </span>
                    <span role="cell">
                      <BrandRowActions
                        brand={{ id: brand.id, name: brand.name, image: brand.image, status: brand.status }}
                      />
                    </span>
                  </div>
                ))}
              </BrandTableFrame>
            )}
          </>
        )}
      </section>
    </DashboardShell>
  );
}
