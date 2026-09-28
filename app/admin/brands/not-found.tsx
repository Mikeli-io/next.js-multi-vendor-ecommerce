import Link from "next/link";

import { BRAND_BREADCRUMB } from "@/components/brands/brand-list-parts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { SearchIcon } from "@/components/ui/icons";
import { getCurrentUser } from "@/lib/auth/guards";

/** `notFound()` from the brand details page — an unknown or deleted brand id. */
export default async function BrandNotFound() {
  const user = await getCurrentUser();

  return (
    <DashboardShell
      role="admin"
      section="catalog"
      breadcrumb={[...BRAND_BREADCRUMB, { label: "Brand Setup", href: "/admin/brands" }]}
      user={user ? { name: user.name, subtitle: "Master Admin" } : null}
    >
      <EmptyState
        variant="panel"
        icon={SearchIcon}
        title="Brand not found"
        body="This brand doesn't exist, or it has been deleted."
        action={
          <Link href="/admin/brands" className="text-[13.5px] font-semibold">
            Back to brands
          </Link>
        }
      />
    </DashboardShell>
  );
}
