"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { useFieldErrors } from "@/components/ui/form-dialog";
import { UserIcon } from "@/components/ui/icons";
import { ProfileCardTitle } from "@/components/vendors/profile-parts";
import { updateVendorProfile } from "@/lib/actions/vendor-profile";
import { toFieldErrors } from "@/lib/validation/field-errors";
import { PHONE_PLACEHOLDER } from "@/lib/validation/phone";
import { vendorProfileSchema } from "@/lib/validation/vendor";

type Values = { firstName: string; lastName: string; phone: string };

/**
 * Basic Information, after VendorProfile.dc.html: names, phone and email.
 * Sits under the store branding header (StoreBranding) in the same card.
 * The shared schema gives instant inline errors; `updateVendorProfile`
 * re-validates and is what counts.
 */
export function VendorProfileForm({ initial, email }: { initial: Values; email: string }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
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

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    const parsed = vendorProfileSchema.safeParse(values);
    if (!parsed.success) {
      setFormError(undefined);
      errors.setFieldErrors(toFieldErrors(parsed.error));
      return;
    }

    const formData = new FormData();
    for (const [name, value] of Object.entries(values)) formData.set(name, value);

    setFormError(undefined);
    startTransition(async () => {
      const result = await updateVendorProfile(formData);
      if (!result.ok) {
        setFormError(result.formError);
        errors.setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      toast.success(result.message);
      // Re-read the saved values (normalized phone, shell name).
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} noValidate className="px-5 pb-6 pt-6 sm:px-[30px] sm:pb-[30px]">
      <ProfileCardTitle icon={UserIcon} title="Basic Information" />
      <div className="mt-6">
        <FormAlert message={formError} />
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-[22px] sm:grid-cols-2">
        <Field
          label="First Name"
          autoComplete="given-name"
          showRequiredMark
          required
          info="Your first and last name are shown on your account and to the Covet team."
          {...text("firstName")}
        />
        <Field label="Last Name" autoComplete="family-name" showRequiredMark required {...text("lastName")} />
        <Field
          label="Phone Number"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={PHONE_PLACEHOLDER}
          showRequiredMark
          required
          hint="Include the country code. This is your store's contact number."
          {...text("phone")}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          value={email}
          readOnly
          showRequiredMark
          info="Your email is how you sign in, so it can't be changed here."
        />
      </div>
      <div className="mt-7 flex justify-end">
        <Button type="submit" disabled={pending} className="h-12 w-full px-[30px] text-[14px] sm:w-auto">
          {pending ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </form>
  );
}
