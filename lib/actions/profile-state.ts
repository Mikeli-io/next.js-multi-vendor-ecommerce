import type { AuthFormState } from "./auth-state";

/** The profile form's action state: the auth form shape plus a success note. */
export type ProfileFormState = AuthFormState & { success?: string };

export const EMPTY_PROFILE_STATE: ProfileFormState = {};
