import type { ComponentType } from "react";
import type { Metadata } from "next";

import { StoreGrid, TopCustomerList } from "@/components/dashboard/admin-lists";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { DoughnutCard } from "@/components/dashboard/doughnut-card";
import { LineChartCard } from "@/components/dashboard/line-chart-card";
import { OrderStatusGrid } from "@/components/dashboard/order-status-grid";
import { PageHeading } from "@/components/dashboard/page-states";
import {
  DeliveryManGrid,
  RatedProductList,
  TopProductGrid,
} from "@/components/dashboard/product-lists";
import {
  GroupHeading,
  PeriodLabel,
  SectionCard,
  TONE_CHIP,
  type Tone,
  ViewAll,
} from "@/components/dashboard/section-card";
import { WalletPanel } from "@/components/dashboard/wallet-panel";
import {
  BagIcon,
  BarChartIcon,
  BoxIcon,
  ClockIcon,
  DollarIcon,
  HeartFilledIcon,
  type IconProps,
  PercentIcon,
  ReceiptIcon,
  ShopFrontIcon,
  StarIcon,
  TrendIcon,
  TruckIcon,
  UserIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/ui/icons";
import { getAdminDashboard } from "@/lib/dashboard/admin";

export const metadata: Metadata = { title: "Admin dashboard · Covet" };

/**
 * Platform admin dashboard, from `designs/.../AdminDashboard.dc.html`.
 * `getAdminDashboard()` enforces the ADMIN role beside its queries.
 */
export default async function AdminDashboardPage() {
  const data = await getAdminDashboard();
  const { totals, wallet } = data;

  return (
    <DashboardShell role="admin" user={{ name: data.admin.name, subtitle: "Master Admin" }}>
      <PageHeading
        title="Welcome Admin"
        subtitle="Monitor your business analytics and statistics."
      />

      <SectionCard
        title="Business Analytics"
        icon={TrendIcon}
        action={<PeriodLabel>This Year Statistics</PeriodLabel>}
      >
        <div className="mb-[14px] grid grid-cols-1 gap-[14px] @md:grid-cols-2 @3xl:grid-cols-4">
          <TotalCard label="Total Order" value={totals.orders} icon={BagIcon} tone="iris" />
          <TotalCard label="Total Stores" value={totals.stores} icon={ShopFrontIcon} tone="info" />
          <TotalCard label="Total Products" value={totals.products} icon={BoxIcon} tone="success" />
          <TotalCard label="Total Customers" value={totals.customers} icon={UsersIcon} tone="warning" />
        </div>
        <OrderStatusGrid counts={data.orders} variant="compact" />
      </SectionCard>

      <SectionCard title="Admin Wallet" icon={WalletIcon}>
        <WalletPanel
          align="center"
          hero={{
            value: wallet.totalEarning,
            label: "Total Admin Earning",
            icon: BarChartIcon,
            size: "md",
          }}
          columns={[
            [
              { icon: PercentIcon, figures: [{ value: wallet.commissionEarned, label: "Commission Earned" }] },
              { icon: ReceiptIcon, figures: [{ value: wallet.taxCollected, label: "Total Tax Collected" }] },
            ],
            [
              { icon: TruckIcon, figures: [{ value: wallet.deliveryChargeEarned, label: "Delivery Charge Earned" }] },
              { icon: ClockIcon, figures: [{ value: wallet.pendingAmount, label: "Pending Amount" }] },
            ],
          ]}
        />
      </SectionCard>

      <div className="grid grid-cols-1 items-start gap-[22px] xl:grid-cols-[1fr_380px]">
        <LineChartCard
          title="Order Statistics"
          icon="trend"
          series={[
            { label: "Inhouse", color: "iris" },
            { label: "Vendor", color: "success" },
          ]}
          data={data.orderStats}
          emptyCaption="Order volume will chart here once orders are placed."
          valuePrefix=""
        />
        <DoughnutCard title="User Overview" slices={data.userOverview} />
      </div>

      <LineChartCard
        title="Earning Statistics"
        icon="bars"
        series={[
          { label: "Inhouse", color: "iris" },
          { label: "Vendor", color: "success" },
          { label: "Commission", color: "warning" },
        ]}
        data={data.earningStats}
        emptyCaption="Platform earnings will chart here once orders are paid."
      />

      <section>
        <GroupHeading>Users</GroupHeading>
        <div className="grid grid-cols-1 gap-[22px] xl:grid-cols-2">
          <SectionCard title="Top Customers" icon={UserIcon} size="sm" action={<ViewAll />}>
            <TopCustomerList customers={data.topCustomers} />
          </SectionCard>
          <SectionCard title="Top Delivery Man" icon={TruckIcon} tone="error" size="sm" action={<ViewAll />}>
            <DeliveryManGrid people={data.deliveryMen} columns="two" />
          </SectionCard>
        </div>
      </section>

      <section>
        <GroupHeading>Stores</GroupHeading>
        <div className="grid grid-cols-1 gap-[22px] xl:grid-cols-2">
          <SectionCard title="Most Popular Stores" icon={HeartFilledIcon} tone="error" size="sm" action={<ViewAll />}>
            <StoreGrid stores={data.popularStores} kind="popular" />
          </SectionCard>
          <SectionCard title="Top Selling Stores" icon={ClockIcon} size="sm" action={<ViewAll />}>
            <StoreGrid stores={data.topSellingStores} kind="top-selling" />
          </SectionCard>
        </div>
      </section>

      <ProductGroup heading="Inhouse Products" rated={data.inhouse.rated} topSelling={data.inhouse.topSelling} />
      <ProductGroup heading="Vendor Products" rated={data.vendorProducts.rated} topSelling={data.vendorProducts.topSelling} />
    </DashboardShell>
  );
}

/** A "Total …" figure with its tinted icon chip, as in the design's top row. */
function TotalCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  icon: ComponentType<IconProps>;
  tone: Tone;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-line-soft bg-bg-subtle p-[18px]">
      <div>
        <p className="text-[12.5px] font-medium leading-[1.2] text-muted">{label}</p>
        <p className="mt-3 font-display text-[26px] font-extrabold leading-none text-ink">
          {value.toLocaleString("en-US")}
        </p>
      </div>
      <span className={`grid size-12 flex-none place-items-center rounded-[13px] ${TONE_CHIP[tone]}`}>
        <Icon size={22} strokeWidth={1.8} />
      </span>
    </div>
  );
}

/** "Inhouse Products" and "Vendor Products" share one two-card layout. */
function ProductGroup({
  heading,
  rated,
  topSelling,
}: {
  heading: string;
  rated: Parameters<typeof RatedProductList>[0]["products"];
  topSelling: Parameters<typeof TopProductGrid>[0]["products"];
}) {
  return (
    <section>
      <GroupHeading>{heading}</GroupHeading>
      <div className="grid grid-cols-1 gap-[22px] xl:grid-cols-2">
        <SectionCard title="Most Rated Products" icon={StarIcon} tone="warning" size="sm" action={<ViewAll />}>
          <RatedProductList products={rated} />
        </SectionCard>
        <SectionCard title="Top Selling Products" icon={DollarIcon} size="sm" action={<ViewAll />}>
          <TopProductGrid products={topSelling} />
        </SectionCard>
      </div>
    </section>
  );
}
