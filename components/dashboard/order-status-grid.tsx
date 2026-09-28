import type { ComponentType } from "react";

import {
  AlertCircleIcon,
  BoxIcon,
  CheckCircleIcon,
  ClockIcon,
  DeliveredIcon,
  type IconProps,
  ReturnIcon,
  TruckIcon,
  XCircleIcon,
} from "@/components/ui/icons";
import { TONE_CHIP, type Tone } from "./section-card";

/** The order lifecycle from PRD §5.3, in the order the designs lay it out. */
export type OrderStatusCounts = {
  pending: number;
  confirmed: number;
  packaging: number;
  outForDelivery: number;
  delivered: number;
  canceled: number;
  returned: number;
  failed: number;
};

const STATUSES: ReadonlyArray<{
  key: keyof OrderStatusCounts;
  label: string;
  icon: ComponentType<IconProps>;
  tone: Tone;
  /** Figures for good and bad outcomes are coloured; the rest stay ink. */
  figure: string;
}> = [
  { key: "pending", label: "Pending", icon: ClockIcon, tone: "info", figure: "text-ink" },
  { key: "confirmed", label: "Confirmed", icon: CheckCircleIcon, tone: "success", figure: "text-success-solid" },
  { key: "packaging", label: "Packaging", icon: BoxIcon, tone: "warning", figure: "text-ink" },
  { key: "outForDelivery", label: "Out For Delivery", icon: TruckIcon, tone: "iris", figure: "text-ink" },
  { key: "delivered", label: "Delivered", icon: DeliveredIcon, tone: "success", figure: "text-success-solid" },
  { key: "canceled", label: "Canceled", icon: XCircleIcon, tone: "error", figure: "text-ink" },
  { key: "returned", label: "Returned", icon: ReturnIcon, tone: "info", figure: "text-ink" },
  { key: "failed", label: "Failed To Deliver", icon: AlertCircleIcon, tone: "error", figure: "text-error-solid" },
];

// The warning chip reads better with the deeper warning foreground here.
const CHIP: Record<Tone, string> = { ...TONE_CHIP, warning: "bg-warning-bg text-warning" };

/**
 * The eight order-status tiles shared by the vendor and admin dashboards.
 * `tile` is the vendor's larger tinted variant; `compact` is the admin's.
 */
export function OrderStatusGrid({
  counts,
  variant = "tile",
}: {
  counts: OrderStatusCounts;
  variant?: "tile" | "compact";
}) {
  const tile = variant === "tile";

  return (
    <div className="grid grid-cols-1 gap-[14px] @md:grid-cols-2 @3xl:grid-cols-4">
      {STATUSES.map(({ key, label, icon: Icon, tone, figure }) => (
        <div
          key={key}
          className={
            tile
              ? "flex items-center gap-[13px] rounded-lg border border-line-soft bg-bg-subtle p-4 transition-shadow duration-200 hover:shadow-tile"
              : "flex items-center gap-[11px] rounded-[12px] border border-line-soft bg-surface px-4 py-[14px]"
          }
        >
          <span
            className={`grid flex-none place-items-center rounded-[11px] ${
              tile ? "size-10" : "size-9"
            } ${CHIP[tone]}`}
          >
            <Icon size={18} strokeWidth={1.9} />
          </span>
          <span
            className={`flex-1 text-[12.5px] leading-[1.2] ${
              tile ? "text-muted" : "font-medium text-ink-soft"
            }`}
          >
            {label}
          </span>
          <span
            className={`font-display leading-none ${figure} ${
              tile ? "text-[20px] font-extrabold" : "text-[16px] font-bold"
            }`}
          >
            {counts[key]}
          </span>
        </div>
      ))}
    </div>
  );
}
