"use client";

import { useActionState } from "react";

import { Field, PasswordField } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { registerVendor } from "@/lib/actions/register";
import { EMPTY_FORM_STATE } from "@/lib/actions/auth-state";

/**
 * The two-column card from `designs/.../VendorRegister.dc.html`.
 *
 * Field set differs from the mockup in two places, both forced by the Phase 1
 * data model: `Store Name` and `Your Name` are added because a Vendor row
 * needs a store name and a User row needs a name, and `Phone` is dropped
 * because nothing in the schema stores it.
 */
export function VendorRegisterForm() {
  const [state, formAction] = useActionState(registerVendor, EMPTY_FORM_STATE);

  return (
    <form action={formAction} noValidate>
      <div className="mb-[22px] font-display text-[19px] font-bold leading-none text-ink">
        Create An Account
      </div>

      <FormAlert message={state.formError} />

      <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        <Field
          label="Store Name"
          name="storeName"
          placeholder="Ex: Northbound Supply"
          defaultValue={state.values?.storeName}
          errors={state.fieldErrors?.storeName}
          showRequiredMark
          className="sm:col-span-2"
          required
        />

        <Field
          label="Your Name"
          name="name"
          autoComplete="name"
          placeholder="Ex: Ada Lovelace"
          defaultValue={state.values?.name}
          errors={state.fieldErrors?.name}
          showRequiredMark
          required
        />

        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="Ex: example@gmail.com"
          defaultValue={state.values?.email}
          errors={state.fieldErrors?.email}
          showRequiredMark
          required
        />

        <PasswordField
          label="Password"
          name="password"
          autoComplete="new-password"
          placeholder="Minimum 8 characters long"
          errors={state.fieldErrors?.password}
          showRequiredMark
          required
        />

        <PasswordField
          label="Confirm Password"
          name="confirmPassword"
          autoComplete="new-password"
          placeholder="Confirm password"
          errors={state.fieldErrors?.confirmPassword}
          showRequiredMark
          required
        />
      </div>

      <p className="mt-[22px] text-[12.5px] leading-[1.5] text-muted">
        Every new store is reviewed by the Covet team before it goes live. You
        can sign in straight away and follow the review from your seller
        account.
      </p>

      <div className="mt-6 flex justify-end">
        <SubmitButton pendingLabel="Creating store..." className="px-7">
          Create Account
        </SubmitButton>
      </div>
    </form>
  );
}
