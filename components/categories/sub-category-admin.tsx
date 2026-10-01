"use client";

import { useState, type FormEvent } from "react";

import { DeleteButton, EditTrigger, RowActions } from "@/components/catalog/row-actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { FormDialog, FormDialogFooter, useFieldErrors, type FormDialogContext } from "@/components/ui/form-dialog";
import { PlusIcon } from "@/components/ui/icons";
import { SelectField } from "@/components/ui/select-field";
import { createSubCategory, deleteSubCategory, updateSubCategory } from "@/lib/actions/catalog";
import { subCategoryFormSchema } from "@/lib/validation/catalog";
import { toFieldErrors } from "@/lib/validation/field-errors";

/** A category choice for the dropdown — always loaded from the database. */
export type CategoryChoice = { id: string; name: string };

export type EditableSubCategory = { id: string; name: string; categoryId: string };

function SubCategoryFormDialog({
  open,
  onClose,
  categories,
  subCategory,
  defaultCategoryId,
}: {
  open: boolean;
  onClose: () => void;
  categories: CategoryChoice[];
  subCategory?: EditableSubCategory;
  /** Preselect when adding from a list filtered to one category. */
  defaultCategoryId?: string;
}) {
  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={subCategory ? "Edit sub category" : "Add sub category"}
      description="Sub categories split a category up, e.g. Laptops within Electronics."
    >
      {(context) => (
        <SubCategoryForm
          categories={categories}
          subCategory={subCategory}
          defaultCategoryId={defaultCategoryId}
          context={context}
        />
      )}
    </FormDialog>
  );
}

function SubCategoryForm({
  categories,
  subCategory,
  defaultCategoryId,
  context,
}: {
  categories: CategoryChoice[];
  subCategory?: EditableSubCategory;
  defaultCategoryId?: string;
  context: FormDialogContext;
}) {
  const { pending, run, close } = context;
  const [categoryId, setCategoryId] = useState(subCategory?.categoryId ?? defaultCategoryId ?? "");
  const [name, setName] = useState(subCategory?.name ?? "");
  const [formError, setFormError] = useState<string>();
  const errors = useFieldErrors();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = subCategoryFormSchema.safeParse({ categoryId, name });
    if (!parsed.success) return errors.setFieldErrors(toFieldErrors(parsed.error));

    const formData = new FormData();
    formData.set("categoryId", categoryId);
    formData.set("name", name);

    setFormError(undefined);
    run(
      () => (subCategory ? updateSubCategory(subCategory.id, formData) : createSubCategory(formData)),
      (result) => {
        errors.setFieldErrors(result.fieldErrors ?? {});
        setFormError(result.formError);
      },
    );
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <FormAlert message={formError} />
      <SelectField
        label="Category"
        name="categoryId"
        value={categoryId}
        onChange={(e) => {
          setCategoryId(e.target.value);
          errors.clear("categoryId");
          errors.clear("name"); // a name clash is per category
        }}
        options={categories.map((c) => ({ value: c.id, label: c.name }))}
        placeholder="Select a category"
        errors={errors.fieldErrors.categoryId}
        showRequiredMark
        required
        data-autofocus
      />
      <Field
        label="Sub Category Name"
        name="name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          errors.clear("name");
        }}
        placeholder="Ex: Laptops"
        maxLength={60}
        errors={errors.fieldErrors.name}
        showRequiredMark
        required
      />
      <FormDialogFooter
        pending={pending}
        onCancel={close}
        submitLabel={subCategory ? "Save changes" : "Create sub category"}
        pendingLabel={subCategory ? "Saving..." : "Creating..."}
      />
    </form>
  );
}

export function AddSubCategoryButton({
  categories,
  defaultCategoryId,
}: {
  categories: CategoryChoice[];
  defaultCategoryId?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        type="button"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={categories.length === 0}
        title={categories.length === 0 ? "Create a category first" : undefined}
        className="whitespace-nowrap"
      >
        <PlusIcon size={16} />
        Add Sub Category
      </Button>
      <SubCategoryFormDialog
        open={open}
        onClose={() => setOpen(false)}
        categories={categories}
        defaultCategoryId={defaultCategoryId}
      />
    </>
  );
}

export function SubCategoryRowActions({
  subCategory,
  categories,
}: {
  subCategory: EditableSubCategory;
  categories: CategoryChoice[];
}) {
  const [editing, setEditing] = useState(false);
  return (
    <RowActions>
      <EditTrigger label={`Edit ${subCategory.name}`} onClick={() => setEditing(true)} />
      <SubCategoryFormDialog
        open={editing}
        onClose={() => setEditing(false)}
        categories={categories}
        subCategory={subCategory}
      />
      <DeleteButton
        id={subCategory.id}
        name={subCategory.name}
        noun="sub category"
        onDelete={deleteSubCategory}
        body={
          <>
            This permanently removes <span className="font-semibold text-ink">{subCategory.name}</span>. A sub
            category that still has sub sub categories can&apos;t be deleted.
          </>
        }
      />
    </RowActions>
  );
}
