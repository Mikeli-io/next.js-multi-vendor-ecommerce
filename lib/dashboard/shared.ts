import type { OrderStatusCounts } from "@/components/dashboard/order-status-grid";
import type { ChartRange, RangeData } from "@/components/dashboard/line-chart-card";

/**
 * Building blocks for dashboard data whose source tables do not exist yet.
 *
 * Phase 1 has no Order, Product, Wallet or Delivery models. Rather than show
 * the mockups' sample figures as if they were real, those metrics report zero
 * and their lists come back empty, which the widgets render as designed empty
 * states. When a later phase adds the models, only the loaders change — the
 * shapes below are what the widgets already consume.
 */

export const NO_ORDERS: OrderStatusCounts = {
  pending: 0,
  confirmed: 0,
  packaging: 0,
  outForDelivery: 0,
  delivered: 0,
  canceled: 0,
  returned: 0,
  failed: 0,
};

const LABELS: Record<ChartRange, string[]> = {
  year: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  month: ["W1", "W2", "W3", "W4"],
  week: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

/** Year / month / week axes with `seriesCount` all-zero series each. */
export function emptyRanges(seriesCount: number): Record<ChartRange, RangeData> {
  const build = (range: ChartRange): RangeData => ({
    labels: LABELS[range],
    values: Array.from({ length: seriesCount }, () =>
      LABELS[range].map(() => 0),
    ),
  });
  return { year: build("year"), month: build("month"), week: build("week") };
}
