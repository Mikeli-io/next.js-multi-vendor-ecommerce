"use client";

import { useState, type FormEvent } from "react";

import { DeleteButton, EditTrigger, RowActions } from "@/components/catalog/row-actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { FormDialog, FormDialogFooter, useFieldErrors, type FormDialogContext } from "@/components/ui/form-dialog";
import { PlusIcon } from "@/components/ui/icons";
import { ImageField } from "@/components/ui/image-field";
import { createCategory, deleteCategory, updateCategory } from "@/lib/actions/catalog";
import { categoryFormSchema } from "@/lib/validation/catalog";
import { toFieldErrors } from "@/lib/validation/field-errors";

export type EditableCategory = { id: string; name: string; image: string | null };

/** Create / Edit category form. Pass `category` to edit. */
function CategoryFormDialog({
  open,
  onClose,
  category,
}: {
  open: boolean;
  onClose: () => void;
  category?: EditableCategory;
}) {
  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={category ? "Edit category" : "Add category"}
      description="Top-level groups shoppers browse by, e.g. Electronics or Home & Kitchen."
    >
      {(context) => <CategoryForm category={category} context={context} />}
    </FormDialog>
  );
}

function CategoryForm({ category, context }: { category?: EditableCategory; context: FormDialogContext }) {
  const { pending, run, close } = context;
  const [name, setName] = useState(category?.name ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string>();
  const errors = useFieldErrors();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = categoryFormSchema.safeParse({ name, image: file ?? undefined });
    if (!parsed.success) return errors.setFieldErrors(toFieldErrors(parsed.error));

    const formData = new FormData();
    formData.set("name", name);
    if (file) formData.set("image", file);

    setFormError(undefined);
    run(
      () => (category ? updateCategory(category.id, formData) : createCategory(formData)),
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
        label="Category Name"
        name="name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          errors.clear("name");
        }}
        placeholder="Ex: Electronics"
        maxLength={60}
        errors={errors.fieldErrors.name}
        showRequiredMark
        required
        data-autofocus
      />
      <ImageField
        label="Category Image"
        file={file}
        onChange={(next, imageErrors) => {
          setFile(next);
          errors.set("image", imageErrors);
        }}
        currentImage={category?.image}
        previewName={name}
        errors={errors.fieldErrors.image}
      />
      <FormDialogFooter
        pending={pending}
        onCancel={close}
        submitLabel={category ? "Save changes" : "Create category"}
        pendingLabel={category ? "Saving..." : "Creating..."}
      />
    </form>
  );
}

export function AddCategoryButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)} className="whitespace-nowrap">
        <PlusIcon size={16} />
        Add Category
      </Button>
      <CategoryFormDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function CategoryRowActions({ category }: { category: EditableCategory }) {
  const [editing, setEditing] = useState(false);
  return (
    <RowActions>
      <EditTrigger label={`Edit ${category.name}`} onClick={() => setEditing(true)} />
      <CategoryFormDialog open={editing} onClose={() => setEditing(false)} category={category} />
      <DeleteButton
        id={category.id}
        name={category.name}
        noun="category"
        onDelete={deleteCategory}
        body={
          <>
            This permanently removes <span className="font-semibold text-ink">{category.name}</span> and its
            image. A category that still has sub categories can&apos;t be deleted.
          </>
        }
      />
    </RowActions>
  );
}
