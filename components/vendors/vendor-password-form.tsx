"use client";

import { useState, useTransition, type FormEvent } from "react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form-alert";
import { useFieldErrors } from "@/components/ui/form-dialog";
import { LockIcon } from "@/components/ui/icons";
import { PROFILE_CARD, ProfileCardTitle } from "@/components/vendors/profile-parts";
import { changeVendorPassword } from "@/lib/actions/vendor-profile";
import { changePasswordSchema } from "@/lib/validation/auth";
import { toFieldErrors } from "@/lib/validation/field-errors";

const EMPTY = { currentPassword: "", newPassword: "", confirmPassword: "" };
type Name = keyof typeof EMPTY;

/**
 * Change Password, after VendorChangePassword.dc.html. Adds a Current
 * Password field the mockup lacks: a signed-in session alone must not be
 * enough to replace the password (see `changePasswordSchema`).
 */
export function VendorPasswordForm() {
  const [values, setValues] = useState(EMPTY);
  const [formError, setFormError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const errors = useFieldErrors();

  const field = (name: Name) => ({
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

    const parsed = changePasswordSchema.safeParse(values);
    if (!parsed.success) {
      setFormError(undefined);
      errors.setFieldErrors(toFieldErrors(parsed.error));
      return;
    }

    const formData = new FormData();
    for (const [name, value] of Object.entries(values)) formData.set(name, value);

    setFormError(undefined);
    startTransition(async () => {
      const result = await changeVendorPassword(formData);
      if (!result.ok) {
        setFormError(result.formError);
        errors.setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      toast.success(result.message);
      setValues(EMPTY);
      errors.setFieldErrors({});
    });
  }

  return (
    <form onSubmit={submit} noValidate className={PROFILE_CARD}>
      <div className="border-b border-line-soft px-5 py-[22px] sm:px-[30px]">
        <ProfileCardTitle icon={LockIcon} title="Change Password" />
      </div>
      <div className="p-5 sm:p-[30px]">
        <FormAlert message={formError} />
        <div className="grid grid-cols-1 gap-x-6 gap-y-[22px] sm:grid-cols-2">
          <PasswordField
            label="Current Password"
            autoComplete="current-password"
            placeholder="Enter current password"
            showRequiredMark
            required
            className="sm:col-span-2 sm:max-w-[calc(50%-12px)]"
            {...field("currentPassword")}
          />
          <PasswordField
            label="New Password"
            autoComplete="new-password"
            placeholder="Enter new password"
            showRequiredMark
            required
            hint="At least 8 characters, with a letter and a number."
            info="8 to 72 characters, including at least one letter and one number."
            {...field("newPassword")}
          />
          <PasswordField
            label="Confirm Password"
            autoComplete="new-password"
            placeholder="Enter confirm password"
            showRequiredMark
            required
            {...field("confirmPassword")}
          />
        </div>
        <div className="mt-7 flex justify-end">
          <Button type="submit" disabled={pending} className="h-12 w-full px-[30px] text-[14px] sm:w-auto">
            {pending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}
