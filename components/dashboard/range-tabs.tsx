"use client";

/**
 * The pill tab group from the design system (DESIGN_SYSTEM.md §8 "Tabs"),
 * in the chart cards' iris-active variant.
 */
export function RangeTabs<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: ReadonlyArray<{ value: T; label: string }>;
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex gap-1 rounded-[11px] bg-line-soft p-1"
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`h-8 cursor-pointer rounded-sm px-[14px] text-[12px] leading-none transition-colors duration-150 ${
              active
                ? "bg-iris-500 font-semibold text-surface"
                : "font-medium text-muted hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
