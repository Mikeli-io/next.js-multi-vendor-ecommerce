import { GridIcon } from "@/components/ui/icons";

/**
 * Shared constants for the three Category Setup lists: breadcrumb root, icon,
 * and each table's column template + headers (used by page and skeleton).
 */

export const TAXONOMY_ICON = GridIcon;

export const SETUP_CRUMB = { label: "Category Setup", href: "/admin/categories" };

const ROW = "items-center gap-[14px] px-[18px]";

export const CATEGORY_TABLE = {
  columns: `grid grid-cols-[64px_minmax(160px,1.4fr)_minmax(140px,1fr)_130px_90px_88px] ${ROW}`,
  headers: ["Image", "Name", "Slug", "Sub Categories", "Products", "Actions"],
  minWidth: 760,
  cells: ["size-[46px] rounded-[10px]", "h-3 w-3/4 rounded-[5px]", "h-3 w-1/2 rounded-[5px]", "h-3 w-8 rounded-[5px]", "h-3 w-6 rounded-[5px]", "ml-auto h-8 w-[72px] rounded-sm"],
} as const;

export const SUB_CATEGORY_TABLE = {
  columns: `grid grid-cols-[minmax(160px,1.3fr)_minmax(140px,1fr)_160px_90px_88px] ${ROW}`,
  headers: ["Name", "Category", "Sub Sub Categories", "Products", "Actions"],
  minWidth: 720,
  cells: ["h-3 w-3/4 rounded-[5px]", "h-3 w-1/2 rounded-[5px]", "h-3 w-8 rounded-[5px]", "h-3 w-6 rounded-[5px]", "ml-auto h-8 w-[72px] rounded-sm"],
} as const;

export const SUB_SUB_CATEGORY_TABLE = {
  columns: `grid grid-cols-[minmax(160px,1.3fr)_minmax(140px,1fr)_minmax(140px,1fr)_90px_88px] ${ROW}`,
  headers: ["Name", "Sub Category", "Category", "Products", "Actions"],
  minWidth: 720,
  cells: ["h-3 w-3/4 rounded-[5px]", "h-3 w-1/2 rounded-[5px]", "h-3 w-1/2 rounded-[5px]", "h-3 w-6 rounded-[5px]", "ml-auto h-8 w-[72px] rounded-sm"],
} as const;
