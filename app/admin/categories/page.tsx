import Link from "next/link";
import type { Metadata } from "next";

import {
  ListCard,
  ListHeading,
  NoMatches,
  NotAvailable,
  ResultCount,
  ROW_CLASS,
  SearchToolbar,
  TableFrame,
  listHref,
} from "@/components/catalog/list-parts";
import { AddCategoryButton, CategoryRowActions } from "@/components/categories/category-admin";
import { CATEGORY_TABLE, SETUP_CRUMB, TAXONOMY_ICON } from "@/components/categories/taxonomy-parts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ImageThumb } from "@/components/ui/image-thumb";
import { requireAdmin } from "@/lib/auth/guards";
import { getCategories } from "@/lib/catalog/queries";
import { categoryListParamsSchema, param } from "@/lib/validation/catalog";

export const metadata: Metadata = { title: "Categories · Covet admin" };

/** Admin categories. Search is a URL param, applied in the database. */
export default async function CategoriesPage({ searchParams }: PageProps<"/admin/categories">) {
  const admin = await requireAdmin();
  const raw = await searchParams;
  const params = categoryListParamsSchema.parse({ q: param(raw.q) });
  const { total, categories } = await getCategories(params);

  return (
    <DashboardShell
      role="admin"
      breadcrumb={[SETUP_CRUMB, { label: "Categories" }]}
      user={{ name: admin.name, subtitle: "Master Admin" }}
    >
      <ListHeading title="Categories" icon={TAXONOMY_ICON} count={total} action={<AddCategoryButton />} />

      <ListCard>
        {total === 0 ? (
          <EmptyState
            icon={TAXONOMY_ICON}
            title="No categories yet"
            body="Categories are the top level shoppers browse by. Add one, then split it into sub categories."
            action={<AddCategoryButton />}
          />
        ) : (
          <>
            <SearchToolbar action="/admin/categories" q={params.q} placeholder="Search by Category Name" />
            {params.q ? <ResultCount shown={categories.length} total={total} noun="categories" /> : null}
            {categories.length === 0 ? (
              <NoMatches clearHref="/admin/categories" noun="categories" />
            ) : (
              <TableFrame label="Categories" columns={CATEGORY_TABLE.columns} headers={CATEGORY_TABLE.headers} minWidth={CATEGORY_TABLE.minWidth}>
                {categories.map((c) => (
                  <div key={c.id} role="row" className={`${CATEGORY_TABLE.columns} ${ROW_CLASS}`}>
                    <span role="cell">
                      <ImageThumb src={c.image} name={c.name} />
                    </span>
                    <span role="cell" className="truncate text-[13.5px] font-semibold text-ink">
                      {c.name}
                    </span>
                    <span role="cell" className="truncate font-mono text-[12.5px] text-muted">
                      {c.slug}
                    </span>
                    <span role="cell" className="text-[13px]">
                      <Link
                        href={listHref("/admin/sub-categories", { category: c.id })}
                        className="font-display font-bold"
                        title={`View ${c.name}'s sub categories`}
                      >
                        {c.subCategoryCount}
                      </Link>
                    </span>
                    <span role="cell" className="font-display text-[13.5px] font-bold text-ink">
                      {c.productCount ?? <NotAvailable title="Products aren't in the catalog yet" />}
                    </span>
                    <span role="cell">
                      <CategoryRowActions category={{ id: c.id, name: c.name, image: c.image }} />
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
