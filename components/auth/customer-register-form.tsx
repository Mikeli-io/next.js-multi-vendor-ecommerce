"use client";

import { useActionState } from "react";

import { Checkbox, Field, PasswordField } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { registerCustomer } from "@/lib/actions/register";
import { EMPTY_FORM_STATE } from "@/lib/actions/auth-state";

/**
 * Fields follow `designs/.../register.dc.html`: name, email, password and the
 * terms checkbox — the customer form has no confirm-password field.
 *
 * The design renders "Terms" and "Privacy Policy" as links. Those pages do not
 * exist yet, so they are emphasised text here rather than links to nowhere.
 */
export function CustomerRegisterForm() {
  const [state, formAction] = useActionState(
    registerCustomer,
    EMPTY_FORM_STATE,
  );

  return (
    <form action={formAction} noValidate>
      <FormAlert message={state.formError} />

      <Field
        label="Name"
        name="name"
        autoComplete="name"
        placeholder="Your full name"
        defaultValue={state.values?.name}
        errors={state.fieldErrors?.name}
        className="mb-5"
        required
      />

      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder="you@example.com"
        defaultValue={state.values?.email}
        errors={state.fieldErrors?.email}
        className="mb-5"
        required
      />

      <PasswordField
        label="Password"
        name="password"
        autoComplete="new-password"
        placeholder="Minimum 8 characters long"
        errors={state.fieldErrors?.password}
        className="mb-[22px]"
        required
      />

      <div className="mb-6">
        <Checkbox
          name="acceptTerms"
          defaultChecked={false}
          errors={state.fieldErrors?.acceptTerms}
          label={
            <>
              I agree to Covet&apos;s{" "}
              <span className="font-semibold text-iris-500">Terms</span> and{" "}
              <span className="font-semibold text-iris-500">
                Privacy Policy
              </span>
              .
            </>
          }
        />
      </div>

      <SubmitButton pendingLabel="Creating account...">
        Create account
      </SubmitButton>
    </form>
  );
}
