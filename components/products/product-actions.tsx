"use client";

import { useOptimistic, useTransition } from "react";
import toast from "react-hot-toast";

import { DeleteButton, RowActions, ViewAction, actionClass } from "@/components/catalog/row-actions";
import { EditIcon } from "@/components/ui/icons";
import { Switch } from "@/components/ui/switch";
import { deleteProduct, setProductActive } from "@/lib/actions/products";
import Link from "next/link";

/**
 * The vendor's Active/Inactive switch. Optimistic; the Server Action checks
 * ownership and changes only `isActive` — the approval status is untouched.
 */
export function ProductActiveSwitch({ id, name, active }: { id: string; name: string; active: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(active);
  const [pending, startTransition] = useTransition();

  function toggle(next: boolean) {
    startTransition(async () => {
      setOptimistic(next);
      const result = await setProductActive(id, next);
      if (result.ok) toast.success(result.message);
      else toast.error(result.formError ?? "Couldn't change the status.");
    });
  }

  return (
    <Switch
      checked={optimistic}
      onChange={toggle}
      disabled={pending}
      label={`${name} is ${optimistic ? "active" : "inactive"}`}
    />
  );
}

const DELETE_BODY = (
  <>
    This permanently deletes the product, its variations and its images. This can&apos;t be undone.
  </>
);

export function DeleteProductButton({
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
    <DeleteButton id={id} name={name} noun="product" body={DELETE_BODY} onDelete={deleteProduct} variant={variant} redirectTo={redirectTo} />
  );
}

/** View · Edit · Delete for one table row. */
export function ProductRowActions({ id, name }: { id: string; name: string }) {
  return (
    <RowActions>
      <ViewAction href={`/vendor/products/${id}`} label={`View ${name}`} />
      <Link href={`/vendor/products/${id}/edit`} aria-label={`Edit ${name}`} title="Edit" className={actionClass("edit")}>
        <EditIcon size={15} />
      </Link>
      <DeleteProductButton id={id} name={name} />
    </RowActions>
  );
}
