"use client";

import { useId, useState, type ComponentProps, type ReactNode } from "react";

import { EyeIcon, EyeOffIcon, InfoIcon } from "./icons";

/**
 * Form controls matching the auth designs: 50px tall, 12px radius, inset
 * `--bg-subtle` fill, `--line` hairline, and the design system's focus ring
 * (iris border + 3px iris-100 halo) applied to the wrapper.
 */

const LABEL = "block text-[13px] font-semibold leading-none text-ink-soft";

// Focus: neutral border via the shared `field-focus-within` utility.
const RING = "field-focus-within";

function shellClasses(hasError: boolean) {
  // An invalid field keeps its red border while focused.
  return `flex h-[50px] items-center overflow-hidden rounded-[12px] border bg-bg-subtle transition-[border-color,background-color] duration-200 focus-within:bg-surface ${
    hasError ? "border-error" : `border-line ${RING}`
  }`;
}

const INPUT =
  "min-w-0 flex-1 border-none bg-transparent px-[15px] text-[14px] leading-none text-ink outline-none placeholder:text-muted-soft";

function ErrorText({ id, errors }: { id: string; errors?: string[] }) {
  if (!errors?.length) return null;
  return (
    <p id={id} className="mt-[7px] text-[12px] leading-[1.4] text-error">
      {errors[0]}
    </p>
  );
}

function RequiredMark() {
  return <span className="text-error">*</span>;
}

/** The designs' ⓘ after a label: a short explanation on hover and for screen readers. */
function LabelInfo({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <span title={text} className="inline-flex h-[13px] items-center align-top text-muted-soft">
      <InfoIcon />
      <span className="sr-only">({text})</span>
    </span>
  );
}

function HintText({ id, hint }: { id: string; hint?: string }) {
  if (!hint) return null;
  return (
    <p id={id} className="mt-[7px] text-[12px] leading-[1.4] text-muted-soft">
      {hint}
    </p>
  );
}

type FieldProps = ComponentProps<"input"> & {
  label: string;
  errors?: string[];
  /** Renders the design's red asterisk next to the label. */
  showRequiredMark?: boolean;
  /** Optional control rendered at the right end of the label row. */
  labelAside?: ReactNode;
  /** Muted helper text under the control, shown when there is no error. */
  hint?: string;
  /** Explanation behind the design's ⓘ icon after the label. */
  info?: string;
};

export function Field({
  label,
  errors,
  showRequiredMark,
  labelAside,
  hint,
  info,
  className,
  ...props
}: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hasError = Boolean(errors?.length);

  return (
    <div className={className}>
      <div className="mb-[9px] flex items-center justify-between gap-3">
        <label htmlFor={id} className={LABEL}>
          {label} {showRequiredMark ? <RequiredMark /> : null} <LabelInfo text={info} />
        </label>
        {labelAside}
      </div>
      <div className={shellClasses(hasError)}>
        <input
          {...props}
          id={id}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : hint ? `${id}-hint` : undefined}
          className={`${INPUT} read-only:text-muted`}
        />
      </div>
      <ErrorText id={errorId} errors={errors} />
      {hasError ? null : <HintText id={`${id}-hint`} hint={hint} />}
    </div>
  );
}

/**
 * Multi-line text with a character counter under it (the Add New Vendor
 * design's shop address). Controlled, since the counter tracks the value.
 */
export function TextAreaField({
  label,
  errors,
  showRequiredMark,
  className,
  value,
  maxLength,
  rows = 2,
  ...props
}: Omit<ComponentProps<"textarea">, "value"> & {
  label: string;
  errors?: string[];
  showRequiredMark?: boolean;
  value: string;
  maxLength: number;
}) {
  const id = useId();
  const errorId = `${id}-error`;
  const hasError = Boolean(errors?.length);

  return (
    <div className={className}>
      <label htmlFor={id} className={`${LABEL} mb-[9px]`}>
        {label} {showRequiredMark ? <RequiredMark /> : null}
      </label>
      <textarea
        {...props}
        id={id}
        rows={rows}
        value={value}
        maxLength={maxLength}
        aria-invalid={hasError || undefined}
        aria-describedby={hasError ? errorId : undefined}
        className={`block w-full resize-y rounded-[12px] border bg-bg-subtle px-[15px] py-[14px] text-[14px] leading-[1.45] text-ink outline-none transition-[border-color,background-color] duration-200 placeholder:text-muted-soft focus:bg-surface ${
          hasError ? "border-error" : "field-focus border-line"
        }`}
      />
      <div className="mt-[7px] flex items-start justify-between gap-3">
        {hasError ? (
          <p id={errorId} className="text-[12px] leading-[1.4] text-error">
            {errors?.[0]}
          </p>
        ) : null}
        <span className="ml-auto text-[12px] leading-[1.4] text-muted-soft">
          {value.length}/{maxLength}
        </span>
      </div>
    </div>
  );
}

/**
 * The design's password control. The eye is a real toggle backed by React
 * state rather than the mockup's static icon.
 */
export function PasswordField({
  label,
  errors,
  showRequiredMark,
  labelAside,
  hint,
  info,
  className,
  ...props
}: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hasError = Boolean(errors?.length);
  const [visible, setVisible] = useState(false);

  return (
    <div className={className}>
      <div className="mb-[9px] flex items-center justify-between gap-3">
        <label htmlFor={id} className={LABEL}>
          {label} {showRequiredMark ? <RequiredMark /> : null} <LabelInfo text={info} />
        </label>
        {labelAside}
      </div>
      <div className={shellClasses(hasError)}>
        <input
          {...props}
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : hint ? `${id}-hint` : undefined}
          className={INPUT}
        />
        <button
          type="button"
          onClick={() => setVisible((shown) => !shown)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="flex h-full items-center px-[14px] text-muted-soft transition-colors duration-200 hover:text-ink-soft"
        >
          {visible ? <EyeIcon /> : <EyeOffIcon />}
        </button>
      </div>
      <ErrorText id={errorId} errors={errors} />
      {hasError ? null : <HintText id={`${id}-hint`} hint={hint} />}
    </div>
  );
}

/** The checkbox box itself, for custom rows that need the design's checkbox (e.g. list pickers). */
export const CHECKBOX_INPUT =
  "size-[19px] flex-none cursor-pointer appearance-none rounded-[6px] border-[1.5px] border-[#D6D4DD] bg-surface bg-[length:12px_12px] bg-center bg-no-repeat transition-colors duration-200 checked:border-iris-500 checked:bg-iris-500 checked:bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22white%22 stroke-width=%223%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%2220 6 9 17 4 12%22/></svg>')] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-muted";

/** The design's square checkbox, driven by a real input rather than a span. */
export function Checkbox({
  label,
  errors,
  ...props
}: Omit<ComponentProps<"input">, "type"> & {
  label: ReactNode;
  errors?: string[];
}) {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div>
      <div className="flex items-start gap-[10px]">
        <input
          {...props}
          id={id}
          type="checkbox"
          aria-describedby={errors?.length ? errorId : undefined}
          className={`mt-[1px] ${CHECKBOX_INPUT}`}
        />
        <label
          htmlFor={id}
          className="cursor-pointer text-[12.5px] leading-[1.5] text-muted"
        >
          {label}
        </label>
      </div>
      <ErrorText id={errorId} errors={errors} />
    </div>
  );
}
