import Link from "next/link";
import type { Metadata } from "next";

import {
  FilterTabs,
  ListCard,
  ListHeading,
  NoMatches,
  NotAvailable,
  ResultCount,
  ROW_CLASS,
  SearchToolbar,
  TableFrame,
} from "@/components/catalog/list-parts";
import { RowActions, ViewAction } from "@/components/catalog/row-actions";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PlusIcon } from "@/components/ui/icons";
import {
  ContactCell,
  StoreTile,
  VENDOR_ICON,
  VENDOR_LIST_TABLE,
  VENDOR_MANAGE_CRUMB,
  VendorStatusBadge,
} from "@/components/vendors/vendor-parts";
import { requireAdmin } from "@/lib/auth/guards";
import { param } from "@/lib/validation/catalog";
import { vendorListParamsSchema } from "@/lib/validation/vendor";
import { getVendors } from "@/lib/vendors/queries";

export const metadata: Metadata = { title: "Vendor List · Covet admin" };

const NO_PRODUCTS = "Products aren't in the catalog yet";
const NO_ORDERS = "Orders aren't available yet";

/**
 * Every registered store and its current status, after AdminVendorList.dc.html.
 * Same vendor rows as Vendor Approval; the status tabs are views of one field.
 *
 * Not built from the design: Export and Sorting (no export/sort system yet)
 * and the "On Vacation" flag (no such data).
 */
export default async function VendorListPage({ searchParams }: PageProps<"/admin/vendors">) {
  const admin = await requireAdmin();
  const raw = await searchParams;
  const params = vendorListParamsSchema.parse({ q: param(raw.q), status: param(raw.status) || "all" });
  const { total, counts, vendors } = await getVendors(params);
  const filtered = Boolean(params.q) || params.status !== "all";

  const tabs = [
    { value: "all", label: "All", count: total },
    { value: "pending", label: "Pending", count: counts.PENDING },
    { value: "approved", label: "Approved", count: counts.APPROVED },
    { value: "suspended", label: "Suspended", count: counts.SUSPENDED },
    { value: "rejected", label: "Rejected", count: counts.REJECTED },
  ];

  return (
    <DashboardShell
      role="admin"
      breadcrumb={[VENDOR_MANAGE_CRUMB, { label: "Vendor List" }]}
      user={{ name: admin.name, subtitle: "Master Admin" }}
    >
      <ListHeading
        title="Vendor List"
        icon={VENDOR_ICON}
        count={total}
        action={
          <Link
            href="/admin/vendors/new"
            className="inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-[12px] bg-iris-500 px-[18px] font-display text-[13px] font-bold leading-none text-surface transition-colors duration-200 hover:bg-iris-600 hover:text-surface"
          >
            <PlusIcon size={16} />
            Add New Vendor
          </Link>
        }
      />

      <ListCard>
        {total === 0 ? (
          <EmptyState
            icon={VENDOR_ICON}
            title="No vendors yet"
            body="Stores appear here as soon as sellers register."
          />
        ) : (
          <>
            <SearchToolbar
              action="/admin/vendors"
              q={params.q}
              placeholder="Search by shop, vendor, email or phone"
              keep={{ status: params.status === "all" ? undefined : params.status }}
              beside={
                <FilterTabs
                  label="Filter by status"
                  path="/admin/vendors"
                  param="status"
                  current={params.status}
                  options={tabs}
                  keep={{ q: params.q }}
                />
              }
            />
            {filtered ? <ResultCount shown={vendors.length} total={total} noun="vendors" /> : null}
            {vendors.length === 0 ? (
              <NoMatches clearHref="/admin/vendors" noun="vendors" />
            ) : (
              <TableFrame label="Vendors" columns={VENDOR_LIST_TABLE.columns} headers={VENDOR_LIST_TABLE.headers} minWidth={VENDOR_LIST_TABLE.minWidth}>
                {vendors.map((v, index) => (
                  <div key={v.id} role="row" className={`${VENDOR_LIST_TABLE.columns} ${ROW_CLASS}`}>
                    <span role="cell" className="text-[13px] font-medium text-muted">{index + 1}</span>
                    <span role="cell" className="flex min-w-0 items-center gap-3">
                      <StoreTile name={v.storeName} logo={v.logo} />
                      <Link
                        href={`/admin/vendors/${v.id}`}
                        className="truncate text-[13.5px] font-semibold text-ink hover:text-iris-500"
                      >
                        {v.storeName}
                      </Link>
                    </span>
                    <span role="cell" className="truncate text-[13px] font-medium text-ink-soft">{v.owner.name}</span>
                    <ContactCell email={v.owner.email} phone={v.owner.phone} />
                    <span role="cell"><VendorStatusBadge status={v.status} /></span>
                    <span role="cell" className="font-display text-[13px] font-bold text-ink">
                      {v.products.total ?? <NotAvailable title={NO_PRODUCTS} />}
                    </span>
                    <span role="cell" className="font-display text-[13px] font-bold text-ink">
                      <NotAvailable title={NO_ORDERS} />
                    </span>
                    <span role="cell">
                      <RowActions>
                        <ViewAction href={`/admin/vendors/${v.id}`} label={`View ${v.storeName}`} />
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
