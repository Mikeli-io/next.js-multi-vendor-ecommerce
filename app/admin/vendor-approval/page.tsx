import Link from "next/link";
import type { Metadata } from "next";

import {
  ListCard,
  ListHeading,
  NoMatches,
  ResultCount,
  ROW_CLASS,
  SearchToolbar,
  TableFrame,
} from "@/components/catalog/list-parts";
import { RowActions, ViewAction } from "@/components/catalog/row-actions";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { APPROVAL_TABLE, ContactCell, VENDOR_ICON, VENDOR_MANAGE_CRUMB, VendorStatusBadge } from "@/components/vendors/vendor-parts";
import { requireAdmin } from "@/lib/auth/guards";
import { formatDate } from "@/lib/format";
import { param } from "@/lib/validation/catalog";
import { vendorApprovalParamsSchema } from "@/lib/validation/vendor";
import { getPendingVendors } from "@/lib/vendors/queries";

export const metadata: Metadata = { title: "Vendor Approval · Covet admin" };

/**
 * The review queue: every store still PENDING, oldest registration first.
 * Not a copy of anything — it is the PENDING slice of the same vendor rows the
 * Vendor List shows. Approving or rejecting a store removes it from here.
 */
export default async function VendorApprovalPage({ searchParams }: PageProps<"/admin/vendor-approval">) {
  const admin = await requireAdmin();
  const params = vendorApprovalParamsSchema.parse({ q: param((await searchParams).q) });
  const { total, vendors } = await getPendingVendors(params);

  return (
    <DashboardShell
      role="admin"
      breadcrumb={[VENDOR_MANAGE_CRUMB, { label: "Vendor Approval" }]}
      user={{ name: admin.name, subtitle: "Master Admin" }}
    >
      <ListHeading title="Vendor Approval" icon={VENDOR_ICON} count={total} />

      <ListCard>
        {total === 0 ? (
          <EmptyState
            icon={VENDOR_ICON}
            title="No vendors waiting for approval"
            body="New store registrations appear here for review. Every registered store is in the Vendor List."
            action={
              <Link href="/admin/vendors" className="text-[13.5px] font-semibold">
                Go to Vendor List
              </Link>
            }
          />
        ) : (
          <>
            <SearchToolbar action="/admin/vendor-approval" q={params.q} placeholder="Search by store, owner, email or phone" />
            {params.q ? <ResultCount shown={vendors.length} total={total} noun="pending vendors" /> : null}
            {vendors.length === 0 ? (
              <NoMatches clearHref="/admin/vendor-approval" noun="pending vendors" />
            ) : (
              <TableFrame label="Pending vendors" columns={APPROVAL_TABLE.columns} headers={APPROVAL_TABLE.headers} minWidth={APPROVAL_TABLE.minWidth}>
                {vendors.map((v) => (
                  <div key={v.id} role="row" className={`${APPROVAL_TABLE.columns} ${ROW_CLASS}`}>
                    <span role="cell" className="min-w-0">
                      <Link
                        href={`/admin/vendors/${v.id}?from=approval`}
                        className="block truncate text-[13.5px] font-semibold text-ink hover:text-iris-500"
                      >
                        {v.storeName}
                      </Link>
                    </span>
                    <span role="cell" className="truncate text-[13px] text-ink-soft">{v.owner.name}</span>
                    <ContactCell email={v.owner.email} phone={v.owner.phone} />
                    <span role="cell" className="text-[13px] text-muted">{formatDate(v.createdAt)}</span>
                    <span role="cell"><VendorStatusBadge status={v.status} /></span>
                    <span role="cell">
                      <RowActions>
                        <ViewAction href={`/admin/vendors/${v.id}?from=approval`} label={`Review ${v.storeName}`} />
                      </RowActions>
                    </span>
                  </div>
                ))}
              </TableFrame>
            )}
          </>
        )}
      </ListCard>
    </DashboardShell>
  );
}
