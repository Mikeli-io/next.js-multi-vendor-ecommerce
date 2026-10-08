"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";

import { CloseIcon, ImageIcon } from "@/components/ui/icons";
import { IMAGE_ACCEPT, requiredImageSchema } from "@/lib/validation/image";
import { GALLERY_LIMIT } from "@/lib/validation/product";

/**
 * Product Additional Images (`Product.gallery`). Saved images and newly
 * picked files sit in one ordered list; each can be removed. New files are
 * checked on pick with the shared image rule; the server re-checks the bytes.
 */

export type GalleryItem = { kind: "saved"; path: string } | { kind: "new"; uid: number; file: File; url: string };

let nextUid = 1;

export function GalleryEditor({
  items,
  onChange,
  errors,
}: {
  items: GalleryItem[];
  onChange: (items: GalleryItem[]) => void;
  errors?: string[];
}) {
  const input = useRef<HTMLInputElement>(null);
  const [pickError, setPickError] = useState<string>();
  const [dragging, setDragging] = useState(false);
  const urls = useRef(new Set<string>());

  // Release every preview URL when the editor unmounts.
  useEffect(() => {
    const owned = urls.current;
    return () => owned.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  function add(files: FileList | null) {
    if (!files?.length) return;
    const room = GALLERY_LIMIT - items.length;
    const accepted: GalleryItem[] = [];
    let problem: string | undefined;
    for (const file of Array.from(files)) {
      if (accepted.length >= room) {
        problem = `Add at most ${GALLERY_LIMIT} additional images.`;
        break;
      }
      const check = requiredImageSchema.safeParse(file);
      if (!check.success) {
        problem = `${file.name}: ${check.error.issues[0]?.message}`;
        continue;
      }
      const url = URL.createObjectURL(file);
      urls.current.add(url);
      accepted.push({ kind: "new", uid: nextUid++, file, url });
    }
    setPickError(problem);
    if (accepted.length) onChange([...items, ...accepted]);
  }

  function remove(index: number) {
    const item = items[index];
    if (item.kind === "new") {
      URL.revokeObjectURL(item.url);
      urls.current.delete(item.url);
    }
    setPickError(undefined);
    onChange(items.filter((_, i) => i !== index));
  }

  function drop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    add(event.dataTransfer.files);
  }

  const shownError = pickError ?? errors?.[0];

  return (
    <section data-field="gallery" className="rounded-[18px] border border-line-soft bg-surface p-5 shadow-xs sm:p-[26px_28px]">
      <div className="mb-5">
        <h2 className="font-display text-[18px] font-bold leading-none text-ink">Product Additional Images</h2>
        <p className="mt-2 text-[13px] leading-[1.4] text-muted">
          Upload additional images for this product. JPG, PNG or WebP · Max 2 MB each · Up to {GALLERY_LIMIT} · Square works best.
        </p>
      </div>
      <ul className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-4">
        {items.map((item, index) => {
          const src = item.kind === "saved" ? item.path : item.url;
          return (
            <li key={item.kind === "saved" ? item.path : item.uid} className="relative aspect-square overflow-hidden rounded-[12px] border border-line-soft bg-bg-subtle">
              {/* eslint-disable-next-line @next/next/no-img-element -- saved upload or local blob preview */}
              <img src={src} alt={`Additional image ${index + 1}`} className="size-full object-cover" />
              {item.kind === "new" ? (
                <span className="absolute bottom-2 left-2 rounded-full bg-surface/90 px-2 py-[2px] text-[10.5px] font-semibold text-iris-600">New</span>
              ) : null}
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label={`Remove additional image ${index + 1}`}
                title="Remove image"
                className="absolute right-2 top-2 grid size-7 cursor-pointer place-items-center rounded-full bg-ink/75 text-surface transition-colors hover:bg-error-solid"
              >
                <CloseIcon size={14} />
              </button>
            </li>
          );
        })}
        {items.length < GALLERY_LIMIT ? (
          <li>
            <button
              type="button"
              onClick={() => input.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={drop}
              className={`flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-[6px] rounded-[12px] border-[1.5px] border-dashed p-3 text-center transition-colors duration-200 ${
                shownError ? "border-error" : dragging ? "border-iris-500 bg-iris-50" : "border-line-strong bg-bg-subtle hover:border-iris-500"
              }`}
            >
              <ImageIcon className="text-muted-soft" />
              <span className="text-[12px] font-semibold leading-tight text-iris-500">Click to upload</span>
              <span className="text-[11px] leading-tight text-muted-soft">Or drag and drop</span>
            </button>
          </li>
        ) : null}
      </ul>
      <input
        ref={input}
        type="file"
        multiple
        accept={IMAGE_ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        aria-label="Add additional images"
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />
      {shownError ? (
        <p role="alert" className="mt-3 text-[12px] leading-[1.4] text-error">
          {shownError}
        </p>
      ) : null}
    </section>
  );
}
