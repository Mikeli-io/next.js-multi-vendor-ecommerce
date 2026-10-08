import { FilterTabs } from "@/components/catalog/list-parts";
import type { BrandListParams } from "@/lib/validation/brand";

/** Brand-specific pieces of the brand list; the rest is in components/catalog. */

export const BRAND_BREADCRUMB = [{ label: "Catalog", href: "/admin/brands" }];

export const BRAND_COLUMNS =
  "grid grid-cols-[64px_minmax(160px,1.4fr)_minmax(140px,1fr)_90px_170px_120px] items-center gap-[14px] px-[18px]";

export const BRAND_HEADERS = ["Image", "Name", "Slug", "Products", "Status", "Actions"] as const;

const TABS = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

/** All / Active / Inactive link tabs beside the brand search. */
export function BrandStatusTabs({ params }: { params: BrandListParams }) {
  return (
    <FilterTabs
      label="Filter by status"
      path="/admin/brands"
      param="status"
      current={params.status}
      options={TABS}
      keep={{ q: params.q }}
    />
  );
}
