import { ListCard, ListHeading, TableSkeleton } from "@/components/catalog/list-parts";
import { SUB_SUB_CATEGORY_TABLE, SETUP_CRUMB, TAXONOMY_ICON } from "@/components/categories/taxonomy-parts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default function Loading() {
  return (
    <DashboardShell role="admin" breadcrumb={[SETUP_CRUMB, { label: "Sub Sub Categories" }]}>
      <ListHeading title="Sub Sub Categories" icon={TAXONOMY_ICON} />
      <ListCard>
        <TableSkeleton label="Sub Sub Categories" {...SUB_SUB_CATEGORY_TABLE} />
      </ListCard>
    </DashboardShell>
  );
}
