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
import { AddSubSubCategoryButton, SubSubCategoryRowActions } from "@/components/categories/sub-sub-category-admin";
import { SETUP_CRUMB, SUB_SUB_CATEGORY_TABLE, TAXONOMY_ICON } from "@/components/categories/taxonomy-parts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { requireAdmin } from "@/lib/auth/guards";
import { getCategoryOptions, getSubSubCategories } from "@/lib/catalog/queries";
import { param, subSubCategoryListParamsSchema } from "@/lib/validation/catalog";

export const metadata: Metadata = { title: "Sub Sub Categories · Covet admin" };

/** Admin sub sub categories, searchable and filterable by category / sub category. */
export default async function SubSubCategoriesPage({ searchParams }: PageProps<"/admin/sub-sub-categories">) {
  const admin = await requireAdmin();
  const raw = await searchParams;
  const params = subSubCategoryListParamsSchema.parse({
    q: param(raw.q),
    category: param(raw.category) || undefined,
    subCategory: param(raw.subCategory) || undefined,
  });
  const [{ total, subSubCategories }, options] = await Promise.all([getSubSubCategories(params), getCategoryOptions()]);
  const hasSubCategories = options.some((c) => c.subCategories.length > 0);
  const filtered = Boolean(params.q || params.category || params.subCategory);

  return (
    <DashboardShell
      role="admin"
      breadcrumb={[SETUP_CRUMB, { label: "Sub Sub Categories" }]}
      user={{ name: admin.name, subtitle: "Master Admin" }}
    >
      <ListHeading
        title="Sub Sub Categories"
        icon={TAXONOMY_ICON}
        count={total}
        action={<AddSubSubCategoryButton options={options} />}
      />

      <ListCard>
        {!hasSubCategories ? (
          <EmptyState
            icon={TAXONOMY_ICON}
            title="Create a sub category first"
            body="Every sub sub category belongs to a sub category, and there are none yet."
            action={
              <Link href={options.length ? "/admin/sub-categories" : "/admin/categories"} className="text-[13.5px] font-semibold">
                {options.length ? "Go to Sub Categories" : "Go to Categories"}
              </Link>
            }
          />
        ) : total === 0 ? (
          <EmptyState
            icon={TAXONOMY_ICON}
            title="No sub sub categories yet"
            body="The most specific level of the catalog. Add the first one."
            action={<AddSubSubCategoryButton options={options} />}
          />
        ) : (
          <>
            <SearchToolbar
              action="/admin/sub-sub-categories"
              q={params.q}
              placeholder="Search by Sub Sub Category Name"
              inside={
                <>
                  <FilterSelect
                    name="category"
                    label="Filter by category"
                    value={params.category ?? ""}
                    allLabel="All categories"
                    options={options.map((c) => ({ value: c.id, label: c.name }))}
                  />
                  <FilterSelect
                    name="subCategory"
                    label="Filter by sub category"
                    value={params.subCategory ?? ""}
                    allLabel="All sub categories"
                    options={options.flatMap((c) =>
                      c.subCategories.map((s) => ({ value: s.id, label: `${c.name} › ${s.name}` })),
                    )}
                  />
                </>
              }
            />
            {filtered ? <ResultCount shown={subSubCategories.length} total={total} noun="sub sub categories" /> : null}
            {subSubCategories.length === 0 ? (
              <NoMatches clearHref="/admin/sub-sub-categories" noun="sub sub categories" />
            ) : (
              <TableFrame label="Sub sub categories" columns={SUB_SUB_CATEGORY_TABLE.columns} headers={SUB_SUB_CATEGORY_TABLE.headers} minWidth={SUB_SUB_CATEGORY_TABLE.minWidth}>
                {subSubCategories.map((s) => (
                  <div key={s.id} role="row" className={`${SUB_SUB_CATEGORY_TABLE.columns} ${ROW_CLASS}`}>
                    <span role="cell" className="truncate text-[13.5px] font-semibold text-ink">
                      {s.name}
                    </span>
                    <span role="cell" className="truncate text-[13px]">
                      <Link href={listHref("/admin/sub-sub-categories", { subCategory: s.subCategory.id })} className="font-medium">
                        {s.subCategory.name}
                      </Link>
                    </span>
                    <span role="cell" className="truncate text-[13px]">
                      <Link href={listHref("/admin/sub-sub-categories", { category: s.subCategory.category.id })} className="font-medium">
                        {s.subCategory.category.name}
                      </Link>
                    </span>
                    <span role="cell" className="font-display text-[13.5px] font-bold text-ink">
                      {s.productCount ?? <NotAvailable title="Products aren't in the catalog yet" />}
                    </span>
                    <span role="cell">
                      <SubSubCategoryRowActions
                        item={{
                          id: s.id,
                          name: s.name,
                          subCategoryId: s.subCategory.id,
                          categoryId: s.subCategory.category.id,
                        }}
                        options={options}
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
