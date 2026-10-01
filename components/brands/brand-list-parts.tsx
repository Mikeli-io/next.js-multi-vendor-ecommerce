import Link from "next/link";

import { listHref } from "@/components/catalog/list-parts";
import type { BrandListParams } from "@/lib/validation/brand";

/** Brand-specific pieces of the brand list; the rest is in components/catalog. */

export const BRAND_BREADCRUMB = [{ label: "Catalog", href: "/admin/brands" }];

export const BRAND_COLUMNS =
  "grid grid-cols-[64px_minmax(160px,1.4fr)_minmax(140px,1fr)_90px_170px_120px] items-center gap-[14px] px-[18px]";

export const BRAND_HEADERS = ["Image", "Name", "Slug", "Products", "Status", "Actions"] as const;

const TABS: ReadonlyArray<{ value: BrandListParams["status"]; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

/** All / Active / Inactive link tabs beside the brand search. */
export function BrandStatusTabs({ params }: { params: BrandListParams }) {
  return (
    <nav aria-label="Filter by status" className="flex gap-1 rounded-[11px] bg-track p-1">
      {TABS.map((tab) => {
        const active = params.status === tab.value;
        return (
          <Link
            key={tab.value}
            href={listHref("/admin/brands", { q: params.q, status: tab.value === "all" ? undefined : tab.value })}
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
  );
}
