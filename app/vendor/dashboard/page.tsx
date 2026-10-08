import type { Metadata } from "next";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { LineChartCard } from "@/components/dashboard/line-chart-card";
import { OrderStatusGrid } from "@/components/dashboard/order-status-grid";
import { PageHeading } from "@/components/dashboard/page-states";
import {
  DeliveryManGrid,
  RatedProductList,
  TopProductGrid,
} from "@/components/dashboard/product-lists";
import {
  PeriodLabel,
  SectionCard,
  ViewAll,
} from "@/components/dashboard/section-card";
import { WalletPanel } from "@/components/dashboard/wallet-panel";
import {
  CashIcon,
  ClockIcon,
  CoinsIcon,
  DollarIcon,
  StarIcon,
  TagIcon,
  TrendIcon,
  UserIcon,
  WalletIcon,
} from "@/components/ui/icons";
import { NavTarget } from "@/components/ui/nav-target";
import { getVendorDashboard } from "@/lib/dashboard/vendor";

export const metadata: Metadata = { title: "Seller dashboard · Covet" };

/**
 * Seller dashboard, from `designs/.../vendordashboard.dc.html`.
 *
 * `getVendorDashboard()` enforces the real boundary: VENDOR role *and* an
 * APPROVED store. Pending, rejected and suspended stores are redirected to
 * `/vendor/status` before anything here renders.
 */
export default async function VendorDashboardPage() {
  const data = await getVendorDashboard();
  const { vendor, wallet } = data;

  return (
    <DashboardShell role="vendor" user={{ name: vendor.name, subtitle: vendor.maskedEmail }}>
      <PageHeading
        title={`Welcome ${vendor.name}`}
        subtitle="Monitor your business analytics and statistics."
        action={
          <NavTarget className="flex h-11 items-center gap-2 rounded-[11px] bg-iris-500 px-5 font-display text-[13px] font-bold leading-none text-surface">
            <TagIcon size={17} />
            Products
          </NavTarget>
        }
      />

      <SectionCard
        title="Business Analytics"
        icon={TrendIcon}
        action={<PeriodLabel>Overall Statistics</PeriodLabel>}
      >
        <OrderStatusGrid counts={data.orders} variant="tile" />
      </SectionCard>

      <SectionCard title="Vendor Wallet" icon={WalletIcon}>
        <WalletPanel
          hero={{
            value: wallet.withdrawableLabel,
            label: "Withdrawable Balance",
            icon: CashIcon,
            action: (
              <button
                type="button"
                disabled={wallet.withdrawable <= 0}
                title={wallet.withdrawable <= 0 ? "Nothing to withdraw yet" : undefined}
                className="h-11 w-full cursor-pointer rounded-[11px] bg-iris-500 font-display text-[13px] font-bold leading-none text-surface transition-colors duration-200 hover:bg-iris-600 disabled:cursor-not-allowed disabled:bg-iris-300"
              >
                Withdraw
              </button>
            ),
          }}
          columns={[
            [
              { icon: ClockIcon, figures: [{ value: wallet.pendingWithdraw, label: "Pending Withdraw" }] },
              {
                icon: CoinsIcon,
                figures: [
                  { value: wallet.alreadyWithdrawn, label: "Already Withdrawn" },
                  { value: wallet.totalTax, label: "Total Tax" },
                ],
              },
            ],
            [
              { icon: DollarIcon, figures: [{ value: wallet.totalCommission, label: "Total Commission" }] },
              {
                icon: CashIcon,
                figures: [
                  { value: wallet.deliveryChargeEarned, label: "Total Delivery Charge Earned" },
                  { value: wallet.collectedCash, label: "Collected Cash" },
                ],
              },
            ],
          ]}
        />
      </SectionCard>

      <LineChartCard
        title="Earning Statistics"
        icon="bars"
        series={[
          { label: "Income", color: "iris" },
          { label: "Commission given", color: "success" },
        ]}
        data={data.earnings}
        emptyCaption="Earnings will chart here once you make your first sale."
      />

      <div className="grid grid-cols-1 gap-[22px] xl:grid-cols-[1fr_1.3fr]">
        <SectionCard
          title="Most Rated Products"
          icon={StarIcon}
          tone="warning"
          size="md"
          action={<ViewAll />}
        >
          <RatedProductList products={data.ratedProducts} sellerPrefix="by" />
        </SectionCard>
        <SectionCard
          title="Top Selling Products"
          icon={DollarIcon}
          size="md"
          action={<ViewAll />}
        >
          <TopProductGrid products={data.topProducts} variant="solid" />
        </SectionCard>
      </div>

      <SectionCard
        title="Top Delivery Man"
        icon={UserIcon}
        tone="error"
        size="md"
        action={<ViewAll />}
      >
        <DeliveryManGrid people={data.deliveryMen} />
      </SectionCard>
    </DashboardShell>
  );
}
