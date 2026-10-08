import { BoxIcon, CartIcon, StarIcon, UserIcon } from "@/components/ui/icons";
import { EmptyState } from "./empty-state";

export type RatedProduct = {
  id: string;
  title: string;
  seller: string;
  rating: number;
  reviews: number;
};

export type TopProduct = {
  id: string;
  title: string;
  /** Shown under the title on the admin's vendor-product tiles. */
  seller?: string;
  revenue: string;
  sold: number;
};

export type DeliveryMan = {
  id: string;
  name: string;
  rating: number;
  delivered: number;
};

/** The hatched square the designs use until product photography exists. */
function ProductThumb({ className }: { className: string }) {
  return (
    <div className={`relative flex-none overflow-hidden bg-field ${className}`}>
      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(20,18,31,.022)_0_8px,transparent_8px_16px)]" />
    </div>
  );
}

/** "Most Rated Products" rows. Every row names its seller (PRD §3, rule 1). */
export function RatedProductList({
  products,
  sellerPrefix = "Sold by",
}: {
  products: RatedProduct[];
  sellerPrefix?: string;
}) {
  if (!products.length) {
    return (
      <EmptyState
        icon={StarIcon}
        title="No rated products yet"
        body="Products appear here once customers start leaving reviews."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {products.map((p) => (
        <li
          key={p.id}
          className="flex items-center gap-[14px] rounded-lg border border-line-soft p-3 transition-colors duration-150 hover:bg-bg-subtle"
        >
          <ProductThumb className="size-[52px] rounded-[12px]" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-semibold leading-[1.3] text-ink">
              {p.title}
            </p>
            <p className="mt-[6px] text-[11px] leading-none text-iris-500">
              {sellerPrefix} {p.seller}
            </p>
            <div className="mt-2 flex items-center gap-[6px]">
              <StarIcon size={13} className="text-star" />
              <span className="font-display text-[12.5px] font-bold leading-none text-ink">
                {p.rating.toFixed(1)}
              </span>
              <span className="text-[12px] leading-none text-muted-soft">
                ({p.reviews} Reviews)
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * "Top Selling Products" tiles. The vendor's variant uses a solid sold-count
 * pill in a three-up grid; the admin's a soft pill in a two-up grid.
 */
export function TopProductGrid({
  products,
  variant = "soft",
}: {
  products: TopProduct[];
  variant?: "solid" | "soft";
}) {
  if (!products.length) {
    return (
      <EmptyState
        icon={BoxIcon}
        title="No sales yet"
        body="Best-selling products show here as orders come in."
      />
    );
  }

  return (
    <ul
      className={`grid grid-cols-2 gap-[14px] ${
        variant === "solid" ? "@2xl:grid-cols-3" : ""
      }`}
    >
      {products.map((p) => (
        <li
          key={p.id}
          className="rounded-lg border border-line-soft p-3 text-center transition-shadow duration-200 hover:shadow-tile sm:p-[14px]"
        >
          <ProductThumb className="mb-[10px] aspect-square w-full rounded-[10px]" />
          <p className="min-h-8 text-[12.5px] font-semibold leading-[1.3] text-ink">
            {p.title}
          </p>
          {p.seller ? (
            <p className="mt-[6px] text-[10.5px] leading-none text-iris-500">
              {p.seller}
            </p>
          ) : null}
          <p className="mb-1 mt-2 text-[11px] leading-none text-muted-soft">
            Total Sold Price
          </p>
          <p className="mb-[10px] font-display text-[14px] font-bold leading-none text-ink">
            {p.revenue}
          </p>
          {variant === "solid" ? (
            <span className="inline-flex items-center gap-[6px] rounded-full bg-iris-500 px-3 py-[6px] text-[11px] font-semibold leading-none text-surface">
              Sold: {p.sold}
              <CartIcon size={13} />
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-iris-50 px-3 py-[5px] text-[11px] font-semibold leading-none text-iris-700">
              Sold : {p.sold}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** "Top Delivery Man" cards, shared by the vendor and admin dashboards. */
export function DeliveryManGrid({
  people,
  columns = "auto",
}: {
  people: DeliveryMan[];
  columns?: "auto" | "two";
}) {
  if (!people.length) {
    return (
      <EmptyState
        icon={UserIcon}
        title="No deliveries yet"
        body="Delivery partners are ranked here once orders start shipping."
      />
    );
  }

  return (
    <ul
      className={`grid gap-4 ${
        columns === "two"
          ? "grid-cols-1 @sm:grid-cols-2"
          : "grid-cols-[repeat(auto-fill,minmax(200px,1fr))]"
      }`}
    >
      {people.map((d) => (
        <li
          key={d.id}
          className="rounded-lg border border-line-soft p-5 text-center transition-shadow duration-200 hover:shadow-tile"
        >
          <span className="mx-auto mb-[14px] grid size-[64px] place-items-center rounded-full bg-[linear-gradient(135deg,var(--iris-100),var(--iris-50))] text-iris-400">
            <UserIcon size={30} strokeWidth={1.7} />
          </span>
          <p className="font-display text-[14px] font-bold leading-none text-ink">
            {d.name}
          </p>
          <p className="mt-[10px] flex items-center justify-center gap-[5px] text-[12px] leading-none text-muted">
            Rating:{" "}
            <span className="font-semibold text-ink">{d.rating.toFixed(1)}</span>
            <StarIcon size={12} className="text-star" />
          </p>
          <p className="mt-2 text-[12px] leading-none text-muted">
            Orders Delivered:{" "}
            <span className="font-semibold text-ink">{d.delivered}</span>
          </p>
        </li>
      ))}
    </ul>
  );
}
