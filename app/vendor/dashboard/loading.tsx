import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardSkeleton } from "@/components/dashboard/page-states";

/** The design's "Loading" state: eight stat tiles, then the wallet and chart. */
export default function VendorDashboardLoading() {
  return (
    <DashboardShell role="vendor">
      <DashboardSkeleton tiles={8} tileHeight={74} panels={[220, 320]} />
    </DashboardShell>
  );
}
