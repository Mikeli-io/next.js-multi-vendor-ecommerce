"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

import { CloseIcon } from "./icons";

/**
 * Modal dialog on the native `<dialog>` element: `showModal()` gives focus
 * trapping, Escape handling, inert background and top-layer stacking for free.
 * Styled per DESIGN_SYSTEM.md §8 — `--r-2xl`, `--shadow-xl`, ink backdrop with
 * a 3px blur — and opens with the subtle `dialog-enter` animation (skipped for
 * reduced-motion users).
 *
 * Mark the element that should receive initial focus with `data-autofocus`.
 *
 * Controlled: the parent owns `open`; Escape, the close button and a backdrop
 * click all call `onClose`. Pass `dismissible={false}` while a submission is
 * in flight so it cannot be closed half-way.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  dismissible = true,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md";
  dismissible?: boolean;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      // showModal() focuses the first focusable element (the close button).
      // Prefer the element the content marks with `data-autofocus` — e.g. the
      // first field, or Cancel in a destructive confirmation.
      dialog.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        // Escape: keep React in control of whether it actually closes.
        event.preventDefault();
        if (dismissible) onClose();
      }}
      onClick={(event) => {
        // A click on the element itself (not its content) is the backdrop.
        if (event.target === event.currentTarget && dismissible) onClose();
      }}
      className={`dialog-enter m-auto w-[calc(100%-32px)] rounded-2xl bg-surface p-0 text-ink-soft shadow-xl backdrop:bg-[rgba(20,18,31,.55)] backdrop:backdrop-blur-[3px] ${
        size === "sm" ? "max-w-[440px]" : "max-w-[560px]"
      }`}
    >
      {open ? (
        <div className="p-6 sm:p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h2
                id={titleId}
                className="font-display text-[20px] font-bold leading-[1.2] tracking-[-0.01em] text-ink"
              >
                {title}
              </h2>
              {description ? (
                <p id={descriptionId} className="mt-2 text-[13.5px] leading-normal text-muted">
                  {description}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={!dismissible}
              aria-label="Close"
              className="grid size-9 flex-none cursor-pointer place-items-center rounded-sm text-muted transition-colors duration-150 hover:bg-field hover:text-ink disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CloseIcon size={18} />
            </button>
          </div>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
