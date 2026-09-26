"use server";

import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

import { signIn, signOut } from "@/auth";
import { fakeVerifyPassword } from "@/lib/auth/password";
import { getCurrentUser } from "@/lib/auth/guards";
import { LOGIN_PATH_BY_ROLE, landingPathFor } from "@/lib/auth/routes";
import { prisma } from "@/lib/prisma";
import { toFieldErrors } from "@/lib/validation/field-errors";
import { loginSchema } from "@/lib/validation/auth";
import {
  GENERIC_SIGN_IN_ERROR,
  type AuthFormState,
} from "./auth-state";

/**
 * All three sign-in forms run through one credentials check; only the
 * destination differs, and it is derived from the role stored on the account —
 * never from the form that was used or from anything else the browser sends.
 */

type SignInOutcome =
  | { ok: true; destination: string }
  | { ok: false; state: AuthFormState };

async function authenticate(
  formData: FormData,
  options: { adminOnly?: boolean } = {},
): Promise<SignInOutcome> {
  const rawEmail = String(formData.get("email") ?? "");
  const values = { email: rawEmail };

  const parsed = loginSchema.safeParse({
    email: rawEmail,
    password: String(formData.get("password") ?? ""),
  });

  if (!parsed.success) {
    return {
      ok: false,
      state: { fieldErrors: toFieldErrors(parsed.error), values },
    };
  }

  const { email, password } = parsed.data;

  // Read the account first. It decides the destination, and on the admin form
  // it decides whether to attempt a sign-in at all.
  const account = await prisma.user.findUnique({
    where: { email },
    select: { role: true, vendor: { select: { status: true } } },
  });

  if (options.adminOnly && account?.role !== "ADMIN") {
    // The admin portal is not a general entrance. Reject before `signIn`, so
    // no session is ever created for a non-admin: a session issued here could
    // not be withdrawn later in the same response. Burn a comparable amount of
    // time first, so response timing does not reveal which emails are admins.
    await fakeVerifyPassword(password);
    return { ok: false, state: { formError: GENERIC_SIGN_IN_ERROR, values } };
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    // `CredentialsSignin` covers both "no such email" and "wrong password";
    // both surface as the same message.
    if (error instanceof AuthError) {
      return { ok: false, state: { formError: GENERIC_SIGN_IN_ERROR, values } };
    }
    throw error;
  }

  if (!account) {
    // Unreachable: `signIn` would have thrown. Kept so the type narrows.
    return { ok: false, state: { formError: GENERIC_SIGN_IN_ERROR, values } };
  }

  return {
    ok: true,
    destination: landingPathFor(account.role, account.vendor?.status ?? null),
  };
}

/**
 * Used by `/login` and `/vendor/login`. A person who signs in at the wrong one
 * of the two still lands in the area their role owns.
 */
export async function signInWithCredentials(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const outcome = await authenticate(formData);
  if (!outcome.ok) return outcome.state;
  redirect(outcome.destination);
}

/** Used by `/admin/login`. Rejects every non-ADMIN account. */
export async function signInAsAdmin(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const outcome = await authenticate(formData, { adminOnly: true });
  if (!outcome.ok) return outcome.state;
  redirect(outcome.destination);
}

/** Sign out and return to the sign-in page belonging to the user's role. */
export async function signOutAction(): Promise<void> {
  const user = await getCurrentUser();
  const destination = user
    ? LOGIN_PATH_BY_ROLE[user.role]
    : LOGIN_PATH_BY_ROLE.CUSTOMER;

  await signOut({ redirect: false });
  redirect(destination);
}
