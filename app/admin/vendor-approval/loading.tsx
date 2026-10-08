import { ListCard, ListHeading, TableSkeleton } from "@/components/catalog/list-parts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { APPROVAL_TABLE, VENDOR_ICON, VENDOR_MANAGE_CRUMB } from "@/components/vendors/vendor-parts";

export default function Loading() {
  return (
    <DashboardShell role="admin" breadcrumb={[VENDOR_MANAGE_CRUMB, { label: "Vendor Approval" }]}>
      <ListHeading title="Vendor Approval" icon={VENDOR_ICON} />
      <ListCard>
        <TableSkeleton label="Vendor Approval" columns={APPROVAL_TABLE.columns} headers={APPROVAL_TABLE.headers} minWidth={APPROVAL_TABLE.minWidth} cells={APPROVAL_TABLE.cells} />
      </ListCard>
    </DashboardShell>
  );
}
