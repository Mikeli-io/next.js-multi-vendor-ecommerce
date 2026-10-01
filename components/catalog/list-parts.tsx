import Link from "next/link";
import type { ComponentType, ReactNode } from "react";

import { EmptyState } from "@/components/dashboard/empty-state";
import { ChevronDownIcon, SearchIcon, type IconProps } from "@/components/ui/icons";

/**
 * Server-rendered building blocks shared by the admin catalog lists (brands,
 * categories, sub categories, sub sub categories), following the list design:
 * heading with count badge, search toolbar, card and table frame.
 *
 * Search and filters are plain GET forms and links, so they work before
 * hydration and every filtered view is a shareable URL.
 */

/** Build a list URL from its filters, omitting empty ones. */
export function listHref(path: string, params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
  const qs = query.toString();
  return `${path}${qs ? `?${qs}` : ""}`;
}

export function ListHeading({
  title,
  icon: Icon,
  count,
  action,
}: {
  title: string;
  icon: ComponentType<IconProps>;
  count?: number;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="grid size-9 place-items-center rounded-[10px] bg-iris-50 text-iris-500">
          <Icon size={18} />
        </span>
        <h1 className="font-display text-[24px] font-extrabold leading-none tracking-[-0.01em] text-ink">
          {title}
        </h1>
        {count !== undefined ? (
          <span
            aria-label={`${count} total`}
            className="flex h-[26px] min-w-[30px] items-center justify-center rounded-full bg-track px-[10px] font-display text-[13px] font-bold leading-none text-ink-soft"
          >
            {count}
          </span>
        ) : null}
      </div>
      {action}
    </div>
  );
}

/** The white card a list sits in. */
export function ListCard({ children }: { children: ReactNode }) {
  return (
    <section className="rounded-xl border border-line-soft bg-surface p-4 shadow-xs sm:p-[22px_24px]">
      {children}
    </section>
  );
}

/**
 * Search box (GET form) plus optional filter controls. Controls passed as
 * `inside` are part of the form and submit with it (e.g. a parent select);
 * `beside` sits next to it (e.g. link tabs). `keep` preserves other filters.
 */
export function SearchToolbar({
  action,
  q,
  placeholder,
  keep = {},
  inside,
  beside,
}: {
  action: string;
  q: string;
  placeholder: string;
  keep?: Record<string, string | undefined>;
  inside?: ReactNode;
  beside?: ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-[14px]">
      <form role="search" action={action} className="flex min-w-[240px] flex-1 flex-wrap items-center gap-[14px]">
        <div className="flex h-[46px] min-w-[240px] flex-1 items-center overflow-hidden rounded-[11px] border border-line bg-field transition-[border-color,box-shadow] duration-200 focus-within:border-iris-500 focus-within:shadow-[0_0_0_3px_var(--iris-100)]">
          <span className="px-[14px] text-muted-soft">
            <SearchIcon size={17} />
          </span>
          <label htmlFor={`${action}-search`} className="sr-only">
            {placeholder}
          </label>
          <input
            id={`${action}-search`}
            type="search"
            name="q"
            defaultValue={q}
            maxLength={60}
            placeholder={placeholder}
            className="h-full min-w-0 flex-1 border-none bg-transparent px-1 text-[13.5px] leading-none text-ink outline-none placeholder:text-muted-soft"
          />
          {Object.entries(keep).map(([name, value]) =>
            value ? <input key={name} type="hidden" name={name} value={value} /> : null,
          )}
          <button
            type="submit"
            className="h-full cursor-pointer bg-iris-500 px-[22px] text-[13px] font-semibold leading-none text-surface transition-colors duration-200 hover:bg-iris-600"
          >
            Search
          </button>
        </div>
        {inside}
      </form>
      {beside}
    </div>
  );
}

/** A compact select for list filters (inside a `SearchToolbar` form). */
export function FilterSelect({
  name,
  label,
  value,
  allLabel,
  options,
}: {
  name: string;
  label: string;
  value: string;
  allLabel: string;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  return (
    <label className="relative flex h-[46px] min-w-[200px] items-center">
      <span className="sr-only">{label}</span>
      <select
        name={name}
        defaultValue={value}
        className="h-full w-full cursor-pointer appearance-none rounded-[11px] border border-line bg-surface pl-4 pr-10 text-[13px] font-medium text-ink-soft outline-none transition-[border-color,box-shadow] duration-200 focus:border-iris-500 focus:shadow-[0_0_0_3px_var(--iris-100)]"
      >
        <option value="">{allLabel}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute right-4 text-muted" />
    </label>
  );
}

/** "Showing N of M …" when a filter narrows the list. */
export function ResultCount({ shown, total, noun }: { shown: number; total: number; noun: string }) {
  return (
    <p className="mb-3 text-[12.5px] text-muted" aria-live="polite">
      Showing {shown} of {total} {noun}
    </p>
  );
}

export function NoMatches({ clearHref, noun }: { clearHref: string; noun: string }) {
  return (
    <EmptyState
      icon={SearchIcon}
      title={`No ${noun} match`}
      body="Try a different name, or clear the filters."
      action={
        <Link href={clearHref} className="text-[13.5px] font-semibold">
          Clear filters
        </Link>
      }
    />
  );
}

/**
 * Table frame with a header row. `columns` is the grid template shared with
 * the rows (and their skeleton) so they always line up; the table scrolls
 * horizontally rather than collapsing columns (DESIGN_SYSTEM.md §8 "Table").
 */
export function TableFrame({
  label,
  columns,
  headers,
  minWidth,
  children,
}: {
  label: string;
  columns: string;
  headers: ReadonlyArray<string>;
  minWidth: number;
  children: ReactNode;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-line-soft">
      <div role="table" aria-label={label} style={{ minWidth }}>
        <div
          role="row"
          className={`${columns} bg-field py-[14px] text-[11px] font-semibold uppercase leading-none tracking-[0.04em] text-muted`}
        >
          {headers.map((header, index) => (
            <span
              key={header || index}
              role="columnheader"
              className={index === headers.length - 1 ? "text-right" : undefined}
            >
              {header}
            </span>
          ))}
        </div>
        {children}
      </div>
    </div>
  );
}

/** Row classes shared by every catalog table. */
export const ROW_CLASS = "border-t border-line-soft py-[14px] transition-colors duration-150 hover:bg-bg-subtle";

/** A muted dash for derived values that do not exist yet (product counts). */
export function NotAvailable({ title }: { title: string }) {
  return (
    <span title={title} className="font-normal text-muted-soft">
      —
    </span>
  );
}

/**
 * The list design's loading state: a search-bar placeholder and shimmering
 * rows inside the real table frame, so the layout does not jump on load.
 * `cells` gives each column's placeholder shape.
 */
export function TableSkeleton({
  label,
  columns,
  headers,
  minWidth,
  cells,
  rows = 6,
}: {
  label: string;
  columns: string;
  headers: ReadonlyArray<string>;
  minWidth: number;
  cells: ReadonlyArray<string>;
  rows?: number;
}) {
  return (
    <div aria-busy="true" aria-label={`Loading ${label.toLowerCase()}`}>
      <div className="mb-5 flex flex-wrap gap-[14px]">
        <div className="skeleton h-[46px] min-w-[240px] flex-1 rounded-[11px]" />
        <div className="skeleton h-[46px] w-[200px] rounded-[11px]" />
      </div>
      <TableFrame label={label} columns={columns} headers={headers} minWidth={minWidth}>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className={`${columns} border-t border-line-soft py-4`}>
            {cells.map((cell, j) => (
              <span key={j} className={`skeleton block ${cell}`} />
            ))}
          </div>
        ))}
      </TableFrame>
    </div>
  );
}
