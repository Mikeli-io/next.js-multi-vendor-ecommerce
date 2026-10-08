"use client";

import { useRef, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Field, PasswordField, TextAreaField } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { useFieldErrors } from "@/components/ui/form-dialog";
import { UploadDropzone } from "@/components/ui/upload-dropzone";
import { createVendor } from "@/lib/actions/vendors";
import { DOCUMENT_ACCEPT, optionalDocumentSchema } from "@/lib/validation/document";
import { toFieldErrors } from "@/lib/validation/field-errors";
import { IMAGE_ACCEPT, requiredImageSchema } from "@/lib/validation/image";
import { PHONE_PLACEHOLDER } from "@/lib/validation/phone";
import { adminVendorCreateSchema } from "@/lib/validation/vendor";

const EMPTY_VALUES = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
  storeName: "",
  address: "",
  tinNumber: "",
  tinExpireDate: "",
};
type TextName = keyof typeof EMPTY_VALUES;

const EMPTY_FILES = { image: null, logo: null, coverImage: null, tinCertificate: null };
type FileName = keyof typeof EMPTY_FILES;
type Files = Record<FileName, File | null>;

/** Form order, so the first invalid field can be scrolled into view. */
const FIELD_ORDER: Array<TextName | FileName> = [
  "firstName", "lastName", "phone", "image", "email", "password", "confirmPassword",
  "storeName", "address", "logo", "coverImage", "tinNumber", "tinExpireDate", "tinCertificate",
];

const IMAGE_HINT = "JPG, PNG or WebP · Max 2 MB";

const issues = (result: { success: boolean; error?: { issues: Array<{ message: string }> } }) =>
  result.success ? undefined : result.error?.issues.map((i) => i.message);
const checkImage = (file: File) => issues(requiredImageSchema.safeParse(file));
const checkDocument = (file: File) => issues(optionalDocumentSchema.safeParse(file));

/**
 * Add New Vendor, after AdminAddVendor.dc.html: Vendor Information, Account
 * Information, Shop Information and Business TIN, then Reset / Save.
 *
 * Values live in state (as in the other admin forms) so a rejected submit
 * keeps everything entered, files included. The shared Zod schema gives
 * instant inline errors; `createVendor` re-validates and is what counts.
 */
export function AddVendorForm() {
  const router = useRouter();
  const [values, setValues] = useState(EMPTY_VALUES);
  const [files, setFiles] = useState<Files>(EMPTY_FILES);
  const [formError, setFormError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const errors = useFieldErrors();
  const formRef = useRef<HTMLFormElement>(null);

  const text = (name: TextName) => ({
    name,
    value: values[name],
    onChange: (e: { target: { value: string } }) => {
      setValues((v) => ({ ...v, [name]: e.target.value }));
      errors.clear(name);
    },
    errors: errors.fieldErrors[name],
  });

  const upload = (name: FileName) => ({
    file: files[name],
    onChange: (file: File | null, fileErrors: string[] | undefined) => {
      setFiles((f) => ({ ...f, [name]: file }));
      errors.set(name, fileErrors);
    },
    errors: errors.fieldErrors[name],
  });

  function showErrors(fieldErrors: Record<string, string[]>) {
    errors.setFieldErrors(fieldErrors);
    const first = FIELD_ORDER.find((name) => fieldErrors[name]);
    // After React paints the messages, bring the first one into view.
    requestAnimationFrame(() => {
      const target = first && formRef.current?.querySelector(`[data-field="${first}"]`);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }

  function reset() {
    setValues(EMPTY_VALUES);
    setFiles(EMPTY_FILES);
    errors.setFieldErrors({});
    setFormError(undefined);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const parsed = adminVendorCreateSchema.safeParse({
      ...values,
      image: files.image ?? undefined,
      logo: files.logo ?? undefined,
      coverImage: files.coverImage ?? undefined,
      tinCertificate: files.tinCertificate ?? undefined,
    });
    if (!parsed.success) {
      setFormError(undefined);
      showErrors(toFieldErrors(parsed.error));
      return;
    }

    const formData = new FormData();
    for (const [name, value] of Object.entries(values)) formData.set(name, value);
    for (const [name, file] of Object.entries(files)) if (file) formData.set(name, file);

    setFormError(undefined);
    startTransition(async () => {
      const result = await createVendor(formData);
      if (result.ok) {
        toast.success(result.message);
        router.push(`/admin/vendors/${result.vendorId}`);
        return;
      }
      setFormError(result.formError);
      showErrors(result.fieldErrors ?? {});
      if (result.formError) window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  return (
    <form ref={formRef} onSubmit={submit} noValidate className="flex flex-col gap-[22px]">
      <FormAlert message={formError} />

      <FormSection title="Vendor Information" description="Provide all mandatory details to create a new vendor profile.">
        <div className="grid grid-cols-1 gap-[26px] lg:grid-cols-[1fr_300px]">
          <div className="grid grid-cols-1 content-start gap-x-6 gap-y-5 sm:grid-cols-2">
            <div data-field="firstName">
              <Field label="First name" placeholder="Ex: John" autoComplete="off" maxLength={40} showRequiredMark required {...text("firstName")} />
            </div>
            <div data-field="lastName">
              <Field label="Last name" placeholder="Ex: Doe" autoComplete="off" maxLength={40} showRequiredMark required {...text("lastName")} />
            </div>
            <div data-field="phone" className="sm:col-span-2">
              <Field
                label="Phone"
                type="tel"
                inputMode="tel"
                autoComplete="off"
                placeholder={PHONE_PLACEHOLDER}
                hint="Include the country code. This is the vendor's contact number."
                maxLength={30}
                showRequiredMark
                required
                {...text("phone")}
              />
            </div>
          </div>
          <div data-field="image">
            <UploadDropzone label="Vendor Image" hint={`${IMAGE_HINT} (1:1)`} kind="image" aspect="1/1" accept={IMAGE_ACCEPT} check={checkImage} required {...upload("image")} />
          </div>
        </div>
      </FormSection>

      <FormSection title="Account Information" description="Provide the account details required for vendor operations.">
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-3">
          <div data-field="email">
            <Field label="Email" type="email" placeholder="Ex: john@company.com" autoComplete="off" maxLength={191} showRequiredMark required {...text("email")} />
          </div>
          <div data-field="password">
            <PasswordField
              label="Password"
              placeholder="Password minimum 8 characters"
              autoComplete="new-password"
              maxLength={72}
              showRequiredMark
              required
              {...text("password")}
            />
          </div>
          <div data-field="confirmPassword">
            <PasswordField label="Confirm password" placeholder="Confirm password" autoComplete="new-password" maxLength={72} showRequiredMark required {...text("confirmPassword")} />
          </div>
        </div>
        <p className="mt-3 text-[12px] leading-[1.4] text-muted-soft">
          At least 8 characters, with a letter and a number. Share it with the vendor securely; they sign in at the vendor login.
        </p>
      </FormSection>

      <FormSection title="Shop Information" description="Basic shop details provided below.">
        <div className="mb-[22px] grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
          <div data-field="storeName">
            <Field label="Shop name" placeholder="Ex: John's Store" autoComplete="off" maxLength={60} showRequiredMark required {...text("storeName")} />
          </div>
          <div data-field="address">
            <TextAreaField label="Shop address" placeholder="Ex: 148 Maple Court, New York" maxLength={100} rows={1} showRequiredMark required {...text("address")} />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div data-field="logo">
            <UploadDropzone label="Shop logo" hint={`${IMAGE_HINT} (1:1)`} kind="image" aspect="1/1" accept={IMAGE_ACCEPT} check={checkImage} required {...upload("logo")} />
          </div>
          <div data-field="coverImage">
            <UploadDropzone label="Shop cover image" hint={`${IMAGE_HINT} (4:1)`} kind="image" aspect="4/1" accept={IMAGE_ACCEPT} check={checkImage} required {...upload("coverImage")} />
          </div>
        </div>
      </FormSection>

      <FormSection title="Business TIN" description="Provide vendor business tin and related information for taxpayer verification.">
        <div className="grid grid-cols-1 gap-[26px] lg:grid-cols-[1fr_300px]">
          <div className="flex flex-col gap-5">
            <div data-field="tinNumber">
              <Field label="Taxpayer identification number (TIN)" placeholder="Type TIN number" autoComplete="off" maxLength={30} {...text("tinNumber")} />
            </div>
            <div data-field="tinExpireDate">
              <Field label="Expire Date" type="date" {...text("tinExpireDate")} />
            </div>
          </div>
          <div data-field="tinCertificate">
            <UploadDropzone
              label="TIN Certificate"
              hint="PDF, DOC, DOCX or JPG · Max 1 MB"
              kind="document"
              accept={DOCUMENT_ACCEPT}
              check={checkDocument}
              {...upload("tinCertificate")}
            />
          </div>
        </div>
      </FormSection>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button type="button" variant="secondary" onClick={reset} disabled={pending} className="px-[30px]">
          Reset
        </Button>
        <Button type="submit" disabled={pending} className="px-[30px]">
          {pending ? "Saving..." : "Save information"}
        </Button>
      </div>
    </form>
  );
}

/** One titled card of the form, as in the design. */
function FormSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-line-soft bg-surface p-5 shadow-xs sm:p-[26px_28px]">
      <div className="mb-[22px]">
        <h2 className="font-display text-[18px] font-bold leading-none text-ink">{title}</h2>
        <p className="mt-2 text-[13px] leading-[1.4] text-muted">{description}</p>
      </div>
      {children}
    </section>
  );
}
