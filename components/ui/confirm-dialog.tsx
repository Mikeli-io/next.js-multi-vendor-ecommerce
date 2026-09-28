"use client";

import type { ReactNode } from "react";

import { Button } from "./button";
import { Dialog } from "./dialog";
import { FormAlert } from "./form-alert";

/**
 * A yes/no confirmation built on `Dialog`. The parent runs the action and
 * passes back `pending` and any `error`, so the dialog stays open (and shows
 * the reason) when the action is refused.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  body,
  confirmLabel,
  pending = false,
  error,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  pending?: boolean;
  error?: string;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title} size="sm" dismissible={!pending}>
      <div className="text-[14px] leading-normal text-muted">{body}</div>
      <div className="mt-5">
        <FormAlert message={error} />
      </div>
      <div className="mt-1 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        {/* Destructive confirmations start on the safe choice. */}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onClose}
          disabled={pending}
          data-autofocus
        >
          Cancel
        </Button>
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={onConfirm}
          disabled={pending}
        >
          {pending ? "Working..." : confirmLabel}
        </Button>
      </div>
    </Dialog>
  );
}
