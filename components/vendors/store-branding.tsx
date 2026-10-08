"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { CameraIcon, ShopFrontIcon, TrashIcon } from "@/components/ui/icons";
import { updateStoreBranding } from "@/lib/actions/vendor-profile";
import { IMAGE_ACCEPT, requiredImageSchema } from "@/lib/validation/image";
import type { StoreImageField } from "@/lib/validation/vendor";

const LABEL: Record<StoreImageField, string> = { logo: "store logo", coverImage: "cover image" };

const PILL =
  "inline-flex h-9 cursor-pointer items-center gap-[7px] rounded-[10px] bg-surface/90 px-3 text-[12.5px] font-semibold leading-none text-ink-soft shadow-xs backdrop-blur transition-colors duration-150 hover:bg-surface hover:text-iris-500 disabled:cursor-not-allowed disabled:opacity-60";

/**
 * The profile header's store branding: the cover banner (`Vendor.coverImage`)
 * and the round store logo (`Vendor.logo`). Each can be changed or removed;
 * a change is saved as soon as a valid image is picked, a removal after a
 * confirmation. The owner photo (`Vendor.image`) is not shown or edited here.
 */
export function StoreBranding({
  storeName,
  logo,
  coverImage,
}: {
  storeName: string;
  logo: string | null;
  coverImage: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<StoreImageField | null>(null);
  const [preview, setPreview] = useState<{ field: StoreImageField; url: string } | null>(null);
  const [removing, setRemoving] = useState<StoreImageField | null>(null);
  const [removeError, setRemoveError] = useState<string>();
  const logoInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);

  // Release a preview's object URL once it is replaced or cleared.
  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview.url);
  }, [preview]);

  function run(field: StoreImageField, formData: FormData, onDone?: (ok: boolean, error?: string) => void) {
    setBusy(field);
    startTransition(async () => {
      const result = await updateStoreBranding(formData);
      if (result.ok) {
        toast.success(result.message);
        // Re-read the saved paths before dropping the local preview.
        router.refresh();
      } else if (!onDone) {
        toast.error(result.formError ?? "Something went wrong. Please try again.");
      }
      setPreview(null);
      setBusy(null);
      onDone?.(result.ok, result.ok ? undefined : result.formError);
    });
  }

  function upload(field: StoreImageField, file: File | undefined) {
    if (!file || pending) return;
    const check = requiredImageSchema.safeParse(file);
    if (!check.success) {
      toast.error(check.error.issues[0]?.message ?? "Use a JPG, PNG or WebP image.");
      return;
    }
    setPreview({ field, url: URL.createObjectURL(file) });
    const formData = new FormData();
    formData.set("op", "replace");
    formData.set("field", field);
    formData.set("file", file);
    run(field, formData);
  }

  function confirmRemove() {
    if (!removing) return;
    const formData = new FormData();
    formData.set("op", "remove");
    formData.set("field", removing);
    setRemoveError(undefined);
    run(removing, formData, (ok, error) => {
      if (ok) setRemoving(null);
      else setRemoveError(error);
    });
  }

  const shownCover = preview?.field === "coverImage" ? preview.url : coverImage;
  const shownLogo = preview?.field === "logo" ? preview.url : logo;

  return (
    <>
      <div className="relative h-[160px] bg-[linear-gradient(120deg,var(--iris-100)_0%,var(--iris-50)_50%,#fbfaff_100%)] sm:h-[200px]">
        {shownCover ? (
          <Image
            src={shownCover}
            alt={`${storeName} cover`}
            fill
            sizes="(min-width: 1280px) 1200px, 100vw"
            unoptimized
            className={`object-cover transition-opacity ${busy === "coverImage" ? "opacity-60" : ""}`}
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[repeating-linear-gradient(115deg,rgba(101,68,224,0.05)_0_1px,transparent_1px_26px)]"
          />
        )}

        <div className="absolute right-3 top-3 flex gap-2 sm:right-4 sm:top-4">
          <button type="button" className={PILL} disabled={pending} onClick={() => coverInput.current?.click()}>
            <CameraIcon size={15} />
            {busy === "coverImage" ? "Saving..." : coverImage ? "Change cover" : "Add cover"}
          </button>
          {coverImage ? (
            <button
              type="button"
              className={`${PILL} hover:!text-error-solid`}
              disabled={pending}
              onClick={() => setRemoving("coverImage")}
              aria-label="Remove cover image"
            >
              <TrashIcon size={15} />
              <span className="hidden sm:inline">Remove</span>
            </button>
          ) : null}
        </div>

        <div className="absolute bottom-[-52px] left-1/2 -translate-x-1/2">
          <div className="relative grid size-[120px] place-items-center rounded-full border-4 border-surface bg-surface text-iris-500 shadow-[0_10px_30px_-10px_rgba(20,18,31,0.3)]">
            {shownLogo ? (
              <span className="absolute inset-0 overflow-hidden rounded-full">
                <Image
                  src={shownLogo}
                  alt={`${storeName} logo`}
                  fill
                  sizes="120px"
                  unoptimized
                  className={`object-cover transition-opacity ${busy === "logo" ? "opacity-60" : ""}`}
                />
              </span>
            ) : (
              <ShopFrontIcon size={44} strokeWidth={1.6} />
            )}
            <button
              type="button"
              onClick={() => logoInput.current?.click()}
              disabled={pending}
              aria-label={logo ? "Change store logo" : "Add store logo"}
              title={logo ? "Change store logo" : "Add store logo"}
              className="absolute bottom-[2px] right-[2px] grid size-[34px] cursor-pointer place-items-center rounded-full border-[3px] border-surface bg-iris-500 text-surface transition-colors duration-200 hover:bg-iris-600 disabled:cursor-not-allowed"
            >
              <CameraIcon size={15} />
            </button>
          </div>
        </div>

        {(["logo", "coverImage"] as const).map((field) => (
          <input
            key={field}
            ref={field === "logo" ? logoInput : coverInput}
            type="file"
            name={field}
            accept={IMAGE_ACCEPT}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              upload(field, e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        ))}
      </div>

      <div className="mt-[64px] flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-5 text-center text-[12px] leading-[1.4] text-muted-soft">
        <span className="font-semibold text-ink-soft">{busy === "logo" ? "Saving logo..." : "Store logo"}</span>
        <span aria-hidden="true">·</span>
        <button
          type="button"
          onClick={() => logoInput.current?.click()}
          disabled={pending}
          className="cursor-pointer font-semibold text-iris-500 hover:text-iris-600 disabled:cursor-not-allowed"
        >
          {logo ? "Change" : "Upload"}
        </button>
        {logo ? (
          <>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => setRemoving("logo")}
              disabled={pending}
              aria-label="Remove store logo"
              className="cursor-pointer font-semibold text-error hover:text-error-solid disabled:cursor-not-allowed"
            >
              Remove
            </button>
          </>
        ) : null}
        <span className="basis-full">JPG, PNG or WebP · Max 2 MB · Square logo, wide cover</span>
      </div>

      <ConfirmDialog
        open={removing !== null}
        onClose={() => {
          if (pending) return;
          setRemoving(null);
          setRemoveError(undefined);
        }}
        onConfirm={confirmRemove}
        title={removing ? `Remove ${LABEL[removing]}?` : ""}
        body={
          removing === "logo"
            ? "Your store will show a placeholder instead of its logo until you upload a new one."
            : "Your store will show the default banner until you upload a new cover."
        }
        confirmLabel="Remove"
        pending={pending}
        error={removeError}
      />
    </>
  );
}
