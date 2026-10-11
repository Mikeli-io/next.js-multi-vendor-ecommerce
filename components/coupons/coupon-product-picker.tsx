"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { ProductThumb } from "@/components/products/product-parts";
import { CHECKBOX_INPUT } from "@/components/ui/field";
import { SearchIcon } from "@/components/ui/icons";
import type { CouponProductOption } from "@/lib/coupons/queries";

/**
 * "Specific products" picker for a coupon: the vendor's own products (loaded
 * on the server, scoped to the session's store) as checkbox rows with
 * thumbnail, name and SKU. A filter box keeps a long catalogue usable; the
 * selection persists across filtering. The Server Action re-checks that every
 * selected id belongs to the vendor.
 */
export function CouponProductPicker({
  products,
  selected,
  onChange,
  errors,
}: {
  products: CouponProductOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  errors?: string[];
}) {
  const [filter, setFilter] = useState("");
  const chosen = useMemo(() => new Set(selected), [selected]);
  const query = filter.trim().toLowerCase();
  const shown = query
    ? products.filter((p) => p.name.toLowerCase().includes(query) || p.sku?.toLowerCase().includes(query))
    : products;
  const allShownChosen = shown.length > 0 && shown.every((p) => chosen.has(p.id));

  function toggle(id: string) {
    onChange(chosen.has(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }

  function toggleShown() {
    const ids = new Set(shown.map((p) => p.id));
    onChange(allShownChosen ? selected.filter((id) => !ids.has(id)) : [...new Set([...selected, ...ids])]);
  }

  const hasError = Boolean(errors?.length);

  return (
    <section data-field="productIds" aria-labelledby="coupon-products-title" className="mt-6 border-t border-line-soft pt-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 id="coupon-products-title" className="font-display text-[15px] font-bold leading-none text-ink">
            Select products <span className="text-error">*</span>
          </h3>
          <p className="mt-2 text-[12.5px] text-muted">The coupon applies only to the products you tick.</p>
        </div>
        <p aria-live="polite" className="text-[12.5px] font-semibold text-iris-500">
          {selected.length} selected
        </p>
      </div>

      {products.length === 0 ? (
        <div className="rounded-[14px] border border-dashed border-line-strong bg-bg-subtle px-5 py-8 text-center">
          <p className="font-display text-[14px] font-bold text-ink">You don&apos;t have any products yet</p>
          <p className="mt-2 text-[12.5px] text-muted">
            Add a product first, or apply this coupon to all your products.
          </p>
          <Link href="/vendor/products/new" className="mt-3 inline-block text-[13px] font-semibold">
            Add a product
          </Link>
        </div>
      ) : (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <label className="flex h-[42px] min-w-0 flex-1 items-center rounded-[10px] border border-line bg-bg-subtle field-focus-within sm:min-w-[240px]">
              <span className="px-3 text-muted-soft">
                <SearchIcon size={15} />
              </span>
              <span className="sr-only">Filter products</span>
              <input
                type="search"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter by name or SKU"
                className="h-full min-w-0 flex-1 border-none bg-transparent pr-3 text-[13.5px] text-ink outline-none placeholder:text-muted-soft"
              />
            </label>
            <button
              type="button"
              onClick={toggleShown}
              disabled={shown.length === 0}
              className="cursor-pointer text-[12.5px] font-semibold text-iris-500 hover:text-iris-600 disabled:cursor-not-allowed disabled:text-muted-soft"
            >
              {allShownChosen ? (query ? "Unselect shown" : "Unselect all") : query ? "Select shown" : "Select all"}
            </button>
          </div>

          <ul
            aria-label="Your products"
            className={`max-h-[360px] overflow-y-auto rounded-[14px] border ${hasError ? "border-error" : "border-line-soft"}`}
          >
            {shown.map((product) => {
              const checked = chosen.has(product.id);
              return (
                <li key={product.id} className="border-t border-line-soft first:border-t-0">
                  <label
                    className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors duration-150 ${
                      checked ? "bg-iris-50/60" : "hover:bg-bg-subtle"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="productIds"
                      value={product.id}
                      checked={checked}
                      onChange={() => toggle(product.id)}
                      className={CHECKBOX_INPUT}
                    />
                    <ProductThumb src={product.thumbnail} name={product.name} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold text-ink">{product.name}</span>
                      <span className="mt-1 block truncate text-[11.5px] text-muted-soft">
                        {product.sku ? `SKU ${product.sku}` : "No SKU"}
                        {!product.isActive ? " · Inactive" : ""}
                        {product.approvalStatus === "PENDING" ? " · Pending approval" : product.approvalStatus === "REJECTED" ? " · Rejected" : ""}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
            {shown.length === 0 ? (
              <li className="px-4 py-6 text-center text-[12.5px] text-muted">No products match &ldquo;{filter}&rdquo;.</li>
            ) : null}
          </ul>
        </>
      )}

      {hasError ? (
        <p role="alert" className="mt-[7px] text-[12px] leading-[1.4] text-error">
          {errors?.[0]}
        </p>
      ) : null}
    </section>
  );
}
