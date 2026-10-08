"use client";

import { useEffect, useId, useRef, useState, type DragEvent } from "react";

import { FileIcon, ImageIcon, UploadIcon } from "./icons";

/**
 * The designs' dashed "Click to upload / Or drag and drop" box, for images
 * (with a preview at the given aspect ratio) and documents (file name + size).
 *
 * Controlled — the parent owns the chosen `file` and builds the FormData, as
 * the other admin forms do; setting `file` to null (e.g. Reset) clears it.
 * `check` runs the same Zod rule the server uses the moment a file is picked
 * or dropped; the server still re-checks the actual bytes.
 */
export function UploadDropzone({
  label,
  hint,
  kind,
  aspect = "1/1",
  accept,
  file,
  onChange,
  check,
  errors,
  required,
  currentUrl,
}: {
  label: string;
  /** Format/size line under the label, e.g. "JPG, PNG or WebP · Max 2 MB (1:1)". */
  hint: string;
  kind: "image" | "document";
  /** Preview box ratio for images, e.g. "1/1" or "4/1". */
  aspect?: string;
  accept: string;
  file: File | null;
  onChange: (file: File | null, errors: string[] | undefined) => void;
  check: (file: File) => string[] | undefined;
  errors?: string[];
  required?: boolean;
  /** An image already saved (edit forms), shown until a new file is chosen. */
  currentUrl?: string | null;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  // The preview belongs to one File; a different (or no) file ignores it.
  const [preview, setPreview] = useState<{ file: File; url: string } | null>(null);
  const previewToRelease = useRef<string | null>(null);

  useEffect(() => () => {
    if (previewToRelease.current) URL.revokeObjectURL(previewToRelease.current);
  }, []);

  function choose(next: File | null) {
    if (preview) URL.revokeObjectURL(preview.url);
    const nextPreview = next && kind === "image" ? { file: next, url: URL.createObjectURL(next) } : null;
    previewToRelease.current = nextPreview?.url ?? null;
    setPreview(nextPreview);
    onChange(next, next ? check(next) : undefined);
  }

  function drop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) choose(dropped);
  }

  const hasError = Boolean(errors?.length);
  const previewUrl = file && preview?.file === file ? preview.url : file ? null : (currentUrl ?? null);
  const errorId = `${id}-error`;

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="block text-[13px] font-semibold leading-none text-ink-soft">
        {label} {required ? <span className="text-error">*</span> : null}
      </label>
      <p className="mb-3 mt-[7px] text-[11.5px] leading-[1.4] text-muted-soft">{hint}</p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={drop}
        style={kind === "image" ? { aspectRatio: aspect } : undefined}
        className={`relative flex w-full items-center justify-center overflow-hidden rounded-[12px] border-[1.5px] border-dashed bg-surface transition-colors duration-200 ${
          kind === "image" ? (aspect === "1/1" ? "mx-auto max-w-[200px]" : "") : "min-h-[150px]"
        } ${hasError ? "border-error" : dragging ? "border-iris-500 bg-iris-50" : "border-line-strong hover:border-iris-500"}`}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- local blob: preview, not an optimizable URL
          <img src={previewUrl} alt={`${label} preview`} className="absolute inset-0 size-full object-cover" />
        ) : null}

        <button
          type="button"
          onClick={() => input.current?.click()}
          aria-describedby={hasError ? errorId : undefined}
          className={`relative z-[1] flex size-full cursor-pointer flex-col items-center justify-center gap-[6px] p-4 text-center ${
            previewUrl ? "opacity-0 hover:bg-ink/40 hover:opacity-100 focus-visible:bg-ink/40 focus-visible:opacity-100" : ""
          }`}
        >
          {previewUrl ? (
            <span className="rounded-[8px] bg-surface px-3 py-2 text-[12px] font-semibold text-ink-soft">Replace image</span>
          ) : file ? (
            <>
              <FileIcon size={26} className="text-iris-500" />
              <span className="max-w-full truncate text-[12.5px] font-semibold text-ink-soft">{file.name}</span>
              <span className="text-[11px] text-muted-soft">{formatSize(file.size)} · click to replace</span>
            </>
          ) : (
            <>
              {kind === "image" ? (
                <ImageIcon className="text-muted-soft" />
              ) : (
                <UploadIcon size={26} className="text-muted-soft" />
              )}
              <span className="mt-1 text-[12px] font-semibold leading-none text-iris-500">
                {kind === "image" ? "Click to upload" : "Select a file"}
              </span>
              <span className="text-[11px] leading-none text-muted-soft">Or drag and drop</span>
            </>
          )}
        </button>

        <input
          ref={input}
          id={id}
          type="file"
          accept={accept}
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            choose(e.target.files?.[0] ?? null);
            // Clear so picking the same file again still fires `change`.
            e.target.value = "";
          }}
        />
      </div>

      {file ? (
        <div className="mt-2 flex items-center justify-between gap-3 text-[12px] leading-[1.4] text-muted-soft">
          <span className="min-w-0 truncate">{kind === "image" ? file.name : ""}</span>
          <button
            type="button"
            onClick={() => choose(null)}
            className="flex-none cursor-pointer font-semibold text-muted hover:text-ink"
          >
            Remove
          </button>
        </div>
      ) : null}

      {hasError ? (
        <p id={errorId} className="mt-[7px] text-[12px] leading-[1.4] text-error">
          {errors?.[0]}
        </p>
      ) : null}
    </div>
  );
}

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
