import Link from "next/link";
import type { ReactNode } from "react";

import { SearchIcon, TagIcon } from "@/components/ui/icons";
import type { BrandListParams } from "@/lib/validation/brand";

/**
 * Server-rendered pieces of the brand list, following the list design:
 * heading with count badge, toolbar, and the table frame. Search and the status
 * tabs are a plain GET form and plain links, so they work before hydration and
 * every filter state is a shareable URL.
 */

export const BRAND_BREADCRUMB = [{ label: "Catalog", href: "/admin/brands" }];

export function ListHeading({
  title,
  count,
  action,
}: {
  title: string;
  count?: number;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-[10px] bg-iris-50 text-iris-500">
          <TagIcon size={18} />
        </span>
        <h1 className="font-display text-[24px] font-extrabold leading-none tracking-[-0.01em] text-ink">
          {title}
        </h1>
        {count !== undefined ? (
          <span
            aria-label={`${count} total`}
            className="flex h-[26px] min-w-[30px] items-center justify-center rounded-full bg-track px-[10px] font-display text-[13px] font-bold leading-none text-ink-soft"
          >
            {count}
          </span>
        ) : null}
      </div>
      {action}
    </div>
  );
}

const TABS: ReadonlyArray<{ value: BrandListParams["status"]; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

function listHref(q: string, status: BrandListParams["status"]) {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (status !== "all") params.set("status", status);
  const query = params.toString();
  return `/admin/brands${query ? `?${query}` : ""}`;
}

export function BrandToolbar({ params }: { params: BrandListParams }) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-[14px]">
      <form
        role="search"
        action="/admin/brands"
        className="flex h-[46px] min-w-[240px] flex-1 items-center overflow-hidden rounded-[11px] border border-line bg-field transition-[border-color,box-shadow] duration-200 focus-within:border-iris-500 focus-within:shadow-[0_0_0_3px_var(--iris-100)]"
      >
        <span className="px-[14px] text-muted-soft">
          <SearchIcon size={17} />
        </span>
        <label htmlFor="brand-search" className="sr-only">
          Search by brand name
        </label>
        <input
          id="brand-search"
          type="search"
          name="q"
          defaultValue={params.q}
          maxLength={60}
          placeholder="Search by Brand Name"
          className="h-full min-w-0 flex-1 border-none bg-transparent px-1 text-[13.5px] leading-none text-ink outline-none placeholder:text-muted-soft"
        />
        {params.status !== "all" ? <input type="hidden" name="status" value={params.status} /> : null}
        <button
          type="submit"
          className="h-full cursor-pointer bg-iris-500 px-[22px] text-[13px] font-semibold leading-none text-surface transition-colors duration-200 hover:bg-iris-600"
        >
          Search
        </button>
      </form>

      <nav aria-label="Filter by status" className="flex gap-1 rounded-[11px] bg-track p-1">
        {TABS.map((tab) => {
          const active = params.status === tab.value;
          return (
            <Link
              key={tab.value}
              href={listHref(params.q, tab.value)}
              aria-current={active ? "page" : undefined}
              className={`flex h-[38px] items-center rounded-sm px-4 text-[12.5px] leading-none transition-colors duration-150 ${
                active
                  ? "bg-surface font-semibold text-ink shadow-xs hover:text-ink"
                  : "font-medium text-muted hover:text-ink"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

/**
 * Column template shared by the header, rows and skeleton so they always
 * line up. The table scrolls horizontally rather than collapsing its columns
 * on narrow screens (DESIGN_SYSTEM.md §8 "Table").
 */
export const BRAND_COLUMNS =
  "grid grid-cols-[64px_minmax(160px,1.4fr)_minmax(140px,1fr)_90px_170px_120px] items-center gap-[14px] px-[18px]";

export function BrandTableFrame({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line-soft">
      <div role="table" aria-label="Brands" className="min-w-[760px]">
        <div
          role="row"
          className={`${BRAND_COLUMNS} bg-field py-[14px] text-[11px] font-semibold uppercase leading-none tracking-[0.04em] text-muted`}
        >
          <span role="columnheader">Image</span>
          <span role="columnheader">Name</span>
          <span role="columnheader">Slug</span>
          <span role="columnheader">Products</span>
          <span role="columnheader">Status</span>
          <span role="columnheader" className="text-right">
            Actions
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

