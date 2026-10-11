"use client";

import { useOptimistic, useState, useTransition } from "react";
import toast from "react-hot-toast";
import type { ProductApprovalStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CheckCircleIcon, XCircleIcon } from "@/components/ui/icons";
import { Switch } from "@/components/ui/switch";
import { setProductApproval, setProductMerchandising } from "@/lib/actions/admin-products";
import type { MerchandisingFlag } from "@/lib/validation/admin-product";

type Decision = "APPROVED" | "REJECTED";

const COPY: Record<Decision, (name: string, featured: boolean) => { title: string; body: string; label: string }> = {
  APPROVED: (name) => ({
    title: `Approve "${name}"?`,
    body: "The product passes review. Customers will be able to see it while the vendor keeps it active.",
    label: "Approve",
  }),
  REJECTED: (name, merchandised) => ({
    title: `Reject "${name}"?`,
    body: `The product won't be shown to customers.${merchandised ? " It will also stop being Featured / Popular." : ""} Nothing is deleted, and you can approve it later.`,
    label: "Reject",
  }),
};

/**
 * The details page's review buttons, after the design's Denied / Approve pair.
 * Only the moves the current status allows are offered; the Server Action
 * re-checks ADMIN and the transition.
 */
export function ProductReviewActions({
  id,
  name,
  status,
  merchandised,
}: {
  id: string;
  name: string;
  status: ProductApprovalStatus;
  /** Featured or Popular — rejecting clears both. */
  merchandised: boolean;
}) {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const copy = decision ? COPY[decision](name, merchandised) : null;

  function confirm() {
    if (!decision) return;
    startTransition(async () => {
      const result = await setProductApproval(id, decision);
      if (!result.ok) {
        setError(result.formError);
        return;
      }
      toast.success(result.message);
      setDecision(null);
    });
  }

  const open = (d: Decision) => {
    setError(undefined);
    setDecision(d);
  };

  return (
    <div className="flex flex-wrap items-center gap-[10px]">
      {status !== "REJECTED" ? (
        <Button type="button" variant="destructive" onClick={() => open("REJECTED")}>
          <XCircleIcon size={16} />
          Reject
        </Button>
      ) : null}
      {status !== "APPROVED" ? (
        <Button type="button" onClick={() => open("APPROVED")} className="bg-success-solid hover:bg-success-solid/90">
          <CheckCircleIcon size={16} />
          {status === "REJECTED" ? "Re-approve" : "Approve"}
        </Button>
      ) : null}
      <ConfirmDialog
        open={decision !== null}
        onClose={() => !pending && setDecision(null)}
        onConfirm={confirm}
        title={copy?.title ?? ""}
        body={copy?.body ?? ""}
        confirmLabel={copy?.label ?? ""}
        confirmVariant={decision === "APPROVED" ? "primary" : "destructive"}
        pending={pending}
        error={error}
      />
    </div>
  );
}

/** One Featured / Popular switch. Disabled unless the product is APPROVED (the server enforces it too). */
export function MerchandisingSwitch({
  id,
  flag,
  label,
  description,
  value,
  approved,
}: {
  id: string;
  flag: MerchandisingFlag;
  label: string;
  description: string;
  value: boolean;
  approved: boolean;
}) {
  const [optimistic, setOptimistic] = useOptimistic(value);
  const [pending, startTransition] = useTransition();

  function toggle(next: boolean) {
    startTransition(async () => {
      setOptimistic(next);
      const result = await setProductMerchandising(id, flag, next);
      if (result.ok) toast.success(result.message);
      else toast.error(result.formError ?? "Couldn't change the setting.");
    });
  }

  return (
    <div className={`flex items-center justify-between gap-4 rounded-[12px] border border-line-soft px-4 py-3 ${approved ? "" : "opacity-60"}`}>
      <div className="min-w-0">
        <p className="text-[13.5px] font-semibold text-ink">{label}</p>
        <p className="mt-1 text-[12px] leading-[1.4] text-muted">{approved ? description : "Available once the product is approved."}</p>
      </div>
      <Switch checked={optimistic} onChange={toggle} disabled={pending || !approved} label={`${label}: ${optimistic ? "on" : "off"}`} />
    </div>
  );
}
