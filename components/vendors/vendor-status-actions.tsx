"use client";

import { useState, useTransition } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { changeVendorStatus } from "@/lib/actions/vendors";
import type { AppVendorStatus } from "@/lib/auth/roles";
import { VENDOR_TRANSITIONS, actionsFor, type VendorStatusAction } from "@/lib/vendors/status";

const COPY: Record<VendorStatusAction, (store: string) => { title: string; body: string; positive: boolean }> = {
  approve: (s) => ({
    title: `Approve "${s}"?`,
    body: "The store goes live and the vendor gets access to their seller dashboard straight away.",
    positive: true,
  }),
  reject: (s) => ({
    title: `Reject "${s}"?`,
    body: "The vendor keeps their account but can't open the seller dashboard; their status screen explains the store wasn't approved. Nothing is deleted, and you can approve it later.",
    positive: false,
  }),
  suspend: (s) => ({
    title: `Suspend "${s}"?`,
    body: "Selling is paused and the vendor loses access to the seller dashboard until you reinstate the store. Nothing is deleted.",
    positive: false,
  }),
  reinstate: (s) => ({
    title: `Reinstate "${s}"?`,
    body: "The store goes live again and the vendor regains access to their seller dashboard.",
    positive: true,
  }),
};

/**
 * The status actions available for a store's current status (see
 * VENDOR_TRANSITIONS), each behind a confirmation. A refusal from the server
 * — e.g. another admin changed the status meanwhile — stays in the dialog.
 */
export function VendorStatusActions({
  id,
  storeName,
  status,
}: {
  id: string;
  storeName: string;
  status: AppVendorStatus;
}) {
  const [action, setAction] = useState<VendorStatusAction | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const available = actionsFor(status);

  if (!available.length) return null;

  function confirm() {
    if (!action) return;
    startTransition(async () => {
      const result = await changeVendorStatus(id, action);
      if (!result.ok) {
        setError(result.formError ?? "That didn't work. Please try again.");
        return;
      }
      toast.success(result.message);
      setAction(null);
    });
  }

  const copy = action ? COPY[action](storeName) : null;

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {available.map((a) => {
          const positive = COPY[a](storeName).positive;
          return (
            <Button
              key={a}
              type="button"
              size="sm"
              variant={positive ? "primary" : "destructive"}
              onClick={() => {
                setError(undefined);
                setAction(a);
              }}
            >
              {VENDOR_TRANSITIONS[a].label}
            </Button>
          );
        })}
      </div>
      <ConfirmDialog
        open={action !== null}
        onClose={() => setAction(null)}
        onConfirm={confirm}
        pending={pending}
        error={error}
        title={copy?.title ?? ""}
        body={copy?.body ?? ""}
        confirmLabel={action ? VENDOR_TRANSITIONS[action].label : ""}
        confirmVariant={copy?.positive ? "primary" : "destructive"}
      />
    </>
  );
}
