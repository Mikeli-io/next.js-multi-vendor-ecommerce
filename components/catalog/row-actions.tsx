"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type ComponentType, type ReactNode } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EditIcon, EyeIcon, TrashIcon, type IconProps } from "@/components/ui/icons";

/**
 * Row-level actions shared by the admin catalog tables: the list design's
 * 32px tinted square buttons, and a delete-with-confirmation flow.
 */

const TONE = {
  view: "border-success-bg bg-success-bg/60 text-success-solid hover:bg-success-bg",
  edit: "border-iris-100 bg-iris-50 text-iris-500 hover:bg-iris-100",
  delete: "border-error/15 bg-error-bg text-error-solid hover:bg-error/15",
} as const;

export function actionClass(kind: keyof typeof TONE) {
  return `grid size-8 cursor-pointer place-items-center rounded-sm border transition-colors duration-150 ${TONE[kind]}`;
}

export function RowActions({ children }: { children: ReactNode }) {
  return <div className="flex justify-end gap-[7px]">{children}</div>;
}

export function ViewAction({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} aria-label={label} title="View" className={actionClass("view")}>
      <EyeIcon size={15} />
    </Link>
  );
}

export function IconAction({
  kind,
  label,
  title,
  icon: Icon,
  onClick,
}: {
  kind: keyof typeof TONE;
  label: string;
  title: string;
  icon: ComponentType<IconProps>;
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={title} className={actionClass(kind)}>
      <Icon size={15} />
    </button>
  );
}

/** Edit trigger in either the row (icon) or a page header (button) style. */
export function EditTrigger({
  label,
  variant = "icon",
  onClick,
}: {
  label: string;
  variant?: "icon" | "button";
  onClick: () => void;
}) {
  return variant === "icon" ? (
    <IconAction kind="edit" label={label} title="Edit" icon={EditIcon} onClick={onClick} />
  ) : (
    <Button type="button" variant="secondary" size="sm" onClick={onClick}>
      <EditIcon size={15} />
      Edit
    </Button>
  );
}

type DeleteResult = { ok: true; message: string } | { ok: false; formError?: string };

/**
 * Delete with a confirmation naming the item. A refusal from the server (e.g.
 * "this category still has sub categories") keeps the dialog open and shows
 * the reason. `onDelete` is the item's Server Action, which re-checks
 * authorization and safety itself.
 */
export function DeleteButton({
  id,
  name,
  noun,
  body,
  onDelete,
  variant = "icon",
  redirectTo,
}: {
  id: string;
  name: string;
  /** e.g. "brand", "category" — used in labels. */
  noun: string;
  body: ReactNode;
  onDelete: (id: string) => Promise<DeleteResult>;
  variant?: "icon" | "button";
  /** Where to go afterwards — needed on a details page whose item is gone. */
  redirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function confirm() {
    startTransition(async () => {
      const result = await onDelete(id);
      if (!result.ok) {
        setError(result.formError ?? `This ${noun} couldn't be deleted.`);
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
        <IconAction kind="delete" label={`Delete ${name}`} title="Delete" icon={TrashIcon} onClick={openDialog} />
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
        body={body}
        confirmLabel={`Delete ${noun}`}
      />
    </>
  );
}
