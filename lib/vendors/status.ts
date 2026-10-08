import type { AppVendorStatus } from "@/lib/auth/roles";

/**
 * Admin-side presentation and rules for the existing VendorStatus lifecycle
 * (prisma/schema.prisma). There is one status field on the store — Vendor
 * Approval and Vendor List are two views of it, never separate data.
 */

export const VENDOR_STATUS_META: Record<
  AppVendorStatus,
  { label: string; tone: "warning" | "success" | "error" | "neutral" }
> = {
  PENDING: { label: "Pending", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
  // Same meaning as the vendor's own status screen: "Not approved".
  REJECTED: { label: "Rejected", tone: "error" },
  SUSPENDED: { label: "Suspended", tone: "error" },
};

export type VendorStatusAction = "approve" | "reject" | "suspend" | "reinstate";

/**
 * Every allowed status change. Anything not listed is refused by the server,
 * so e.g. a suspended store cannot be "rejected" or a pending one suspended.
 * None of these delete anything: each only changes the store's status.
 */
export const VENDOR_TRANSITIONS: Record<
  VendorStatusAction,
  { from: AppVendorStatus[]; to: AppVendorStatus; label: string; done: string }
> = {
  approve: { from: ["PENDING", "REJECTED"], to: "APPROVED", label: "Approve", done: "approved" },
  reject: { from: ["PENDING"], to: "REJECTED", label: "Reject", done: "rejected" },
  suspend: { from: ["APPROVED"], to: "SUSPENDED", label: "Suspend", done: "suspended" },
  reinstate: { from: ["SUSPENDED"], to: "APPROVED", label: "Reinstate", done: "reinstated" },
};

export function actionsFor(status: AppVendorStatus): VendorStatusAction[] {
  return (Object.keys(VENDOR_TRANSITIONS) as VendorStatusAction[]).filter((action) =>
    VENDOR_TRANSITIONS[action].from.includes(status),
  );
}
