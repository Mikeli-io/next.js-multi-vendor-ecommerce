import { ListCard, ListHeading, TableSkeleton } from "@/components/catalog/list-parts";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PRODUCT_ICON, PRODUCT_TABLE } from "@/components/products/product-parts";

export default function Loading() {
  return (
    <DashboardShell role="vendor" breadcrumb={[{ label: "Products", href: "/vendor/products" }, { label: "Product List" }]}>
      <ListHeading title="Product List" icon={PRODUCT_ICON} />
      <ListCard>
        <TableSkeleton label="Products" columns={PRODUCT_TABLE.columns} headers={PRODUCT_TABLE.headers} minWidth={PRODUCT_TABLE.minWidth} cells={PRODUCT_TABLE.cells} />
      </ListCard>
    </DashboardShell>
  );
}
