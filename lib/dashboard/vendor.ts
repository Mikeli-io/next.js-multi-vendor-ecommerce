import "server-only";

import type { RangeData, ChartRange } from "@/components/dashboard/line-chart-card";
import type { OrderStatusCounts } from "@/components/dashboard/order-status-grid";
import type {
  DeliveryMan,
  RatedProduct,
  TopProduct,
} from "@/components/dashboard/product-lists";
import { requireApprovedVendor } from "@/lib/auth/guards";
import { formatMoney, maskEmail } from "@/lib/format";
import { NO_ORDERS, emptyRanges } from "./shared";

export type VendorDashboardData = {
  vendor: { name: string; maskedEmail: string; storeName: string };
  orders: OrderStatusCounts;
  wallet: {
    withdrawable: number;
    pendingWithdraw: string;
    alreadyWithdrawn: string;
    totalTax: string;
    totalCommission: string;
    deliveryChargeEarned: string;
    collectedCash: string;
    withdrawableLabel: string;
  };
  /** Series order: Income, Commission given. */
  earnings: Record<ChartRange, RangeData>;
  ratedProducts: RatedProduct[];
  topProducts: TopProduct[];
  deliveryMen: DeliveryMan[];
};

/**
 * Everything the vendor dashboard renders, for the signed-in vendor only.
 *
 * The guard runs here, next to the data, so this loader cannot be called for a
 * store the caller does not own — every future query below must stay scoped to
 * `vendor.id` (PRD §3, rule 4: sellers only ever see their own data).
 */
export async function getVendorDashboard(): Promise<VendorDashboardData> {
  const user = await requireApprovedVendor();
  const zero = formatMoney(0);

  return {
    vendor: {
      name: user.name,
      maskedEmail: maskEmail(user.email),
      storeName: user.vendor.storeName,
    },
    // No Order model yet (see ./shared).
    orders: NO_ORDERS,
    wallet: {
      withdrawable: 0,
      withdrawableLabel: zero,
      pendingWithdraw: zero,
      alreadyWithdrawn: zero,
      totalTax: zero,
      totalCommission: zero,
      deliveryChargeEarned: zero,
      collectedCash: zero,
    },
    earnings: emptyRanges(2),
    ratedProducts: [],
    topProducts: [],
    deliveryMen: [],
  };
}
