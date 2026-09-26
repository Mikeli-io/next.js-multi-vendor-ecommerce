import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DashboardSkeleton } from "@/components/dashboard/page-states";

/** The design's "Loading" state: four total tiles, then the wallet and chart. */
export default function AdminDashboardLoading() {
  return (
    <DashboardShell role="admin">
      <DashboardSkeleton tiles={4} tileHeight={96} panels={[200, 340]} />
    </DashboardShell>
  );
}
