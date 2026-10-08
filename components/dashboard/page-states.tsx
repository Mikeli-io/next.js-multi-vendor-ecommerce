import type { ReactNode } from "react";

import { AlertTriangleIcon, ReturnIcon } from "@/components/ui/icons";
import { EmptyState } from "./empty-state";

/** "Welcome …" heading row with an optional action, as in both designs. */
export function PageHeading({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-display text-[22px] font-extrabold leading-[1.1] tracking-[-0.01em] text-ink sm:text-[26px]">
          {title}
        </h1>
        <p className="mt-3 text-[14px] leading-[1.4] text-muted">{subtitle}</p>
      </div>
      {action}
    </div>
  );
}

/**
 * The designs' "Loading" preview state, used by `loading.tsx`: a heading
 * placeholder, a block of stat tiles, then two panel-sized blocks.
 */
export function DashboardSkeleton({
  tiles,
  tileHeight,
  panels,
}: {
  tiles: number;
  tileHeight: number;
  panels: number[];
}) {
  return (
    <div aria-busy="true" aria-label="Loading dashboard" className="flex flex-col gap-[22px]">
      <div className="flex flex-col gap-3">
        <div className="skeleton h-[26px] w-64 max-w-full rounded-[7px]" />
        <div className="skeleton h-[14px] w-80 max-w-full rounded-[6px]" />
      </div>
      <div className="grid grid-cols-1 gap-[14px] sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: tiles }, (_, i) => (
          <div key={i} className="skeleton rounded-lg" style={{ height: tileHeight }} />
        ))}
      </div>
      {panels.map((height, i) => (
        <div key={i} className="skeleton rounded-xl" style={{ height }} />
      ))}
    </div>
  );
}

/** The designs' "Error" preview state, used by `error.tsx`. */
export function DashboardError({
  title,
  body,
  onRetry,
}: {
  title: string;
  body: string;
  onRetry: () => void;
}) {
  return (
    <EmptyState
      variant="panel"
      tone="error"
      icon={AlertTriangleIcon}
      title={title}
      body={body}
      action={
        <button
          type="button"
          onClick={onRetry}
          className="flex h-[46px] cursor-pointer items-center gap-2 rounded-[12px] bg-iris-500 px-6 text-[13.5px] font-semibold leading-none text-surface transition-colors duration-200 hover:bg-iris-600"
        >
          <ReturnIcon size={16} />
          Try again
        </button>
      }
    />
  );
}
