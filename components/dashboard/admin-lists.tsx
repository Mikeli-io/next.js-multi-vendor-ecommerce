import {
  CartIcon,
  HeartFilledIcon,
  ShopFrontIcon,
  UserIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { EmptyState } from "./empty-state";

export type TopCustomer = {
  id: string;
  name: string;
  maskedEmail: string;
  orders: number;
};

export type StoreSummary = {
  id: string;
  name: string;
  /** Pre-formatted: a like count for "popular", a revenue for "top selling". */
  metric: string;
};

/** Admin "Top Customers" rows. */
export function TopCustomerList({ customers }: { customers: TopCustomer[] }) {
  if (!customers.length) {
    return (
      <EmptyState
        icon={UsersIcon}
        title="No customer orders yet"
        body="Customers are ranked here by the number of orders they place."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-[10px]">
      {customers.map((c) => (
        <li
          key={c.id}
          className="flex items-center gap-[14px] rounded-lg border border-line-soft p-3 transition-colors duration-150 hover:bg-bg-subtle"
        >
          <span className="grid size-11 flex-none place-items-center rounded-full bg-[linear-gradient(135deg,var(--iris-100),var(--iris-50))] text-iris-400">
            <UserIcon size={22} strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-semibold leading-[1.2] text-ink">
              {c.name}
            </p>
            <p className="mt-[6px] truncate text-[11.5px] leading-none text-muted-soft">
              {c.maskedEmail}
            </p>
          </div>
          <span className="whitespace-nowrap rounded-full bg-iris-50 px-3 py-[6px] text-[11px] font-semibold leading-none text-iris-700">
            Orders : {c.orders}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Admin store tiles, in two flavours: "popular" shows likes behind a heart,
 * "top selling" shows revenue behind a cart.
 */
export function StoreGrid({
  stores,
  kind,
}: {
  stores: StoreSummary[];
  kind: "popular" | "top-selling";
}) {
  if (!stores.length) {
    return (
      <EmptyState
        icon={ShopFrontIcon}
        title={kind === "popular" ? "No store favourites yet" : "No store sales yet"}
        body={
          kind === "popular"
            ? "Stores appear here as shoppers start following them."
            : "Stores are ranked here by revenue once orders come in."
        }
      />
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-[14px] @sm:grid-cols-2">
      {stores.map((s) => (
        <li
          key={s.id}
          className="flex items-center gap-3 rounded-lg border border-line-soft p-[14px] transition-colors duration-150 hover:bg-bg-subtle"
        >
          <span className="grid size-11 flex-none place-items-center rounded-[12px] bg-[linear-gradient(135deg,var(--iris-100),var(--iris-50))] text-iris-500">
            <ShopFrontIcon size={22} strokeWidth={1.7} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13.5px] font-semibold leading-[1.2] text-ink">
              {s.name}
            </p>
            {kind === "popular" ? (
              <p className="mt-[6px] flex items-center gap-1 text-[12px] leading-none text-muted">
                <HeartFilledIcon size={12} className="text-error-solid" />
                {s.metric}
              </p>
            ) : (
              <p className="mt-[6px] flex items-center gap-[5px] font-display text-[12.5px] font-bold leading-none text-iris-500">
                <CartIcon size={13} />
                {s.metric}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
