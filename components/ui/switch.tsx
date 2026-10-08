"use client";

/**
 * Toggle switch per DESIGN_SYSTEM.md §8: 38×22 pill, iris track with the knob
 * right when on, `--toggle-off` track when off.
 */
export function Switch({
  checked,
  onChange,
  label,
  disabled = false,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Accessible name; the switch has no visible text of its own. */
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`inline-flex h-[22px] w-[38px] flex-none cursor-pointer items-center rounded-full p-[2px] transition-colors duration-200 disabled:cursor-wait disabled:opacity-60 ${
        checked ? "justify-end bg-iris-500" : "justify-start bg-toggle-off"
      }`}
    >
      <span className="size-[18px] rounded-full bg-surface shadow-xs" />
    </button>
  );
}
