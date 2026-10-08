"use client";

import { useOptimistic, useState, useTransition } from "react";
import toast from "react-hot-toast";

import {
  DeleteButton,
  EditTrigger,
  RowActions,
  ViewAction,
} from "@/components/catalog/row-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "@/components/ui/icons";
import { Switch } from "@/components/ui/switch";
import { deleteBrand, toggleBrandStatus } from "@/lib/actions/brands";
import type { BrandStatusValue } from "@/lib/validation/brand";
import { BrandFormDialog, type EditableBrand } from "./brand-form-dialog";

/**
 * Interactive brand controls. Each owns just the state it needs, so the list
 * and details pages stay Server Components and compose these where required.
 */

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
      <EditTrigger label={`Edit ${brand.name}`} variant={variant} onClick={() => setOpen(true)} />
      <BrandFormDialog open={open} onClose={() => setOpen(false)} brand={brand} />
    </>
  );
}

/** Delete with confirmation; refusals keep the dialog open with the reason. */
export function DeleteBrandButton({
  id,
  name,
  variant = "icon",
  redirectTo,
}: {
  id: string;
  name: string;
  variant?: "icon" | "button";
  redirectTo?: string;
}) {
  return (
    <DeleteButton
      id={id}
      name={name}
      noun="brand"
      onDelete={deleteBrand}
      variant={variant}
      redirectTo={redirectTo}
      body={
        <>
          This permanently removes <span className="font-semibold text-ink">{name}</span> and its
          logo. This can&apos;t be undone.
        </>
      }
    />
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
    <RowActions>
      <ViewAction href={`/admin/brands/${brand.id}`} label={`View ${brand.name}`} />
      <EditBrandButton brand={brand} />
      <DeleteBrandButton id={brand.id} name={brand.name} />
    </RowActions>
  );
}
