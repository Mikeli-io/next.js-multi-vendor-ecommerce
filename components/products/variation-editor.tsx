"use client";

import { useRef, useState, type KeyboardEvent } from "react";

import { Button } from "@/components/ui/button";
import { CameraIcon, CloseIcon, PlusIcon, TrashIcon } from "@/components/ui/icons";
import { Switch } from "@/components/ui/switch";
import {
  VARIATION_LIMITS,
  combinationCount,
  combinations,
  comboKey,
  groupProblems,
  variationName,
  type AttributeGroup,
  type Attributes,
} from "@/lib/products/variations";
import { IMAGE_ACCEPT, requiredImageSchema } from "@/lib/validation/image";

/**
 * Product Variation Setup. The vendor names any attributes (Color, Size,
 * Material, Storage, ...) and lists their values as chips; every combination
 * of one value per attribute becomes a variation row with its own price,
 * stock, SKU and image. Rows can be removed (and restored). Row data is keyed
 * by the combination itself (`comboKey`), so editing other values never
 * disturbs an existing row — and the server matches saved rows the same way.
 */

export type VariationImage = { kind: "saved"; url: string } | { kind: "new"; file: File; url: string } | null;

export type VariationRow = { price: string; stock: string; sku: string; image: VariationImage };

export type EditorGroup = AttributeGroup & { uid: number };

export type VariationState = {
  enabled: boolean;
  groups: EditorGroup[];
  /** Row data by combination key; kept for combinations that come and go. */
  rows: Record<string, VariationRow>;
  /** Combinations the vendor removed. */
  excluded: string[];
};

let nextUid = 1;
export const newGroup = (name = "", values: string[] = []): EditorGroup => ({ uid: nextUid++, name, values });

/** The kept combinations, in attribute/value order. */
export function activeCombinations(state: VariationState): Attributes[] {
  const excluded = new Set(state.excluded);
  return combinations(state.groups).filter((c) => !excluded.has(comboKey(c)));
}

/**
 * Give every new combination a row: price prefilled from the closest existing
 * combination (e.g. "Red" when "Red / M" appears) or else the product price;
 * stock 0. Existing rows are never overwritten.
 */
function withRows(state: VariationState, productPrice: string): VariationState {
  const rows = { ...state.rows };
  for (const combo of combinations(state.groups)) {
    const key = comboKey(combo);
    if (rows[key]) continue;
    const parent = Object.entries(rows).find(([k]) => {
      const attrs = Object.fromEntries(JSON.parse(k) as [string, string][]);
      const names = Object.keys(attrs);
      return names.length && names.every((n) => combo[n] === attrs[n]);
    });
    rows[key] = { price: parent?.[1].price || productPrice, stock: "0", sku: "", image: null };
  }
  return { ...state, rows };
}

const INPUT =
  "h-[42px] w-full min-w-0 rounded-[10px] border border-line bg-bg-subtle px-3 text-[13.5px] text-ink outline-none transition-[border-color,background-color] duration-200 placeholder:text-muted-soft focus:bg-surface field-focus";

export function VariationEditor({
  state,
  onChange,
  productPrice,
  errors,
}: {
  state: VariationState;
  onChange: (next: VariationState) => void;
  /** The product's price, used to prefill new combinations. */
  productPrice: string;
  errors?: string[];
}) {
  const update = (next: Partial<VariationState>) => onChange(withRows({ ...state, ...next }, productPrice));
  const setGroups = (groups: EditorGroup[]) => update({ groups });
  const setGroup = (uid: number, patch: Partial<AttributeGroup>) =>
    setGroups(state.groups.map((g) => (g.uid === uid ? { ...g, ...patch } : g)));
  const setRow = (key: string, patch: Partial<VariationRow>) =>
    onChange({ ...state, rows: { ...state.rows, [key]: { ...state.rows[key], ...patch } } });

  const problems = state.enabled ? groupProblems(state.groups) : [];
  const allCombos = combinations(state.groups);
  const excluded = new Set(state.excluded);
  const kept = allCombos.filter((c) => !excluded.has(comboKey(c)));
  const removed = allCombos.filter((c) => excluded.has(comboKey(c)));
  const totalStock = kept.reduce((sum, c) => sum + (Number(state.rows[comboKey(c)]?.stock) || 0), 0);

  return (
    <section data-field="variations" className="rounded-[18px] border border-line-soft bg-surface p-5 shadow-xs sm:p-[26px_28px]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-[18px] font-bold leading-none text-ink">Product Variation Setup</h2>
          <p className="mt-2 text-[13px] leading-[1.4] text-muted">Enable and manage different variations of a product.</p>
        </div>
        <Switch
          checked={state.enabled}
          onChange={(enabled) =>
            update({ enabled, groups: enabled && !state.groups.length ? [newGroup()] : state.groups })
          }
          label="Product has variations"
        />
      </div>

      {state.enabled ? (
        <div className="mt-6 flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <p className="text-[13px] font-semibold leading-none text-ink-soft">Attributes</p>
            {state.groups.map((group, index) => (
              <AttributeGroupRow
                key={group.uid}
                group={group}
                index={index}
                onChange={(patch) => setGroup(group.uid, patch)}
                onRemove={() => setGroups(state.groups.filter((g) => g.uid !== group.uid))}
              />
            ))}
            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={state.groups.length >= VARIATION_LIMITS.groups}
                onClick={() => setGroups([...state.groups, newGroup()])}
              >
                <PlusIcon size={15} />
                Add attribute
              </Button>
              <span className="text-[12px] text-muted-soft">
                Any attribute works, e.g. Color, Size, Material, Storage. Up to {VARIATION_LIMITS.groups}.
              </span>
            </div>
          </div>

          {problems.length || errors?.length ? (
            <ul role="alert" className="flex flex-col gap-1 rounded-[12px] bg-error-bg px-4 py-3 text-[12.5px] leading-[1.45] text-error">
              {[...new Set([...problems, ...(errors ?? [])])].map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          ) : null}

          {kept.length ? (
            <div>
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-[13px] font-semibold leading-none text-ink-soft">
                  Variations <span className="font-normal text-muted">({kept.length} of {combinationCount(state.groups)} combinations)</span>
                </p>
                <p className="text-[12.5px] text-muted">Total stock: <span className="font-semibold text-ink">{totalStock}</span></p>
              </div>
              <div className="overflow-hidden rounded-[14px] border border-line-soft">
                <div className="hidden grid-cols-[minmax(130px,1.3fr)_minmax(100px,1fr)_90px_minmax(110px,1fr)_56px_40px] items-center gap-3 bg-field px-4 py-3 text-[11px] font-semibold uppercase leading-none tracking-[0.04em] text-muted md:grid">
                  <span>Variation</span>
                  <span>Price ($) *</span>
                  <span>Stock *</span>
                  <span>SKU</span>
                  <span>Image</span>
                  <span className="sr-only">Remove</span>
                </div>
                {kept.map((combo) => {
                  const key = comboKey(combo);
                  const row = state.rows[key] ?? { price: "", stock: "0", sku: "", image: null };
                  const name = variationName(state.groups, combo);
                  return (
                    <VariationRowView
                      key={key}
                      name={name}
                      row={row}
                      onChange={(patch) => setRow(key, patch)}
                      onRemove={() => onChange({ ...state, excluded: [...state.excluded, key] })}
                    />
                  );
                })}
              </div>
            </div>
          ) : null}

          {removed.length ? (
            <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
              <span>Removed:</span>
              {removed.map((combo) => {
                const key = comboKey(combo);
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onChange({ ...state, excluded: state.excluded.filter((k) => k !== key) })}
                    title="Restore this variation"
                    className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-line px-[10px] py-1 font-medium text-ink-soft transition-colors hover:border-iris-500 hover:text-iris-500"
                  >
                    <PlusIcon size={12} />
                    {variationName(state.groups, combo)}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : (
        <p className="mt-4 text-[12.5px] text-muted-soft">
          Off: this is a simple product and its stock is set under Pricing &amp; Others.
        </p>
      )}
    </section>
  );
}

function AttributeGroupRow({
  group,
  index,
  onChange,
  onRemove,
}: {
  group: EditorGroup;
  index: number;
  onChange: (patch: Partial<AttributeGroup>) => void;
  onRemove: () => void;
}) {
  const [draft, setDraft] = useState("");
  const valuesInput = useRef<HTMLInputElement>(null);

  function addValues(text: string) {
    const incoming = text
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);
    const values = [...group.values];
    for (const value of incoming) {
      if (!values.some((v) => v.localeCompare(value, undefined, { sensitivity: "accent" }) === 0)) values.push(value);
    }
    onChange({ values });
    setDraft("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      if (draft.trim()) addValues(draft);
    } else if (event.key === "Backspace" && !draft && group.values.length) {
      onChange({ values: group.values.slice(0, -1) });
    }
  }

  return (
    <div className="grid grid-cols-1 gap-3 rounded-[14px] border border-line-soft p-4 md:grid-cols-[220px_1fr_auto] md:items-start">
      <label className="flex flex-col gap-2">
        <span className="text-[12px] font-semibold leading-none text-muted">Attribute {index + 1}</span>
        <input
          className={INPUT}
          value={group.name}
          maxLength={VARIATION_LIMITS.nameLength}
          placeholder="e.g. Color"
          aria-label={`Attribute ${index + 1} name`}
          onChange={(e) => onChange({ name: e.target.value.trimStart() })}
          onBlur={(e) => onChange({ name: e.target.value.trim() })}
          onKeyDown={(e) => {
            // Enter moves on to the values instead of submitting the product form.
            if (e.key !== "Enter") return;
            e.preventDefault();
            valuesInput.current?.focus();
          }}
        />
      </label>
      <div className="flex flex-col gap-2">
        <span className="text-[12px] font-semibold leading-none text-muted">Values</span>
        <div className="flex min-h-[42px] flex-wrap items-center gap-2 rounded-[10px] border border-line bg-bg-subtle px-2 py-[5px] field-focus-within">
          {group.values.map((value) => (
            <span key={value} className="inline-flex items-center gap-1 rounded-full bg-iris-50 py-1 pl-3 pr-1 text-[12.5px] font-semibold text-iris-600">
              {value}
              <button
                type="button"
                onClick={() => onChange({ values: group.values.filter((v) => v !== value) })}
                aria-label={`Remove ${value}`}
                className="grid size-5 cursor-pointer place-items-center rounded-full hover:bg-iris-100"
              >
                <CloseIcon size={12} />
              </button>
            </span>
          ))}
          <input
            ref={valuesInput}
            className="h-8 min-w-[120px] flex-1 border-none bg-transparent px-1 text-[13.5px] text-ink outline-none placeholder:text-muted-soft"
            value={draft}
            maxLength={VARIATION_LIMITS.valueLength}
            placeholder={group.values.length ? "Add another…" : "Type a value and press Enter"}
            aria-label={`Add a value to ${group.name || `attribute ${index + 1}`}`}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => draft.trim() && addValues(draft)}
          />
        </div>
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove attribute ${group.name || index + 1}`}
        title="Remove attribute"
        className="grid size-[42px] cursor-pointer place-items-center self-end rounded-[10px] border border-error/15 bg-error-bg text-error-solid transition-colors hover:bg-error/15"
      >
        <TrashIcon size={16} />
      </button>
    </div>
  );
}

function VariationRowView({
  name,
  row,
  onChange,
  onRemove,
}: {
  name: string;
  row: VariationRow;
  onChange: (patch: Partial<VariationRow>) => void;
  onRemove: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState<string>();
  // A new image's preview URL is released when the vendor replaces or removes
  // it — not when the row unmounts: a removed combination can be restored,
  // and its row (with the same File) must still show the preview.
  const release = () => {
    if (row.image?.kind === "new") URL.revokeObjectURL(row.image.url);
  };

  function choose(file: File | undefined) {
    if (!file) return;
    const check = requiredImageSchema.safeParse(file);
    if (!check.success) {
      setImageError(check.error.issues[0]?.message);
      return;
    }
    setImageError(undefined);
    release();
    onChange({ image: { kind: "new", file, url: URL.createObjectURL(file) } });
  }

  const label = (text: string) => <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted md:sr-only">{text}</span>;

  return (
    <div data-variation={name} className="grid grid-cols-2 gap-3 border-t border-line-soft px-4 py-3 first:border-t-0 md:grid-cols-[minmax(130px,1.3fr)_minmax(100px,1fr)_90px_minmax(110px,1fr)_56px_40px] md:items-center md:first:border-t">
      <p className="col-span-2 truncate text-[13.5px] font-semibold text-ink md:col-span-1" title={name}>
        {name}
      </p>
      <label className="flex flex-col gap-1">
        {label("Price ($)")}
        <input className={INPUT} inputMode="decimal" value={row.price} aria-label={`${name} price`} onChange={(e) => onChange({ price: e.target.value })} />
      </label>
      <label className="flex flex-col gap-1">
        {label("Stock")}
        <input className={INPUT} inputMode="numeric" value={row.stock} aria-label={`${name} stock`} onChange={(e) => onChange({ stock: e.target.value })} />
      </label>
      <label className="flex flex-col gap-1">
        {label("SKU")}
        <input className={INPUT} value={row.sku} maxLength={64} placeholder="Optional" aria-label={`${name} SKU`} onChange={(e) => onChange({ sku: e.target.value })} />
      </label>
      <div className="flex items-center gap-2 md:block">
        {label("Image")}
        <div className="relative">
          <button
            type="button"
            onClick={() => input.current?.click()}
            title={row.image ? "Replace image" : "Add image"}
            aria-label={`${row.image ? "Replace" : "Add"} image for ${name}`}
            className={`relative grid size-[42px] cursor-pointer place-items-center overflow-hidden rounded-[10px] border border-dashed text-muted-soft transition-colors hover:border-iris-500 hover:text-iris-500 ${imageError ? "border-error" : "border-line-strong"}`}
          >
            {row.image ? (
              // eslint-disable-next-line @next/next/no-img-element -- saved upload or local blob preview
              <img src={row.image.url} alt="" className="absolute inset-0 size-full object-cover" />
            ) : (
              <CameraIcon size={16} />
            )}
          </button>
          {row.image ? (
            <button
              type="button"
              onClick={() => {
                release();
                onChange({ image: null });
              }}
              aria-label={`Remove image for ${name}`}
              className="absolute -right-2 -top-2 grid size-5 cursor-pointer place-items-center rounded-full bg-ink text-surface"
            >
              <CloseIcon size={11} />
            </button>
          ) : null}
        </div>
        <input
          ref={input}
          type="file"
          accept={IMAGE_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            choose(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
        {imageError ? <p className="mt-1 text-[11px] text-error md:absolute">{imageError}</p> : null}
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove variation ${name}`}
        title="Remove variation"
        className="grid size-9 cursor-pointer place-items-center justify-self-end rounded-[9px] border border-error/15 bg-error-bg text-error-solid transition-colors hover:bg-error/15"
      >
        <TrashIcon size={15} />
      </button>
    </div>
  );
}
