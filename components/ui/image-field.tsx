"use client";

import { useEffect, useId, useRef, useState } from "react";

import { IMAGE_ACCEPT, optionalImageSchema } from "@/lib/validation/image";
import { UploadIcon } from "./icons";
import { ImageThumb } from "./image-thumb";

/**
 * Image upload control for admin forms: preview tile, Upload/Replace, Undo.
 *
 * Controlled — the parent owns the chosen `file`. Type and size are checked
 * the moment a file is picked, and the result is reported through `onChange`
 * so the form can show it inline; the server re-checks the actual bytes.
 */
export function ImageField({
  label,
  file,
  onChange,
  currentImage,
  previewName,
  errors,
}: {
  label: string;
  file: File | null;
  onChange: (file: File | null, errors: string[] | undefined) => void;
  /** The saved image when editing; kept unless a replacement is chosen. */
  currentImage?: string | null;
  /** Used for the placeholder initial when there is no image. */
  previewName: string;
  errors?: string[];
}) {
  const input = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  // Mirrors `preview` for the unmount cleanup, which cannot read state.
  const previewToRelease = useRef<string | null>(null);
  const id = useId();

  // Release the last preview URL when the field unmounts.
  useEffect(() => () => {
    if (previewToRelease.current) URL.revokeObjectURL(previewToRelease.current);
  }, []);

  function choose(next: File | null) {
    if (preview) URL.revokeObjectURL(preview);
    const url = next ? URL.createObjectURL(next) : null;
    previewToRelease.current = url;
    setPreview(url);
    const check = optionalImageSchema.safeParse(next ?? undefined);
    onChange(next, check.success ? undefined : check.error.issues.map((i) => i.message));
  }

  const shown = file ? preview : (currentImage ?? null);
  const hasError = Boolean(errors?.length);

  return (
    <div>
      <label htmlFor={id} className="mb-[9px] block text-[13px] font-semibold leading-none text-ink-soft">
        {label}
      </label>
      <div
        className={`flex items-center gap-4 rounded-[12px] border border-dashed bg-bg-subtle p-4 ${
          hasError ? "border-error" : "border-line-strong"
        }`}
      >
        <ImageThumb src={shown} name={previewName || "?"} size={64} />
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={() => input.current?.click()}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-[10px] border border-line bg-surface px-4 text-[13px] font-semibold leading-none text-ink-soft transition-colors duration-150 hover:bg-field"
          >
            <UploadIcon size={16} />
            {shown ? "Replace image" : "Upload image"}
          </button>
          <p className="mt-2 truncate text-[12px] leading-[1.4] text-muted-soft">
            {file ? file.name : currentImage ? "Keeping the current image." : "JPG, PNG or WebP, up to 2 MB."}
          </p>
        </div>
        {file ? (
          <button
            type="button"
            onClick={() => {
              choose(null);
              if (input.current) input.current.value = "";
            }}
            className="cursor-pointer text-[12.5px] font-semibold text-muted hover:text-ink"
          >
            Undo
          </button>
        ) : null}
        <input
          ref={input}
          id={id}
          type="file"
          name="image"
          accept={IMAGE_ACCEPT}
          className="sr-only"
          onChange={(e) => choose(e.target.files?.[0] ?? null)}
        />
      </div>
      {hasError ? <p className="mt-[7px] text-[12px] leading-[1.4] text-error">{errors?.[0]}</p> : null}
    </div>
  );
}
