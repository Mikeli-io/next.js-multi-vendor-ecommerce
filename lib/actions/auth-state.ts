/** Shape returned by every auth form action, consumed via `useActionState`. */
export type AuthFormState = {
  /** Message shown above the form. */
  formError?: string;
  /** Per-field messages, keyed by input name. */
  fieldErrors?: Record<string, string[]>;
  /** Echoed back so a failed submit does not clear what the user typed. */
  values?: Record<string, string>;
};

export const EMPTY_FORM_STATE: AuthFormState = {};

/**
 * One message for every failed sign-in. An unknown email and a wrong password
 * must be indistinguishable, or the form becomes an account-enumeration oracle.
 */
export const GENERIC_SIGN_IN_ERROR =
  "Invalid email or password. Please try again.";
