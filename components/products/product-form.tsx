"use client";

import { useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Field, TextAreaField } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { useFieldErrors } from "@/components/ui/form-dialog";
import { SelectField } from "@/components/ui/select-field";
import { UploadDropzone } from "@/components/ui/upload-dropzone";
import { createProduct, updateProduct } from "@/lib/actions/products";
import type { BrandOption, ProductDetail, TaxonomyOption } from "@/lib/products/queries";
import { comboKey, combinations, groupsFromVariations, variationName } from "@/lib/products/variations";
import { toFieldErrors } from "@/lib/validation/field-errors";
import { IMAGE_ACCEPT, optionalImageSchema } from "@/lib/validation/image";
import { discountProblem, productFieldsSchema, variationPlanSchema, type VariationRowInput } from "@/lib/validation/product";
import { GalleryEditor, type GalleryItem } from "./gallery-editor";
import { VariationEditor, activeCombinations, newGroup, type VariationRow, type VariationState } from "./variation-editor";

/**
 * Add / Edit Product, after VendorAddProduct.dc.html: Basic Setup, General
 * Setup, Pricing & Others, Product Variation Setup, Additional Images, SEO.
 *
 * Left out on purpose (no data behind them): language tabs, AI "Generate",
 * "Add Info From Gallery", Product Type, Unit, Search Tags, shipping/min-order
 * pricing, Product Video, and every SEO control except title + description.
 *
 * State is held here so a refused submit keeps everything, files included.
 * The shared Zod schemas give instant inline errors; the Server Action
 * re-validates everything and is what counts. Vendor, approval status and
 * active state are never part of this form.
 */

type Values = {
  name: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  subCategoryId: string;
  subSubCategoryId: string;
  brandId: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  discount: string;
  discountType: "AMOUNT" | "PERCENTAGE";
  taxRate: string;
  stock: string;
  metaTitle: string;
  metaDescription: string;
};

type Thumbnail = { file: File | null; current: string | null };

const FIELD_ORDER = [
  "name", "shortDescription", "description", "thumbnail", "categoryId", "subCategoryId", "subSubCategoryId",
  "brandId", "sku", "price", "compareAtPrice", "discount", "taxRate", "stock", "variations", "gallery",
  "metaTitle", "metaDescription",
];

/** The Server Action body limit is 8 MB (next.config.ts); stay under it per save. */
const MAX_UPLOAD_BYTES = 7.5 * 1024 * 1024;

function initialValues(product?: ProductDetail): Values {
  return {
    name: product?.name ?? "",
    shortDescription: product?.shortDescription ?? "",
    description: product?.description ?? "",
    categoryId: product?.category.id ?? "",
    subCategoryId: product?.subCategory?.id ?? "",
    subSubCategoryId: product?.subSubCategory?.id ?? "",
    brandId: product?.brand?.id ?? "",
    sku: product?.sku ?? "",
    price: product?.price ?? "",
    compareAtPrice: product?.compareAtPrice ?? "",
    discount: product?.discount ?? "",
    discountType: product?.discountType ?? "AMOUNT",
    taxRate: product?.taxRate ?? "",
    stock: String(product?.simpleStock ?? 0),
    metaTitle: product?.metaTitle ?? "",
    metaDescription: product?.metaDescription ?? "",
  };
}

/** Rebuild the attribute groups, rows and removed combinations from saved variations. */
function initialVariations(product?: ProductDetail): VariationState {
  if (!product?.variations.length) return { enabled: false, groups: [], rows: {}, excluded: [] };
  const groups = groupsFromVariations(product.variations).map((g) => newGroup(g.name, g.values));
  const rows: Record<string, VariationRow> = {};
  for (const v of product.variations) {
    rows[comboKey(v.attributes)] = {
      price: v.price,
      stock: String(v.stock),
      sku: v.sku ?? "",
      image: v.image ? { kind: "saved", url: v.image } : null,
    };
  }
  // Combinations of the saved values that have no row were removed earlier.
  const excluded = combinations(groups).map(comboKey).filter((key) => !rows[key]);
  return { enabled: true, groups, rows, excluded };
}

export function ProductForm({
  product,
  categories,
  brands,
}: {
  /** The product being edited; omitted on Add. */
  product?: ProductDetail;
  categories: TaxonomyOption[];
  brands: BrandOption[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [values, setValues] = useState(() => initialValues(product));
  const [thumbnail, setThumbnail] = useState<Thumbnail>({ file: null, current: product?.thumbnail ?? null });
  const [gallery, setGallery] = useState<GalleryItem[]>(() => (product?.gallery ?? []).map((path) => ({ kind: "saved", path })));
  const [variations, setVariations] = useState(() => initialVariations(product));
  const [formError, setFormError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const errors = useFieldErrors();

  const set = (patch: Partial<Values>) => {
    setValues((v) => ({ ...v, ...patch }));
    for (const key of Object.keys(patch)) errors.clear(key);
  };
  const text = (name: keyof Values) => ({
    name,
    value: values[name],
    onChange: (e: { target: { value: string } }) => set({ [name]: e.target.value } as Partial<Values>),
    errors: errors.fieldErrors[name],
  });

  // Dependent taxonomy: options narrow to the chosen parent; a parent change clears its children.
  const category = categories.find((c) => c.id === values.categoryId);
  const subCategory = category?.subCategories.find((s) => s.id === values.subCategoryId);

  function reset() {
    setValues(initialValues(product));
    setThumbnail({ file: null, current: product?.thumbnail ?? null });
    setGallery((product?.gallery ?? []).map((path) => ({ kind: "saved", path })));
    setVariations(initialVariations(product));
    errors.setFieldErrors({});
    setFormError(undefined);
  }

  function showErrors(fieldErrors: Record<string, string[]>) {
    errors.setFieldErrors(fieldErrors);
    const first = FIELD_ORDER.find((name) => fieldErrors[name]);
    requestAnimationFrame(() => {
      const target = first ? formRef.current?.querySelector(`[data-field="${first}"]`) : null;
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  /** Variation rows as submitted (image: keep / remove / upload). */
  function variationRows() {
    const kept = variations.enabled ? activeCombinations(variations) : [];
    return kept.map((attributes) => {
      const row = variations.rows[comboKey(attributes)];
      const input: VariationRowInput = {
        // Names and values as submitted are trimmed, like the groups below.
        attributes: Object.fromEntries(Object.entries(attributes).map(([k, v]) => [k.trim(), v.trim()])),
        price: row?.price ?? "",
        stock: row?.stock ?? "",
        sku: row?.sku ?? "",
        image: row?.image?.kind === "new" ? "upload" : row?.image?.kind === "saved" ? "keep" : "remove",
      };
      return { input, file: row?.image?.kind === "new" ? row.image.file : null };
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const rows = variationRows();
    const plan = {
      enabled: variations.enabled,
      groups: variations.groups.map(({ name, values: vals }) => ({ name: name.trim(), values: vals.map((v) => v.trim()) })),
      rows: rows.map((r) => r.input),
    };
    // With variations, Product.stock is ignored (stored as 0): a stale value
    // in the hidden simple-stock field must not block the save.
    const submitted = { ...values, stock: variations.enabled ? "0" : values.stock };

    // Same rules as the server, for instant feedback.
    const fieldErrors: Record<string, string[]> = {};
    const fields = productFieldsSchema.safeParse(submitted);
    if (!fields.success) Object.assign(fieldErrors, toFieldErrors(fields.error));
    const planCheck = variationPlanSchema.safeParse(plan);
    if (!planCheck.success) {
      fieldErrors.variations = [...new Set(planCheck.error.issues.map((issue) => {
        const index = issue.path[0] === "rows" && typeof issue.path[1] === "number" ? issue.path[1] : null;
        const label = index !== null ? variationName(plan.groups, rows[index].input.attributes) : null;
        return label ? `${label}: ${issue.message}` : issue.message;
      }))];
    }
    if (fields.success && planCheck.success) {
      const discount = discountProblem(fields.data, planCheck.data);
      if (discount) fieldErrors.discount = [discount];
    }
        const thumbCheck = optionalImageSchema.safeParse(thumbnail.file ?? undefined);
    if (!thumbCheck.success) fieldErrors.thumbnail = thumbCheck.error.issues.map((i) => i.message);

    const newFiles = [
      thumbnail.file,
      ...gallery.map((g) => (g.kind === "new" ? g.file : null)),
      ...rows.map((r) => r.file),
    ].filter((f): f is File => Boolean(f));
    const bytes = newFiles.reduce((sum, f) => sum + f.size, 0);

    if (Object.keys(fieldErrors).length) {
      setFormError(undefined);
      showErrors(fieldErrors);
      return;
    }
    if (bytes > MAX_UPLOAD_BYTES) {
      setFormError(
        `The new images in this save add up to ${(bytes / 1024 / 1024).toFixed(1)} MB; one save can upload about 7.5 MB. Save with fewer new images, then add the rest by editing the product.`,
      );
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const formData = new FormData();
    for (const [name, value] of Object.entries(submitted)) formData.set(name, value);
    if (product) formData.set("version", product.updatedAt.toISOString());
    if (thumbnail.file) formData.set("thumbnail", thumbnail.file);
    if (!thumbnail.file && !thumbnail.current) formData.set("removeThumbnail", "1");
    let upload = 0;
    const galleryPlan = gallery.map((item) => {
      if (item.kind === "saved") return { keep: item.path };
      formData.set(`galleryFile_${upload}`, item.file);
      return { upload: upload++ };
    });
    formData.set("gallery", JSON.stringify(galleryPlan));
    formData.set("variations", JSON.stringify(plan));
    rows.forEach((row, index) => row.file && formData.set(`variationImage_${index}`, row.file));

    setFormError(undefined);
    startTransition(async () => {
      try {
        const result = product ? await updateProduct(product.id, formData) : await createProduct(formData);
        if (result.ok) {
          toast.success(result.message);
          router.push(`/vendor/products/${result.productId}`);
          return;
        }
        setFormError(result.formError);
        showErrors(result.fieldErrors ?? {});
        if (result.formError) window.scrollTo({ top: 0, behavior: "smooth" });
      } catch {
        // e.g. the request was larger than the server accepts.
        setFormError("The product couldn't be saved. If you added many images, save with fewer and add the rest by editing.");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-[22px]">
      <FormAlert message={formError} />

      <Section title="Basic Setup" description="Here you can setup the product information for website.">
        <div className="grid grid-cols-1 gap-[26px] lg:grid-cols-[1fr_320px]">
          <div className="flex flex-col gap-5 rounded-[14px] border border-line-soft p-5 sm:p-[22px]">
            <div data-field="name">
              <Field label="Product Name" placeholder="New product" maxLength={150} showRequiredMark required {...text("name")} />
            </div>
            <div data-field="shortDescription">
              <TextAreaField label="Short Description" placeholder="A one-line summary shown in listings (optional)" maxLength={500} rows={2} {...text("shortDescription")} />
            </div>
            <div data-field="description">
              <TextAreaField label="Description" placeholder="Describe the product: materials, sizing, care, what's in the box…" maxLength={10000} rows={8} showRequiredMark required {...text("description")} />
            </div>
          </div>
          <div data-field="thumbnail" className="flex flex-col rounded-[14px] border border-line-soft p-5 sm:p-[22px]">
            <UploadDropzone
              label="Product Thumbnail"
              hint="JPG, PNG or WebP · Max 2 MB · Square (1:1) works best"
              kind="image"
              aspect="1/1"
              accept={IMAGE_ACCEPT}
              check={(file) => {
                const result = optionalImageSchema.safeParse(file);
                return result.success ? undefined : result.error.issues.map((i) => i.message);
              }}
              file={thumbnail.file}
              currentUrl={thumbnail.current}
              onChange={(file, fileErrors) => {
                setThumbnail((t) => ({ ...t, file }));
                errors.set("thumbnail", fileErrors);
              }}
              errors={errors.fieldErrors.thumbnail}
            />
            {thumbnail.file || thumbnail.current ? (
              <button
                type="button"
                onClick={() => {
                  setThumbnail({ file: null, current: null });
                  errors.clear("thumbnail");
                }}
                className="mx-auto mt-3 cursor-pointer text-[12.5px] font-semibold text-error hover:text-error-solid"
              >
                Remove thumbnail
              </button>
            ) : product?.thumbnail ? (
              <button
                type="button"
                onClick={() => setThumbnail({ file: null, current: product.thumbnail })}
                className="mx-auto mt-3 cursor-pointer text-[12.5px] font-semibold text-iris-500 hover:text-iris-600"
              >
                Undo remove
              </button>
            ) : null}
          </div>
        </div>
      </Section>

      <Section title="General Setup" description="Here you can setup the foundational details required for product creation.">
        {categories.length ? null : (
          <p role="status" className="mb-5 rounded-[12px] bg-warning-bg px-4 py-3 text-[13px] leading-normal text-warning">
            No categories exist yet, so products can&apos;t be saved. The Covet team adds categories — please check back soon.
          </p>
        )}
        <div className="grid grid-cols-1 gap-x-[22px] gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <div data-field="categoryId">
            <SelectField
              label="Category"
              name="categoryId"
              placeholder="Select category"
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              value={values.categoryId}
              onChange={(e) => set({ categoryId: e.target.value, subCategoryId: "", subSubCategoryId: "" })}
              errors={errors.fieldErrors.categoryId}
              showRequiredMark
              required
            />
          </div>
          <div data-field="subCategoryId">
            <SelectField
              label="Sub Category"
              name="subCategoryId"
              placeholder={category ? (category.subCategories.length ? "Select Sub Category" : "No sub categories") : "Select a category first"}
              options={(category?.subCategories ?? []).map((s) => ({ value: s.id, label: s.name }))}
              value={values.subCategoryId}
              disabled={!category || !category.subCategories.length}
              onChange={(e) => set({ subCategoryId: e.target.value, subSubCategoryId: "" })}
              errors={errors.fieldErrors.subCategoryId}
            />
          </div>
          <div data-field="subSubCategoryId">
            <SelectField
              label="Sub Sub Category"
              name="subSubCategoryId"
              placeholder={subCategory ? (subCategory.subSubCategories.length ? "Select Sub Sub Category" : "No sub sub categories") : "Select a sub category first"}
              options={(subCategory?.subSubCategories ?? []).map((s) => ({ value: s.id, label: s.name }))}
              value={values.subSubCategoryId}
              disabled={!subCategory || !subCategory.subSubCategories.length}
              onChange={(e) => set({ subSubCategoryId: e.target.value })}
              errors={errors.fieldErrors.subSubCategoryId}
            />
          </div>
          <div data-field="brandId">
            <SelectField
              label="Brand"
              name="brandId"
              placeholder="Select Brand"
              options={brands.map((b) => ({ value: b.id, label: b.name }))}
              value={values.brandId}
              onChange={(e) => set({ brandId: e.target.value })}
              errors={errors.fieldErrors.brandId}
            />
          </div>
          <div data-field="sku">
            <Field label="Product SKU" placeholder="Optional, e.g. TSHIRT-001" maxLength={64} autoComplete="off" {...text("sku")} />
          </div>
        </div>
      </Section>

      <Section title="Pricing & Others" description="Here you can setup the price and other information for the product.">
        <div className="grid grid-cols-1 gap-x-[22px] gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          <div data-field="price">
            <Field label="Price ($)" inputMode="decimal" placeholder="0.00" showRequiredMark required {...text("price")} />
          </div>
          <div data-field="compareAtPrice">
            <Field label="Compare At Price ($)" inputMode="decimal" placeholder="Optional" hint="The original price, shown crossed out." {...text("compareAtPrice")} />
          </div>
          <div data-field="discount">
            <div className="flex items-end gap-[10px]">
              <Field
                className="min-w-0 flex-1"
                label={values.discountType === "PERCENTAGE" ? "Discount (%)" : "Discount ($)"}
                inputMode="decimal"
                placeholder="Optional"
                {...text("discount")}
                errors={undefined}
              />
              <div className="w-[136px] flex-none">
                <SelectField
                  label="Discount Type"
                  name="discountType"
                  placeholder="Type"
                  options={[
                    { value: "AMOUNT", label: "Amount" },
                    { value: "PERCENTAGE", label: "Percentage" },
                  ]}
                  value={values.discountType}
                  onChange={(e) => set({ discountType: (e.target.value || "AMOUNT") as Values["discountType"], discount: values.discount })}
                />
              </div>
            </div>
            {errors.fieldErrors.discount ? (
              <p className="mt-[7px] text-[12px] leading-[1.4] text-error">{errors.fieldErrors.discount[0]}</p>
            ) : null}
          </div>
          <div data-field="taxRate">
            <Field label="Tax Rate (%)" inputMode="decimal" placeholder="Optional, e.g. 7.5" {...text("taxRate")} />
          </div>
          <div data-field="stock">
            <Field
              label="Stock"
              inputMode="numeric"
              showRequiredMark={!variations.enabled}
              disabled={variations.enabled}
              hint={variations.enabled ? "Set per variation below — the product's stock is their total." : undefined}
              {...text("stock")}
              value={variations.enabled ? "" : values.stock}
              placeholder={variations.enabled ? "Per variation" : "0"}
            />
          </div>
        </div>
      </Section>

      <VariationEditor
        state={variations}
        onChange={(next) => {
          setVariations(next);
          errors.clear("variations");
        }}
        productPrice={values.price}
        errors={errors.fieldErrors.variations}
      />

      <GalleryEditor
        items={gallery}
        onChange={(items) => {
          setGallery(items);
          errors.clear("gallery");
        }}
        errors={errors.fieldErrors.gallery}
      />

      <Section title="SEO Section" description="Add a meta title and description to help people find this product on search engines.">
        <div className="grid grid-cols-1 gap-5">
          <div data-field="metaTitle">
            <Field label="Meta Title" placeholder="Meta Title" maxLength={150} {...text("metaTitle")} />
          </div>
          <div data-field="metaDescription">
            <TextAreaField label="Meta Description" placeholder="Meta Description" maxLength={300} rows={4} {...text("metaDescription")} />
          </div>
        </div>
      </Section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={reset} disabled={pending} className="px-[30px]">
          Reset
        </Button>
        <Button type="submit" disabled={pending} className="px-[34px]">
          {pending ? "Saving..." : product ? "Save Changes" : "Submit"}
        </Button>
      </div>
    </form>
  );
}

/** One titled card of the form, as in the design. */
function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-[18px] border border-line-soft bg-surface p-5 shadow-xs sm:p-[26px_28px]">
      <div className="mb-5">
        <h2 className="font-display text-[18px] font-bold leading-none text-ink">{title}</h2>
        <p className="mt-2 text-[13px] leading-[1.4] text-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}
