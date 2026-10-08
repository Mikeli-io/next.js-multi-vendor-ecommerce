"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Field, TextAreaField } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { useFieldErrors } from "@/components/ui/form-dialog";
import { FileIcon, ShopFrontIcon } from "@/components/ui/icons";
import { UploadDropzone } from "@/components/ui/upload-dropzone";
import { PROFILE_CARD, ProfileCardTitle } from "@/components/vendors/profile-parts";
import { updateVendorStore } from "@/lib/actions/vendor-profile";
import { DOCUMENT_ACCEPT, optionalDocumentSchema } from "@/lib/validation/document";
import { toFieldErrors } from "@/lib/validation/field-errors";
import {
  TIN_EXPIRED,
  TIN_NUMBER_NEEDED,
  isExpired,
  tinNumberPresentIfNeeded,
  vendorStoreSchema,
} from "@/lib/validation/vendor";

type Values = { storeName: string; address: string; tinNumber: string; tinExpireDate: string };

const checkDocument = (file: File) => {
  const result = optionalDocumentSchema.safeParse(file);
  return result.success ? undefined : result.error.issues.map((i) => i.message);
};

/**
 * Store Information and Business TIN on Profile Settings. Fields and rules
 * are Add New Vendor's (shared schemas, `UploadDropzone`); the certificate is
 * stored privately and opened through /vendor/profile/tin-certificate, which
 * only ever serves the signed-in vendor's own file. The store logo and cover
 * are managed in the header above (StoreBranding).
 */
export function VendorStoreForm({
  initial,
  certificate,
}: {
  initial: Values;
  /** The stored certificate's type, or null when there is none. */
  certificate: { ext: string } | null;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [file, setFile] = useState<File | null>(null);
  const [removeCertificate, setRemoveCertificate] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const errors = useFieldErrors();

  const text = (name: keyof Values) => ({
    name,
    value: values[name],
    onChange: (e: { target: { value: string } }) => {
      setValues((v) => ({ ...v, [name]: e.target.value }));
      errors.clear(name);
    },
    errors: errors.fieldErrors[name],
  });

  const keepsCertificate = Boolean(certificate) && !removeCertificate && !file;
  const storedDateExpired = Boolean(initial.tinExpireDate) && values.tinExpireDate === initial.tinExpireDate &&
    isExpired(new Date(`${initial.tinExpireDate}T00:00:00Z`));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const parsed = vendorStoreSchema.safeParse({ ...values, tinCertificate: file ?? undefined, removeTinCertificate: removeCertificate });
    const fieldErrors = parsed.success ? {} : toFieldErrors(parsed.error);
    // The rules that depend on stored values, as the server applies them.
    if (parsed.success) {
      const { tinNumber, tinExpireDate } = parsed.data;
      if (values.tinExpireDate !== initial.tinExpireDate && isExpired(tinExpireDate)) fieldErrors.tinExpireDate = [TIN_EXPIRED];
      if (!tinNumberPresentIfNeeded(tinNumber, tinExpireDate, Boolean(file) || keepsCertificate)) fieldErrors.tinNumber = [TIN_NUMBER_NEEDED];
    }
    if (Object.keys(fieldErrors).length) {
      setFormError(undefined);
      errors.setFieldErrors(fieldErrors);
      return;
    }

    const formData = new FormData();
    for (const [name, value] of Object.entries(values)) formData.set(name, value);
    if (file) formData.set("tinCertificate", file);
    if (removeCertificate) formData.set("removeTinCertificate", "1");

    setFormError(undefined);
    startTransition(async () => {
      const result = await updateVendorStore(formData);
      if (!result.ok) {
        setFormError(result.formError);
        errors.setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      toast.success(result.message);
      setFile(null);
      setRemoveCertificate(false);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-[22px]">
      <section className={`${PROFILE_CARD} px-5 py-6 sm:p-[30px]`}>
        <ProfileCardTitle icon={ShopFrontIcon} title="Store Information" />
        <p className="mt-3 text-[13px] leading-[1.4] text-muted">
          Shown to customers on your store. Your logo and cover are changed in the header above.
        </p>
        <div className="mt-6">
          <FormAlert message={formError} />
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-[22px] md:grid-cols-2">
          <Field label="Shop name" placeholder="Ex: John's Store" autoComplete="organization" maxLength={60} showRequiredMark required {...text("storeName")} />
          <TextAreaField label="Shop address" placeholder="Ex: 148 Maple Court, New York" maxLength={100} rows={1} showRequiredMark required {...text("address")} />
        </div>
      </section>

      <section className={`${PROFILE_CARD} px-5 py-6 sm:p-[30px]`}>
        <ProfileCardTitle icon={FileIcon} title="Business TIN" />
        <p className="mt-3 text-[13px] leading-[1.4] text-muted">
          Your taxpayer identification, for verification by the Covet team. Optional; the certificate is kept private.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-[26px] lg:grid-cols-[1fr_300px]">
          <div className="flex flex-col gap-5">
            <Field label="Taxpayer identification number (TIN)" placeholder="Type TIN number" autoComplete="off" maxLength={30} {...text("tinNumber")} />
            <Field
              label="Expire Date"
              type="date"
              hint={storedDateExpired ? "This TIN has expired — enter the new expiry date." : undefined}
              {...text("tinExpireDate")}
            />
          </div>
          <div className="flex flex-col gap-3">
            {certificate && !file ? (
              <div className="flex items-center gap-3 rounded-[12px] border border-line-soft bg-bg-subtle px-4 py-3">
                <span className="grid size-9 flex-none place-items-center rounded-[9px] bg-iris-50 text-iris-500">
                  <FileIcon size={17} />
                </span>
                <div className="min-w-0 flex-1 text-[12.5px] leading-[1.35]">
                  <p className={`font-semibold ${removeCertificate ? "text-muted line-through" : "text-ink"}`}>
                    TIN certificate ({certificate.ext.toUpperCase()})
                  </p>
                  {removeCertificate ? (
                    <p className="text-muted">Removed when you save.</p>
                  ) : (
                    <a href="/vendor/profile/tin-certificate" target="_blank" rel="noopener" className="font-semibold text-iris-500 hover:text-iris-600">
                      View
                    </a>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setRemoveCertificate((r) => !r)}
                  aria-label={removeCertificate ? "Undo remove certificate" : "Remove certificate"}
                  className={`cursor-pointer text-[12.5px] font-semibold ${removeCertificate ? "text-iris-500 hover:text-iris-600" : "text-error hover:text-error-solid"}`}
                >
                  {removeCertificate ? "Undo" : "Remove"}
                </button>
              </div>
            ) : null}
            <div data-field="tinCertificate">
              <UploadDropzone
                label={certificate ? "Replace TIN Certificate" : "TIN Certificate"}
                hint="PDF, DOC, DOCX or JPG · Max 1 MB"
                kind="document"
                accept={DOCUMENT_ACCEPT}
                check={checkDocument}
                file={file}
                onChange={(next, fileErrors) => {
                  setFile(next);
                  errors.set("tinCertificate", fileErrors);
                }}
                errors={errors.fieldErrors.tinCertificate}
              />
            </div>
          </div>
        </div>
      </section>

      {/* One save for both cards, below them, as in Add New Vendor. */}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending} className="h-12 w-full px-[30px] text-[14px] sm:w-auto">
          {pending ? "Saving..." : "Save Store Details"}
        </Button>
      </div>
    </form>
  );
}
