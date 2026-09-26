"use client";

import { useActionState } from "react";

import { Field } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateProfile } from "@/lib/actions/profile";
import { EMPTY_PROFILE_STATE } from "@/lib/actions/profile-state";

/**
 * The "Profile Info" form from `designs/.../userdashboard.dc.html`.
 *
 * Differs from the mockup where the data model does: there is no phone column,
 * so no phone field; email is the sign-in identity and is read-only here; and
 * the password fields are left to a dedicated change-password flow, which
 * must verify the current password before accepting a new one.
 */
export function ProfileForm({
  firstName,
  lastName,
  email,
}: {
  firstName: string;
  lastName: string;
  email: string;
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
          label="Email"
          name="email"
          type="email"
          value={email}
          readOnly
          hint="Your email is how you sign in, so it can't be changed here."
          className="sm:col-span-2"
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
