import Link from "next/link";
import type { Metadata } from "next";

import {
  FilterSelect,
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
import { AddSubCategoryButton, SubCategoryRowActions } from "@/components/categories/sub-category-admin";
import { SETUP_CRUMB, SUB_CATEGORY_TABLE, TAXONOMY_ICON } from "@/components/categories/taxonomy-parts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { requireAdmin } from "@/lib/auth/guards";
import { getCategoryOptions, getSubCategories } from "@/lib/catalog/queries";
import { param, subCategoryListParamsSchema } from "@/lib/validation/catalog";

export const metadata: Metadata = { title: "Sub Categories · Covet admin" };

/** Admin sub categories, searchable and filterable by category (URL params). */
export default async function SubCategoriesPage({ searchParams }: PageProps<"/admin/sub-categories">) {
  const admin = await requireAdmin();
  const raw = await searchParams;
  const params = subCategoryListParamsSchema.parse({ q: param(raw.q), category: param(raw.category) || undefined });
  const [{ total, subCategories }, options] = await Promise.all([getSubCategories(params), getCategoryOptions()]);
  const categories = options.map(({ id, name }) => ({ id, name }));
  const filtered = Boolean(params.q || params.category);

  return (
    <DashboardShell
      role="admin"
      breadcrumb={[SETUP_CRUMB, { label: "Sub Categories" }]}
      user={{ name: admin.name, subtitle: "Master Admin" }}
    >
      <ListHeading
        title="Sub Categories"
        icon={TAXONOMY_ICON}
        count={total}
        action={<AddSubCategoryButton categories={categories} defaultCategoryId={params.category} />}
      />

      <ListCard>
        {categories.length === 0 ? (
          <EmptyState
            icon={TAXONOMY_ICON}
            title="Create a category first"
            body="Every sub category belongs to a category, and there are none yet."
            action={
              <Link href="/admin/categories" className="text-[13.5px] font-semibold">
                Go to Categories
              </Link>
            }
          />
        ) : total === 0 ? (
          <EmptyState
            icon={TAXONOMY_ICON}
            title="No sub categories yet"
            body="Sub categories split a category up. Add the first one."
            action={<AddSubCategoryButton categories={categories} />}
          />
        ) : (
          <>
            <SearchToolbar
              action="/admin/sub-categories"
              q={params.q}
              placeholder="Search by Sub Category Name"
              inside={
                <FilterSelect
                  name="category"
                  label="Filter by category"
                  value={params.category ?? ""}
                  allLabel="All categories"
                  options={categories.map((c) => ({ value: c.id, label: c.name }))}
                />
              }
            />
            {filtered ? <ResultCount shown={subCategories.length} total={total} noun="sub categories" /> : null}
            {subCategories.length === 0 ? (
              <NoMatches clearHref="/admin/sub-categories" noun="sub categories" />
            ) : (
              <TableFrame label="Sub categories" columns={SUB_CATEGORY_TABLE.columns} headers={SUB_CATEGORY_TABLE.headers} minWidth={SUB_CATEGORY_TABLE.minWidth}>
                {subCategories.map((s) => (
                  <div key={s.id} role="row" className={`${SUB_CATEGORY_TABLE.columns} ${ROW_CLASS}`}>
                    <span role="cell" className="truncate text-[13.5px] font-semibold text-ink">
                      {s.name}
                    </span>
                    <span role="cell" className="truncate text-[13px]">
                      <Link href={listHref("/admin/sub-categories", { category: s.category.id })} className="font-medium">
                        {s.category.name}
                      </Link>
                    </span>
                    <span role="cell" className="text-[13px]">
                      <Link
                        href={listHref("/admin/sub-sub-categories", { subCategory: s.id })}
                        className="font-display font-bold"
                        title={`View ${s.name}'s sub sub categories`}
                      >
                        {s.subSubCategoryCount}
                      </Link>
                    </span>
                    <span role="cell" className="font-display text-[13.5px] font-bold text-ink">
                      {s.productCount ?? <NotAvailable title="Products aren't in the catalog yet" />}
                    </span>
                    <span role="cell">
                      <SubCategoryRowActions
                        subCategory={{ id: s.id, name: s.name, categoryId: s.category.id }}
                        categories={categories}
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
