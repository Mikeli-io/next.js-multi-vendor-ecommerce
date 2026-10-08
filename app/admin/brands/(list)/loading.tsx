import { BRAND_BREADCRUMB, BRAND_COLUMNS, BRAND_HEADERS } from "@/components/brands/brand-list-parts";
import { ListHeading, TableFrame } from "@/components/catalog/list-parts";
import { TagIcon } from "@/components/ui/icons";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

/** The list design's loading state: toolbar placeholder and shimmering rows. */
export default function BrandsLoading() {
  return (
    <DashboardShell role="admin" breadcrumb={[...BRAND_BREADCRUMB, { label: "Brands" }]}>
      <ListHeading title="Brands" icon={TagIcon} />
      <section
        aria-busy="true"
        aria-label="Loading brands"
        className="rounded-xl border border-line-soft bg-surface p-4 shadow-xs sm:p-[22px_24px]"
      >
        <div className="mb-5 flex flex-wrap gap-[14px]">
          <div className="skeleton h-[46px] min-w-[240px] flex-1 rounded-[11px]" />
          <div className="skeleton h-[46px] w-[230px] rounded-[11px]" />
        </div>
        <TableFrame label="Brands" columns={BRAND_COLUMNS} headers={BRAND_HEADERS} minWidth={760}>
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className={`${BRAND_COLUMNS} border-t border-line-soft py-4`}>
              <span className="skeleton size-[46px] rounded-[10px]" />
              <span className="skeleton h-3 w-3/4 rounded-[5px]" />
              <span className="skeleton h-3 w-1/2 rounded-[5px]" />
              <span className="skeleton h-3 w-6 rounded-[5px]" />
              <span className="skeleton h-6 w-20 rounded-full" />
              <span className="skeleton ml-auto h-8 w-[110px] rounded-sm" />
            </div>
          ))}
        </TableFrame>
      </section>
    </DashboardShell>
  );
}
