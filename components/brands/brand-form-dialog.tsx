"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useTransition,
  type FormEvent,
  type TransitionStartFunction,
} from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { UploadIcon } from "@/components/ui/icons";
import { Switch } from "@/components/ui/switch";
import { createBrand, updateBrand } from "@/lib/actions/brands";
import {
  BRAND_IMAGE_ACCEPT,
  brandFormSchema,
  type BrandStatusValue,
} from "@/lib/validation/brand";
import { toFieldErrors } from "@/lib/validation/field-errors";
import { BrandImage } from "./brand-image";

export type EditableBrand = {
  id: string;
  name: string;
  image: string | null;
  status: BrandStatusValue;
};

/**
 * The one Create / Edit brand form. Pass `brand` to edit; omit it to create.
 *
 * Submits through `onSubmit` + a transition rather than `<form action>`:
 * React resets action forms after every submission, which would wipe the
 * admin's input (including the chosen file) when the server rejects it. Here
 * values live in state and survive a failed attempt.
 *
 * The shared Zod schema runs here for instant inline errors; the Server Action
 * runs it again, and that is the check that counts.
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
  const [pending, startTransition] = useTransition();
  const editing = Boolean(brand);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      dismissible={!pending}
      title={editing ? "Edit brand" : "Add brand"}
      description={
        editing
          ? "Update the brand's name, logo or status."
          : "Brands group products from the same maker across every seller."
      }
    >
      {/* Dialog mounts its content only while open, so the form starts from
          the brand's saved values on every open without any reset effect. */}
      <BrandForm
        brand={brand}
        onDone={onClose}
        pending={pending}
        startTransition={startTransition}
      />
    </Dialog>
  );
}

function BrandForm({
  brand,
  onDone,
  pending,
  startTransition,
}: {
  brand?: EditableBrand;
  onDone: () => void;
  pending: boolean;
  startTransition: TransitionStartFunction;
}) {
  const editing = Boolean(brand);
  const [name, setName] = useState(brand?.name ?? "");
  const [status, setStatus] = useState<BrandStatusValue>(brand?.status ?? "ACTIVE");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string>();
  const fileInput = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const imageId = useId();

  // Release the last preview URL when the form unmounts.
  useEffect(() => () => {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
  }, []);

  function chooseFile(next: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    previewRef.current = next ? URL.createObjectURL(next) : null;
    setPreview(previewRef.current);
    setFile(next);
    // Check type and size immediately rather than on submit.
    const check = brandFormSchema.shape.image.safeParse(next ?? undefined);
    setFieldErrors((errors) => {
      const next = { ...errors };
      delete next.image;
      if (!check.success) next.image = check.error.issues.map((i) => i.message);
      return next;
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return; // no duplicate submissions

    const parsed = brandFormSchema.safeParse({ name, status, image: file ?? undefined });
    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error));
      return;
    }

    const formData = new FormData();
    formData.set("name", name);
    formData.set("status", status);
    if (file) formData.set("image", file);

    startTransition(async () => {
      setFormError(undefined);
      const result = brand ? await updateBrand(brand.id, formData) : await createBrand(formData);

      if (result.ok) {
        toast.success(result.message);
        onDone();
        return;
      }
      setFieldErrors(result.fieldErrors ?? {});
      setFormError(result.formError);
    });
  }

  const shownImage = preview ?? (editing ? brand?.image ?? null : null);

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <FormAlert message={formError} />

      <Field
        label="Brand Name"
        name="name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          // A correction clears the stale message; submit re-validates.
          if (fieldErrors.name) {
            setFieldErrors((errors) => {
              const next = { ...errors };
              delete next.name;
              return next;
            });
          }
        }}
        placeholder="Ex: New Balance"
        maxLength={60}
        errors={fieldErrors.name}
        showRequiredMark
        required
        data-autofocus
      />

      <div>
        <label htmlFor={imageId} className="mb-[9px] block text-[13px] font-semibold leading-none text-ink-soft">
          Brand Image
        </label>
        <div
          className={`flex items-center gap-4 rounded-[12px] border border-dashed p-4 ${
            fieldErrors.image?.length ? "border-error" : "border-line-strong"
          } bg-bg-subtle`}
        >
          <BrandImage src={shownImage} name={name || "?"} size={64} />
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[10px] border border-line bg-surface px-4 text-[13px] font-semibold leading-none text-ink-soft transition-colors duration-150 hover:bg-field"
            >
              <UploadIcon size={16} />
              {shownImage ? "Replace image" : "Upload image"}
            </button>
            <p className="mt-2 text-[12px] leading-[1.4] text-muted-soft">
              {file
                ? file.name
                : editing && brand?.image
                  ? "Keeping the current image."
                  : "JPG, PNG or WebP, up to 2 MB."}
            </p>
          </div>
          {file ? (
            <button
              type="button"
              onClick={() => {
                chooseFile(null);
                if (fileInput.current) fileInput.current.value = "";
              }}
              className="cursor-pointer text-[12.5px] font-semibold text-muted hover:text-ink"
            >
              Undo
            </button>
          ) : null}
          <input
            ref={fileInput}
            id={imageId}
            type="file"
            name="image"
            accept={BRAND_IMAGE_ACCEPT}
            className="sr-only"
            onChange={(e) => chooseFile(e.target.files?.[0] ?? null)}
          />
        </div>
        {fieldErrors.image?.length ? (
          <p className="mt-[7px] text-[12px] leading-[1.4] text-error">{fieldErrors.image[0]}</p>
        ) : null}
      </div>

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

      <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" size="sm" onClick={onDone} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? (editing ? "Saving..." : "Creating...") : editing ? "Save changes" : "Create brand"}
        </Button>
      </div>
    </form>
  );
}
