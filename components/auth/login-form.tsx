"use client";

import { useActionState } from "react";

import { Field, PasswordField } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { EMPTY_FORM_STATE, type AuthFormState } from "@/lib/actions/auth-state";

/**
 * The one sign-in form, shared by the customer, vendor and admin screens; they
 * differ only in the Server Action passed in and the field styling of their
 * surrounding card.
 *
 * The designs place a "Forgot password?" link and a "Remember me" checkbox
 * beside these fields. Neither is rendered: Phase 1 has no password-reset flow,
 * and a link to a page that does not exist is worse than its absence.
 */
export function LoginForm({
  action,
  emailLabel = "Email",
  emailPlaceholder = "you@example.com",
  passwordPlaceholder = "Enter your password",
  submitLabel = "Sign in",
}: {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  emailLabel?: string;
  emailPlaceholder?: string;
  passwordPlaceholder?: string;
  submitLabel?: string;
}) {
  const [state, formAction] = useActionState(action, EMPTY_FORM_STATE);

  return (
    <form action={formAction} noValidate>
      <FormAlert message={state.formError} />

      <Field
        label={emailLabel}
        name="email"
        type="email"
        autoComplete="email"
        placeholder={emailPlaceholder}
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
        className="mb-5"
        required
      />

      <PasswordField
        label="Password"
        name="password"
        autoComplete="current-password"
        placeholder={passwordPlaceholder}
        errors={state.fieldErrors?.password}
        className="mb-[26px]"
        required
      />

      <SubmitButton pendingLabel="Signing in...">{submitLabel}</SubmitButton>
    </form>
  );
}
