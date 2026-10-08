"use client";

import { useActionState } from "react";

import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateProfile } from "@/lib/actions/profile";
import { EMPTY_PROFILE_STATE } from "@/lib/actions/profile-state";
import { PHONE_PLACEHOLDER } from "@/lib/validation/phone";

/**
 * The "Profile Info" form from `designs/.../userdashboard.dc.html`.
 *
 * Differs from the mockup where the data model does: email is the sign-in
 * identity and is read-only here; the phone takes the full international
 * number rather than a fixed "+1" chip, and may be left blank; and the
 * password fields are left to a dedicated change-password flow, which must
 * verify the current password before accepting a new one.
 */
export function ProfileForm({
  firstName,
  lastName,
  email,
  phone,
}: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
}) {
  const [state, formAction] = useActionState(updateProfile, EMPTY_PROFILE_STATE);

  return (
    <form action={formAction} noValidate className="mx-auto max-w-[840px]">
      <FormAlert message={state.success} tone="success" />
      <FormAlert message={state.formError} />

      <div className="grid grid-cols-1 gap-x-6 gap-y-[22px] sm:grid-cols-2">
        <Field
          label="First Name"
          name="firstName"
          autoComplete="given-name"
          defaultValue={state.values?.firstName ?? firstName}
          errors={state.fieldErrors?.firstName}
          required
        />
        <Field
          label="Last Name"
          name="lastName"
          autoComplete="family-name"
          defaultValue={state.values?.lastName ?? lastName}
          errors={state.fieldErrors?.lastName}
        />
        <Field
          label="Phone Number"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={PHONE_PLACEHOLDER}
          defaultValue={state.values?.phone ?? phone ?? ""}
          errors={state.fieldErrors?.phone}
        />
        <Field
          label="Email"
          name="email"
          type="email"
          value={email}
          readOnly
          hint="Your email is how you sign in, so it can't be changed here."
        />
      </div>

      <div className="mt-8 flex justify-end">
        <SubmitButton pendingLabel="Updating..." className="w-full px-[34px] sm:w-auto">
          Update Profile
        </SubmitButton>
      </div>
    </form>
  );
}
