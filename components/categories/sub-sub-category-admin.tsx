"use client";

import { useState, type FormEvent } from "react";

import { DeleteButton, EditTrigger, RowActions } from "@/components/catalog/row-actions";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { FormDialog, FormDialogFooter, useFieldErrors, type FormDialogContext } from "@/components/ui/form-dialog";
import { PlusIcon } from "@/components/ui/icons";
import { SelectField } from "@/components/ui/select-field";
import { createSubSubCategory, deleteSubSubCategory, updateSubSubCategory } from "@/lib/actions/catalog";
import type { CategoryOption } from "@/lib/catalog/queries";
import { subSubCategoryFormSchema } from "@/lib/validation/catalog";
import { toFieldErrors } from "@/lib/validation/field-errors";

export type EditableSubSubCategory = {
  id: string;
  name: string;
  subCategoryId: string;
  /** Derived through the sub category; used only to preselect the dropdown. */
  categoryId: string;
};

function SubSubCategoryFormDialog({
  open,
  onClose,
  options,
  item,
}: {
  open: boolean;
  onClose: () => void;
  options: CategoryOption[];
  item?: EditableSubSubCategory;
}) {
  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={item ? "Edit sub sub category" : "Add sub sub category"}
      description="The most specific level, e.g. Gaming Laptops within Electronics › Laptops."
    >
      {(context) => <SubSubCategoryForm options={options} item={item} context={context} />}
    </FormDialog>
  );
}

/**
 * Category → Sub Category → Name. The Sub Category dropdown lists only the
 * selected category's sub categories (both lists come from the database) and
 * stays disabled until a category is chosen. Changing the category clears a
 * sub category that no longer belongs to it. The server re-checks the pairing.
 */
function SubSubCategoryForm({
  options,
  item,
  context,
}: {
  options: CategoryOption[];
  item?: EditableSubSubCategory;
  context: FormDialogContext;
}) {
  const { pending, run, close } = context;
  const [categoryId, setCategoryId] = useState(item?.categoryId ?? "");
  const [subCategoryId, setSubCategoryId] = useState(item?.subCategoryId ?? "");
  const [name, setName] = useState(item?.name ?? "");
  const [formError, setFormError] = useState<string>();
  const errors = useFieldErrors();

  const subOptions = options.find((c) => c.id === categoryId)?.subCategories ?? [];

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = subSubCategoryFormSchema.safeParse({ categoryId, subCategoryId, name });
    if (!parsed.success) return errors.setFieldErrors(toFieldErrors(parsed.error));

    const formData = new FormData();
    formData.set("categoryId", categoryId);
    formData.set("subCategoryId", subCategoryId);
    formData.set("name", name);

    setFormError(undefined);
    run(
      () => (item ? updateSubSubCategory(item.id, formData) : createSubSubCategory(formData)),
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
          const next = e.target.value;
          setCategoryId(next);
          const stillValid = options.find((c) => c.id === next)?.subCategories.some((s) => s.id === subCategoryId);
          if (!stillValid) setSubCategoryId("");
          errors.clear("categoryId");
          errors.clear("subCategoryId");
        }}
        options={options.map((c) => ({ value: c.id, label: c.name }))}
        placeholder="Select a category"
        errors={errors.fieldErrors.categoryId}
        showRequiredMark
        required
        data-autofocus
      />
      <SelectField
        label="Sub Category"
        name="subCategoryId"
        value={subCategoryId}
        onChange={(e) => {
          setSubCategoryId(e.target.value);
          errors.clear("subCategoryId");
          errors.clear("name"); // a name clash is per sub category
        }}
        options={subOptions.map((s) => ({ value: s.id, label: s.name }))}
        placeholder={
          !categoryId
            ? "Select a category first"
            : subOptions.length
              ? "Select a sub category"
              : "No sub categories in this category"
        }
        disabled={!categoryId || subOptions.length === 0}
        errors={errors.fieldErrors.subCategoryId}
        hint={categoryId && subOptions.length === 0 ? "Add a sub category to this category first." : undefined}
        showRequiredMark
        required
      />
      <Field
        label="Sub Sub Category Name"
        name="name"
        value={name}
        onChange={(e) => {
          setName(e.target.value);
          errors.clear("name");
        }}
        placeholder="Ex: Gaming Laptops"
        maxLength={60}
        errors={errors.fieldErrors.name}
        showRequiredMark
        required
      />
      <FormDialogFooter
        pending={pending}
        onCancel={close}
        submitLabel={item ? "Save changes" : "Create sub sub category"}
        pendingLabel={item ? "Saving..." : "Creating..."}
      />
    </form>
  );
}

export function AddSubSubCategoryButton({ options }: { options: CategoryOption[] }) {
  const [open, setOpen] = useState(false);
  const hasSubCategories = options.some((c) => c.subCategories.length > 0);
  return (
    <>
      <Button
        type="button"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={!hasSubCategories}
        title={hasSubCategories ? undefined : "Create a sub category first"}
        className="whitespace-nowrap"
      >
        <PlusIcon size={16} />
        Add Sub Sub Category
      </Button>
      <SubSubCategoryFormDialog open={open} onClose={() => setOpen(false)} options={options} />
    </>
  );
}

export function SubSubCategoryRowActions({
  item,
  options,
}: {
  item: EditableSubSubCategory;
  options: CategoryOption[];
}) {
  const [editing, setEditing] = useState(false);
  return (
    <RowActions>
      <EditTrigger label={`Edit ${item.name}`} onClick={() => setEditing(true)} />
      <SubSubCategoryFormDialog open={editing} onClose={() => setEditing(false)} options={options} item={item} />
      <DeleteButton
        id={item.id}
        name={item.name}
        noun="sub sub category"
        onDelete={deleteSubSubCategory}
        body={
          <>
            This permanently removes <span className="font-semibold text-ink">{item.name}</span>. This can&apos;t
            be undone.
          </>
        }
      />
    </RowActions>
  );
}
