import Link from "next/link";
import type { Metadata } from "next";

import {
  AddBrandButton,
  BrandRowActions,
  BrandStatusToggle,
} from "@/components/brands/brand-actions";
import {
  BRAND_BREADCRUMB,
  BRAND_COLUMNS,
  BRAND_HEADERS,
  BrandStatusTabs,
} from "@/components/brands/brand-list-parts";
import {
  ListCard,
  ListHeading,
  NoMatches,
  NotAvailable,
  ResultCount,
  ROW_CLASS,
  SearchToolbar,
  TableFrame,
} from "@/components/catalog/list-parts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { TagIcon } from "@/components/ui/icons";
import { ImageThumb } from "@/components/ui/image-thumb";
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
      breadcrumb={[...BRAND_BREADCRUMB, { label: "Brands" }]}
      user={{ name: admin.name, subtitle: "Master Admin" }}
    >
      <ListHeading title="Brands" icon={TagIcon} count={total} action={<AddBrandButton />} />

      <ListCard>
        {total === 0 ? (
          <EmptyState
            icon={TagIcon}
            title="No brands yet"
            body="Brands group products from the same maker. Add your first brand to start organising the catalog."
            action={<AddBrandButton />}
          />
        ) : (
          <>
            <SearchToolbar
              action="/admin/brands"
              q={params.q}
              placeholder="Search by Brand Name"
              keep={{ status: params.status === "all" ? undefined : params.status }}
              beside={<BrandStatusTabs params={params} />}
            />

            {filtered ? (
              <ResultCount shown={brands.length} total={total} noun={total === 1 ? "brand" : "brands"} />
            ) : null}

            {brands.length === 0 ? (
              <NoMatches clearHref="/admin/brands" noun="brands" />
            ) : (
              <TableFrame label="Brands" columns={BRAND_COLUMNS} headers={BRAND_HEADERS} minWidth={760}>
                {brands.map((brand) => (
                  <div
                    key={brand.id}
                    role="row"
                    className={`${BRAND_COLUMNS} ${ROW_CLASS}`}
                  >
                    <span role="cell">
                      <ImageThumb src={brand.image} name={brand.name} />
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
                    <span role="cell" className="font-display text-[13.5px] font-bold text-ink">
                      {brand.productCount ?? <NotAvailable title="Products aren't in the catalog yet" />}
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
              </TableFrame>
            )}
          </>
        )}
      </ListCard>
    </DashboardShell>
  );
}
