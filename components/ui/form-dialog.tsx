"use client";

import { useState, useTransition, type ReactNode } from "react";
import toast from "react-hot-toast";

import { Button } from "./button";
import { Dialog } from "./dialog";

import type { FormActionResult } from "@/lib/actions/form-result";

export type { FormActionResult };

export type FormDialogContext = {
  pending: boolean;
  /**
   * Run a Server Action. Success shows a toast and closes the dialog; failure
   * hands the result back so the form can show it — the dialog stays open and
   * the entered values are kept.
   */
  run: (action: () => Promise<FormActionResult>, onFail: (result: Extract<FormActionResult, { ok: false }>) => void) => void;
  close: () => void;
};

/**
 * A modal form shell shared by every admin create/edit form. It owns the
 * pending state (so the dialog cannot be dismissed mid-submit) and the
 * success flow; the form inside owns its own fields.
 *
 * `children` is rendered only while open, so each opening starts from the
 * values the form initialises with — no reset effects needed.
 */
export function FormDialog({
  open,
  onClose,
  title,
  description,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: (context: FormDialogContext) => ReactNode;
}) {
  const [pending, startTransition] = useTransition();

  const run: FormDialogContext["run"] = (action, onFail) => {
    if (pending) return; // no duplicate submissions
    startTransition(async () => {
      const result = await action();
      if (result.ok) {
        toast.success(result.message);
        onClose();
      } else {
        onFail(result);
      }
    });
  };

  return (
    <Dialog open={open} onClose={onClose} dismissible={!pending} title={title} description={description}>
      {children({ pending, run, close: onClose })}
    </Dialog>
  );
}

/** Cancel + submit row at the bottom of a `FormDialog` form. */
export function FormDialogFooter({
  pending,
  onCancel,
  submitLabel,
  pendingLabel,
}: {
  pending: boolean;
  onCancel: () => void;
  submitLabel: string;
  pendingLabel: string;
}) {
  return (
    <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
      <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={pending}>
        Cancel
      </Button>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? pendingLabel : submitLabel}
      </Button>
    </div>
  );
}

/**
 * Per-field error state with the "a correction clears its stale message"
 * behaviour every form wants.
 */
export function useFieldErrors() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  function clear(name: string) {
    setFieldErrors((errors) => {
      if (!errors[name]) return errors;
      const next = { ...errors };
      delete next[name];
      return next;
    });
  }

  function set(name: string, messages: string[] | undefined) {
    setFieldErrors((errors) => {
      const next = { ...errors };
      if (messages?.length) next[name] = messages;
      else delete next[name];
      return next;
    });
  }

  return { fieldErrors, setFieldErrors, clear, set };
}
