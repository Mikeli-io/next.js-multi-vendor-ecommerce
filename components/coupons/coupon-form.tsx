"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { useFieldErrors } from "@/components/ui/form-dialog";
import { SelectField } from "@/components/ui/select-field";
import { createCoupon, updateCoupon } from "@/lib/actions/coupons";
import type { CouponProductOption, CouponRow } from "@/lib/coupons/queries";
import {
  COUPON_APPLIES_TO,
  COUPON_APPLIES_TO_LABEL,
  COUPON_PRODUCTS_REQUIRED,
  COUPON_TYPES,
  COUPON_TYPE_LABEL,
  couponFormSchema,
  normalizeCouponCode,
  todayUtc,
  type CouponAppliesToValue,
} from "@/lib/validation/coupon";
import { toFieldErrors } from "@/lib/validation/field-errors";
import { CouponProductPicker } from "./coupon-product-picker";

/**
 * Create / Edit Coupon, after the setup card of VendorCoupon.dc.html.
 *
 * Follows the design's fields, minus "Customer": its only option is "All
 * Customer", so every coupon applies to all customers and nothing is stored.
 * "Maximum Discount" (shown in the design's details modal) is asked only for
 * percentage discounts; free delivery has no discount value at all.
 * "Applies To" is store-wide by default; "Specific products" opens a picker of
 * the vendor's own products below the fields.
 * The shared schema gives instant inline errors; the Server Action
 * re-validates and is what counts.
 */

type Values = {
  type: string;
  title: string;
  code: string;
  limitPerUser: string;
  discountType: "AMOUNT" | "PERCENTAGE";
  discount: string;
  maxDiscount: string;
  minPurchase: string;
  startDate: string;
  expireDate: string;
  appliesTo: CouponAppliesToValue;
};

const FIELD_ORDER = [
  "type", "title", "code", "appliesTo", "limitPerUser", "discountType", "discount", "maxDiscount",
  "minPurchase", "startDate", "expireDate", "productIds",
];

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I look-alikes

/** A random 10-character code. Uniqueness is still checked by the server. */
function generateCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

function initialValues(coupon?: CouponRow): Values {
  return {
    type: coupon?.type ?? "",
    title: coupon?.title ?? "",
    code: coupon?.code ?? "",
    limitPerUser: coupon ? String(coupon.limitPerUser) : "",
    discountType: coupon?.discountType ?? "AMOUNT",
    discount: coupon?.discount ?? "",
    maxDiscount: coupon?.maxDiscount ?? "",
    minPurchase: coupon && coupon.minPurchase !== "0.00" ? coupon.minPurchase : "",
    startDate: coupon?.startDate ?? "",
    expireDate: coupon?.expireDate ?? "",
    appliesTo: coupon?.appliesTo ?? "ALL_PRODUCTS",
  };
}

const initialProducts = (coupon?: CouponRow) => coupon?.products.map((p) => p.id) ?? [];

export function CouponForm({ coupon, products }: { coupon?: CouponRow; products: CouponProductOption[] }) {
  const router = useRouter();
  const [values, setValues] = useState(() => initialValues(coupon));
  const [productIds, setProductIds] = useState(() => initialProducts(coupon));
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

  const freeDelivery = values.type === "FREE_DELIVERY";
  const percentage = values.discountType === "PERCENTAGE";
  const specific = values.appliesTo === "SPECIFIC_PRODUCTS";

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    // What applies to this type; the rest is sent blank (and ignored).
    const submitted = {
      ...values,
      code: normalizeCouponCode(values.code),
      discount: freeDelivery ? "" : values.discount,
      maxDiscount: !freeDelivery && percentage ? values.maxDiscount : "",
    };
    const selectedProducts = specific ? productIds : [];
    const parsed = couponFormSchema.safeParse({ ...submitted, productIds: selectedProducts });
    const fieldErrors = parsed.success ? {} : toFieldErrors(parsed.error);
    // Zod runs the cross-field rules only once every field is valid; show
    // these two with the rest so nothing new appears on the next attempt.
    if (!parsed.success) {
      if (submitted.type !== "FREE_DELIVERY" && !submitted.discount.trim()) {
        fieldErrors.discount ??= ["Enter the discount amount."];
      }
      if (submitted.startDate && submitted.expireDate && submitted.expireDate < submitted.startDate) {
        fieldErrors.expireDate ??= ["The expire date can't be before the start date."];
      }
      if (specific && selectedProducts.length === 0) fieldErrors.productIds ??= [COUPON_PRODUCTS_REQUIRED];
    }
    // A past expire date can't be newly chosen (an existing one may be kept).
    if (parsed.success && parsed.data.expireDate < todayUtc() && values.expireDate !== coupon?.expireDate) {
      fieldErrors.expireDate = ["The expire date can't be in the past."];
    }
    if (Object.keys(fieldErrors).length) {
      setFormError(undefined);
      errors.setFieldErrors(fieldErrors);
      const first = FIELD_ORDER.find((name) => fieldErrors[name]);
      if (first) document.querySelector(`[data-field="${first}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const formData = new FormData();
    for (const [name, value] of Object.entries(submitted)) formData.set(name, value);
    formData.set("productIds", JSON.stringify(selectedProducts));
    if (coupon) formData.set("version", coupon.updatedAt);

    setFormError(undefined);
    setValues((v) => ({ ...v, code: submitted.code }));
    startTransition(async () => {
      const result = coupon ? await updateCoupon(coupon.id, formData) : await createCoupon(formData);
      if (result.ok) {
        toast.success(result.message);
        router.push("/vendor/coupons");
        return;
      }
      setFormError(result.formError);
      errors.setFieldErrors(result.fieldErrors ?? {});
    });
  }

  return (
    <form onSubmit={submit} noValidate className="rounded-[18px] border border-line-soft bg-surface p-5 shadow-xs sm:p-[26px_28px]">
      <p className="mb-5 text-[13px] leading-[1.45] text-muted">
        Coupons apply to all customers and the discount is borne by your store.
      </p>
      <FormAlert message={formError} />
      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
        <div data-field="type">
          <SelectField
            label="Coupon Type"
            name="type"
            placeholder="Select coupon type"
            options={COUPON_TYPES.map((value) => ({ value, label: COUPON_TYPE_LABEL[value] }))}
            value={values.type}
            onChange={(e) => set({ type: e.target.value })}
            errors={errors.fieldErrors.type}
            showRequiredMark
            required
          />
        </div>
        <div data-field="title">
          <Field label="Coupon Title" placeholder="Title" maxLength={100} showRequiredMark required {...text("title")} />
        </div>
        <div data-field="code">
          <Field
            label="Coupon Code"
            placeholder="Ex: SUMMER25"
            maxLength={30}
            autoComplete="off"
            spellCheck={false}
            className="[&_input]:uppercase [&_input]:placeholder:normal-case"
            showRequiredMark
            required
            hint="Letters, numbers, - or _. Saved in capitals."
            labelAside={
              <button
                type="button"
                onClick={() => set({ code: generateCode() })}
                className="cursor-pointer text-[12px] font-semibold leading-none text-iris-500 hover:text-iris-600"
              >
                Generate code
              </button>
            }
            {...text("code")}
          />
        </div>
        <div data-field="appliesTo">
          <SelectField
            label="Applies To"
            name="appliesTo"
            placeholder="Choose products"
            options={COUPON_APPLIES_TO.map((value) => ({ value, label: COUPON_APPLIES_TO_LABEL[value] }))}
            value={values.appliesTo}
            onChange={(e) => {
              set({ appliesTo: (e.target.value || "ALL_PRODUCTS") as CouponAppliesToValue });
              errors.clear("productIds");
            }}
            errors={errors.fieldErrors.appliesTo}
            showRequiredMark
            required
          />
        </div>
        <div data-field="limitPerUser">
          <Field label="Limit For Same User" inputMode="numeric" placeholder="Ex: 10" showRequiredMark required {...text("limitPerUser")} />
        </div>
        {freeDelivery ? null : (
          <>
            <div data-field="discountType">
              <SelectField
                label="Discount Type"
                name="discountType"
                placeholder="Select discount type"
                options={[
                  { value: "AMOUNT", label: "Amount" },
                  { value: "PERCENTAGE", label: "Percentage" },
                ]}
                value={values.discountType}
                onChange={(e) => set({ discountType: (e.target.value || "AMOUNT") as Values["discountType"] })}
                errors={errors.fieldErrors.discountType}
                showRequiredMark
              />
            </div>
            <div data-field="discount">
              <Field
                label={percentage ? "Discount (%)" : "Discount Amount ($)"}
                inputMode="decimal"
                placeholder={percentage ? "Ex: 15" : "Ex: 50"}
                showRequiredMark
                required
                {...text("discount")}
              />
            </div>
            {percentage ? (
              <div data-field="maxDiscount">
                <Field label="Maximum Discount ($)" inputMode="decimal" placeholder="Optional, e.g. 75" hint="Caps the percentage discount." {...text("maxDiscount")} />
              </div>
            ) : null}
          </>
        )}
        <div data-field="minPurchase">
          <Field label="Minimum Purchase ($)" inputMode="decimal" placeholder="Ex: 100" hint="Leave empty for no minimum." {...text("minPurchase")} />
        </div>
        <div data-field="startDate">
          <Field label="Start Date" type="date" showRequiredMark required {...text("startDate")} />
        </div>
        <div data-field="expireDate">
          <Field label="Expire Date" type="date" min={values.startDate || undefined} showRequiredMark required {...text("expireDate")} />
        </div>
      </div>
      {specific ? (
        <CouponProductPicker
          products={products}
          selected={productIds}
          onChange={(ids) => {
            setProductIds(ids);
            errors.clear("productIds");
          }}
          errors={errors.fieldErrors.productIds}
        />
      ) : null}
      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="secondary"
          disabled={pending}
          className="px-[30px]"
          onClick={() => {
            setValues(initialValues(coupon));
            setProductIds(initialProducts(coupon));
            errors.setFieldErrors({});
            setFormError(undefined);
          }}
        >
          Reset
        </Button>
        <Button type="submit" disabled={pending} className="px-[34px]">
          {pending ? "Saving..." : coupon ? "Save Changes" : "Submit"}
        </Button>
      </div>
    </form>
  );
}
