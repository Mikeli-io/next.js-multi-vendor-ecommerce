import { ListCard, ListHeading, TableSkeleton } from "@/components/catalog/list-parts";
import { CATEGORY_TABLE, SETUP_CRUMB, TAXONOMY_ICON } from "@/components/categories/taxonomy-parts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function Loading() {
  return (
    <DashboardShell role="admin" breadcrumb={[SETUP_CRUMB, { label: "Categories" }]}>
      <ListHeading title="Categories" icon={TAXONOMY_ICON} />
      <ListCard>
        <TableSkeleton label="Categories" {...CATEGORY_TABLE} />
      </ListCard>
    </DashboardShell>
  );
}
