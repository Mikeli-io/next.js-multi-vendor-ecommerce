"use client";

import { useState, type FormEvent } from "react";

import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import {
  FormDialog,
  FormDialogFooter,
  useFieldErrors,
  type FormDialogContext,
} from "@/components/ui/form-dialog";
import { ImageField } from "@/components/ui/image-field";
import { Switch } from "@/components/ui/switch";
import { createBrand, updateBrand } from "@/lib/actions/brands";
import { brandFormSchema, type BrandStatusValue } from "@/lib/validation/brand";
import { toFieldErrors } from "@/lib/validation/field-errors";

export type EditableBrand = {
  id: string;
  name: string;
  image: string | null;
  status: BrandStatusValue;
};

/**
 * The one Create / Edit brand form. Pass `brand` to edit; omit it to create.
 *
 * Values live in state (not a `<form action>`, which React resets after every
 * submission), so a rejected attempt keeps what the admin entered. The shared
 * Zod schema runs here for instant inline errors; the Server Action runs it
 * again, and that is the check that counts.
 */
export function BrandFormDialog({
  open,
  onClose,
  brand,
}: {
  open: boolean;
  onClose: () => void;
  brand?: EditableBrand;
}) {
  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={brand ? "Edit brand" : "Add brand"}
      description={
        brand
          ? "Update the brand's name, logo or status."
          : "Brands group products from the same maker across every seller."
      }
    >
      {(context) => <BrandForm brand={brand} context={context} />}
    </FormDialog>
  );
}

function BrandForm({ brand, context }: { brand?: EditableBrand; context: FormDialogContext }) {
  const { pending, run, close } = context;
  const editing = Boolean(brand);
  const [name, setName] = useState(brand?.name ?? "");
  const [status, setStatus] = useState<BrandStatusValue>(brand?.status ?? "ACTIVE");
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string>();
  const errors = useFieldErrors();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const parsed = brandFormSchema.safeParse({ name, status, image: file ?? undefined });
    if (!parsed.success) {
      errors.setFieldErrors(toFieldErrors(parsed.error));
      return;
    }

    const formData = new FormData();
    formData.set("name", name);
    formData.set("status", status);
    if (file) formData.set("image", file);

    setFormError(undefined);
    run(
      () => (brand ? updateBrand(brand.id, formData) : createBrand(formData)),
      (result) => {
        errors.setFieldErrors(result.fieldErrors ?? {});
        setFormError(result.formError);
      },
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <FormAlert message={formError} />

      <Field
        label="Brand Name"
        name="name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          errors.clear("name");
        }}
        placeholder="Ex: New Balance"
        maxLength={60}
        errors={errors.fieldErrors.name}
        showRequiredMark
        required
        data-autofocus
      />

      <ImageField
        label="Brand Image"
        file={file}
        onChange={(next, imageErrors) => {
          setFile(next);
          errors.set("image", imageErrors);
        }}
        currentImage={brand?.image}
        previewName={name}
        errors={errors.fieldErrors.image}
      />

      <div className="flex items-center justify-between gap-4 rounded-[12px] border border-line p-4">
        <div>
          <p className="text-[13px] font-semibold leading-none text-ink-soft">Status</p>
          <p className="mt-[6px] text-[12px] leading-[1.4] text-muted-soft">
            {status === "ACTIVE"
              ? "Active — available for products."
              : "Inactive — hidden from product selection."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-medium text-ink-soft">
            {status === "ACTIVE" ? "Active" : "Inactive"}
          </span>
          <Switch
            checked={status === "ACTIVE"}
            onChange={(on) => setStatus(on ? "ACTIVE" : "INACTIVE")}
            label="Brand status"
            disabled={pending}
          />
        </div>
      </div>

      <FormDialogFooter
        pending={pending}
        onCancel={close}
        submitLabel={editing ? "Save changes" : "Create brand"}
        pendingLabel={editing ? "Saving..." : "Creating..."}
      />
    </form>
  );
}
