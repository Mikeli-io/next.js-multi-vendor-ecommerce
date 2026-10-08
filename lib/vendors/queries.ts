import "server-only";

import { cache } from "react";
import type { Prisma } from "@prisma/client";

import type { AppVendorStatus } from "@/lib/auth/roles";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import type { VendorApprovalParams, VendorListParams } from "@/lib/validation/vendor";

/**
 * Admin loaders for vendor management. Each checks the ADMIN role itself.
 * They read the real Vendor (store) + User (owner) rows created at
 * registration — Vendor Approval is simply the PENDING slice of the same data.
 *
 * Product counts are derived from the Product table; order counts stay `null`
 * ("not applicable") until an Order model exists.
 */

/** `active` counts the vendor's own on switch (`isActive`), whatever the approval. */
export type VendorProductStats = { total: number | null; active: number | null };

async function vendorProductStats(ids: string[]): Promise<Map<string, VendorProductStats>> {
  if (!ids.length) return new Map();
  const groups = await prisma.product.groupBy({
    by: ["vendorId", "isActive"],
    where: { vendorId: { in: ids } },
    _count: { _all: true },
  });
  const stats = new Map<string, VendorProductStats>(ids.map((id) => [id, { total: 0, active: 0 }]));
  for (const group of groups) {
    const entry = stats.get(group.vendorId)!;
    entry.total! += group._count._all;
    if (group.isActive) entry.active! += group._count._all;
  }
  return stats;
}

const ROW_SELECT = {
  id: true,
  storeName: true,
  slug: true,
  status: true,
  logo: true,
  createdAt: true,
  user: { select: { id: true, name: true, email: true, phone: true } },
} satisfies Prisma.VendorSelect;

export type VendorRow = {
  id: string;
  storeName: string;
  slug: string;
  status: AppVendorStatus;
  /** Public URL path; null for stores that never uploaded one (self-registered). */
  logo: string | null;
  createdAt: Date;
  /** `phone` is null for owners who registered before it was collected. */
  owner: { id: string; name: string; email: string; phone: string | null };
  products: VendorProductStats;
};

function toRow(row: Prisma.VendorGetPayload<{ select: typeof ROW_SELECT }>, stats: Map<string, VendorProductStats>): VendorRow {
  const { user, ...rest } = row;
  return { ...rest, owner: user, products: stats.get(row.id) ?? { total: null, active: null } };
}

/** Matches the store name, or the owner's name, email or phone. */
function searchWhere(q: string): Prisma.VendorWhereInput {
  return q
    ? { OR: [{ storeName: { contains: q } }, { user: { name: { contains: q } } }, { user: { email: { contains: q } } }, { user: { phone: { contains: q } } }] }
    : {};
}

const STATUS_FILTER: Record<VendorListParams["status"], AppVendorStatus | undefined> = {
  all: undefined,
  pending: "PENDING",
  approved: "APPROVED",
  suspended: "SUSPENDED",
  rejected: "REJECTED",
};

/** Number of stores in each status, for the list's filter tabs and headings. */
async function statusCounts() {
  const groups = await prisma.vendor.groupBy({ by: ["status"], _count: { _all: true } });
  const counts: Record<AppVendorStatus, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0, SUSPENDED: 0 };
  for (const g of groups) counts[g.status] = g._count._all;
  return counts;
}

export async function getVendors(params: VendorListParams) {
  await requireAdmin();
  const status = STATUS_FILTER[params.status];
  const [counts, rows] = await Promise.all([
    statusCounts(),
    prisma.vendor.findMany({
      where: { ...searchWhere(params.q), ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
      select: ROW_SELECT,
    }),
  ]);
  const stats = await vendorProductStats(rows.map((r) => r.id));
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  return { total, counts, vendors: rows.map((r) => toRow(r, stats)) };
}

/** Registrations awaiting review, oldest first (first come, first reviewed). */
export async function getPendingVendors(params: VendorApprovalParams) {
  await requireAdmin();
  const [total, rows] = await Promise.all([
    prisma.vendor.count({ where: { status: "PENDING" } }),
    prisma.vendor.findMany({
      where: { status: "PENDING", ...searchWhere(params.q) },
      orderBy: { createdAt: "asc" },
      select: ROW_SELECT,
    }),
  ]);
  const stats = await vendorProductStats(rows.map((r) => r.id));
  return { total, vendors: rows.map((r) => toRow(r, stats)) };
}

/** Store profile + TIN fields. All null for self-registered stores. */
export type VendorDetail = VendorRow & {
  updatedAt: Date;
  image: string | null;
  coverImage: string | null;
  address: string | null;
  tinNumber: string | null;
  tinExpireDate: Date | null;
  /** Whether a certificate is stored — its private key never leaves the server. */
  hasTinCertificate: boolean;
  owner: VendorRow["owner"] & { createdAt: Date };
};

/** One vendor for the detail page, or `null`. Memoized per request (layout + page). */
export const getVendor = cache(async (id: string): Promise<VendorDetail | null> => {
  await requireAdmin();
  const row = await prisma.vendor.findUnique({
    where: { id },
    select: {
      ...ROW_SELECT,
      updatedAt: true,
      image: true,
      coverImage: true,
      address: true,
      tinNumber: true,
      tinExpireDate: true,
      tinCertificate: true,
      user: { select: { id: true, name: true, email: true, phone: true, createdAt: true } },
    },
  });
  if (!row) return null;
  const stats = await vendorProductStats([row.id]);
  const { user, tinCertificate, ...rest } = row;
  return {
    ...rest,
    hasTinCertificate: Boolean(tinCertificate),
    owner: user,
    products: stats.get(row.id) ?? { total: null, active: null },
  };
});

/** The stored TIN certificate key for the guarded download route, or null. */
export async function getVendorTinCertificate(id: string): Promise<{ key: string; slug: string } | null> {
  await requireAdmin();
  const row = await prisma.vendor.findUnique({ where: { id }, select: { tinCertificate: true, slug: true } });
  return row?.tinCertificate ? { key: row.tinCertificate, slug: row.slug } : null;
}
