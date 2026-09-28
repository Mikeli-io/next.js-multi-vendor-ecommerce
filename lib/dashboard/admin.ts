import "server-only";

import type { TopCustomer, StoreSummary } from "@/components/dashboard/admin-lists";
import type { DoughnutSlice } from "@/components/dashboard/doughnut-card";
import type { ChartRange, RangeData } from "@/components/dashboard/line-chart-card";
import type { OrderStatusCounts } from "@/components/dashboard/order-status-grid";
import type {
  DeliveryMan,
  RatedProduct,
  TopProduct,
} from "@/components/dashboard/product-lists";
import { requireAdmin } from "@/lib/auth/guards";
import { formatMoney } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { NO_ORDERS, emptyRanges } from "./shared";

export type AdminDashboardData = {
  admin: { name: string };
  totals: { orders: number; stores: number; products: number; customers: number };
  orders: OrderStatusCounts;
  wallet: {
    totalEarning: string;
    commissionEarned: string;
    taxCollected: string;
    deliveryChargeEarned: string;
    pendingAmount: string;
  };
  /** Series order: Inhouse, Vendor. */
  orderStats: Record<ChartRange, RangeData>;
  /** Series order: Inhouse, Vendor, Commission. */
  earningStats: Record<ChartRange, RangeData>;
  userOverview: DoughnutSlice[];
  topCustomers: TopCustomer[];
  deliveryMen: DeliveryMan[];
  popularStores: StoreSummary[];
  topSellingStores: StoreSummary[];
  inhouse: { rated: RatedProduct[]; topSelling: TopProduct[] };
  vendorProducts: { rated: RatedProduct[]; topSelling: TopProduct[] };
};

/**
 * Everything the admin dashboard renders. Guarded here, beside the queries.
 *
 * Real today: customer, vendor-account and live-store counts. Everything that
 * needs orders, products, payouts or deliveries reports zero / empty until
 * those models exist (see ./shared).
 */
export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const admin = await requireAdmin();

  const [customers, vendorAccounts, liveStores] = await Promise.all([
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.user.count({ where: { role: "VENDOR" } }),
    // A store counts once it is live, i.e. approved — not while under review.
    prisma.vendor.count({ where: { status: "APPROVED" } }),
  ]);

  const zero = formatMoney(0);

  return {
    admin: { name: admin.name },
    totals: { orders: 0, stores: liveStores, products: 0, customers },
    orders: NO_ORDERS,
    wallet: {
      totalEarning: zero,
      commissionEarned: zero,
      taxCollected: zero,
      deliveryChargeEarned: zero,
      pendingAmount: zero,
    },
    orderStats: emptyRanges(2),
    earningStats: emptyRanges(3),
    userOverview: [
      { label: "Total Customer", value: customers, color: "info" },
      { label: "Total Vendor", value: vendorAccounts, color: "warning" },
      // No delivery-partner accounts exist in Phase 1.
      { label: "Total Delivery Man", value: 0, color: "deep" },
    ],
    topCustomers: [],
    deliveryMen: [],
    popularStores: [],
    topSellingStores: [],
    inhouse: { rated: [], topSelling: [] },
    vendorProducts: { rated: [], topSelling: [] },
  };
}
