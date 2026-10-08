import { useId, type ComponentProps } from "react";

import { ChevronDownIcon } from "./icons";

/**
 * A native `<select>` styled like `Field`: same height, radius, fill, border
 * and focus ring, with the design system's custom chevron (DESIGN_SYSTEM.md §8
 * "Selects use a custom chevron"). Native, so it stays keyboard- and
 * screen-reader-friendly with no extra code.
 */
export function SelectField({
  label,
  errors,
  options,
  placeholder,
  showRequiredMark,
  hint,
  className,
  ...props
}: Omit<ComponentProps<"select">, "children"> & {
  label: string;
  errors?: string[];
  options: ReadonlyArray<{ value: string; label: string }>;
  /** Shown as the empty first option. */
  placeholder: string;
  showRequiredMark?: boolean;
  hint?: string;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const hasError = Boolean(errors?.length);

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-[9px] block text-[13px] font-semibold leading-none text-ink-soft">
        {label} {showRequiredMark ? <span className="text-error">*</span> : null}
      </label>
      <div className="relative">
        <select
          {...props}
          id={id}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : hint ? `${id}-hint` : undefined}
          className={`h-[50px] w-full cursor-pointer appearance-none rounded-[12px] border bg-bg-subtle pl-[15px] pr-11 text-[14px] text-ink outline-none transition-[border-color,background-color] duration-200 focus:bg-surface disabled:cursor-not-allowed disabled:text-muted-soft ${
            hasError ? "border-error" : "border-line field-focus"
          }`}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          size={16}
          className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted"
        />
      </div>
      {hasError ? (
        <p id={errorId} className="mt-[7px] text-[12px] leading-[1.4] text-error">
          {errors?.[0]}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-[7px] text-[12px] leading-[1.4] text-muted-soft">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
