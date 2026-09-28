"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import toast from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EyeIcon, PlusIcon, TrashIcon, EditIcon } from "@/components/ui/icons";
import { Switch } from "@/components/ui/switch";
import { deleteBrand, toggleBrandStatus } from "@/lib/actions/brands";
import type { BrandStatusValue } from "@/lib/validation/brand";
import { BrandFormDialog, type EditableBrand } from "./brand-form-dialog";

/**
 * Interactive brand controls. Each owns just the state it needs, so the list
 * and details pages stay Server Components and compose these where required.
 */

/** 32px tinted square action buttons, as in the list design's action column. */
const ACTION = {
  view: "border-success-bg bg-success-bg/60 text-success-solid hover:bg-success-bg",
  edit: "border-iris-100 bg-iris-50 text-iris-500 hover:bg-iris-100",
  delete: "border-error/15 bg-error-bg text-error-solid hover:bg-error/15",
} as const;

function actionClass(kind: keyof typeof ACTION) {
  return `grid size-8 cursor-pointer place-items-center rounded-sm border transition-colors duration-150 ${ACTION[kind]}`;
}

export function AddBrandButton({ label = "Add Brand" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)} className="whitespace-nowrap">
        <PlusIcon size={16} />
        {label}
      </Button>
      <BrandFormDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function EditBrandButton({
  brand,
  variant = "icon",
}: {
  brand: EditableBrand;
  variant?: "icon" | "button";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Edit ${brand.name}`}
          title="Edit"
          className={actionClass("edit")}
        >
          <EditIcon size={15} />
        </button>
      ) : (
        <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
          <EditIcon size={15} />
          Edit
        </Button>
      )}
      <BrandFormDialog open={open} onClose={() => setOpen(false)} brand={brand} />
    </>
  );
}

/**
 * Delete with confirmation. A refusal (e.g. the brand is used by products)
 * keeps the dialog open and shows the server's explanation.
 */
export function DeleteBrandButton({
  id,
  name,
  variant = "icon",
  redirectTo,
}: {
  id: string;
  name: string;
  variant?: "icon" | "button";
  /** Where to go afterwards — needed on the details page, whose brand is gone. */
  redirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const result = await deleteBrand(id);
      if (!result.ok) {
        setError(result.formError ?? "This brand couldn't be deleted.");
        return;
      }
      toast.success(result.message);
      setOpen(false);
      if (redirectTo) router.push(redirectTo);
    });
  }

  function openDialog() {
    setError(undefined);
    setOpen(true);
  }

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={openDialog}
          aria-label={`Delete ${name}`}
          title="Delete"
          className={actionClass("delete")}
        >
          <TrashIcon size={15} />
        </button>
      ) : (
        <Button type="button" variant="destructive" size="sm" onClick={openDialog}>
          <TrashIcon size={15} />
          Delete
        </Button>
      )}
      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={confirm}
        pending={pending}
        error={error}
        title={`Delete "${name}"?`}
        body={
          <>
            This permanently removes <span className="font-semibold text-ink">{name}</span> and
            its logo. This can&apos;t be undone.
          </>
        }
        confirmLabel="Delete brand"
      />
    </>
  );
}

/**
 * Inline ACTIVE / INACTIVE switch. Flips optimistically, persists through the
 * Server Action, and snaps back (with a toast) if the server refuses.
 */
export function BrandStatusToggle({
  id,
  name,
  status,
}: {
  id: string;
  name: string;
  status: BrandStatusValue;
}) {
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [pending, startTransition] = useTransition();
  const active = optimistic === "ACTIVE";

  function toggle() {
    startTransition(async () => {
      setOptimistic(active ? "INACTIVE" : "ACTIVE");
      const result = await toggleBrandStatus(id);
      if (result.ok) toast.success(result.message);
      else toast.error(result.formError ?? "Couldn't change the status.");
    });
  }

  return (
    <div className="flex items-center gap-3">
      <Switch
        checked={active}
        onChange={toggle}
        disabled={pending}
        label={`${name} is ${active ? "active" : "inactive"}`}
      />
      <Badge tone={active ? "success" : "neutral"}>{active ? "Active" : "Inactive"}</Badge>
    </div>
  );
}

/** View · Edit · Delete for one table row. */
export function BrandRowActions({ brand }: { brand: EditableBrand }) {
  return (
    <div className="flex justify-end gap-[7px]">
      <Link
        href={`/admin/brands/${brand.id}`}
        aria-label={`View ${brand.name}`}
        title="View"
        className={actionClass("view")}
      >
        <EyeIcon size={15} />
      </Link>
      <EditBrandButton brand={brand} />
      <DeleteBrandButton id={brand.id} name={brand.name} />
    </div>
  );
}
