"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { toFieldErrors } from "@/lib/validation/field-errors";
import { profileSchema } from "@/lib/validation/auth";
import type { ProfileFormState } from "./profile-state";

/**
 * Update the signed-in customer's display name.
 *
 * Authorization is checked here, not just on the page: a Server Action is a
 * public endpoint that can be called without ever loading `/dashboard`. The
 * row updated is always the caller's own — no id is read from the form.
 */
export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const user = await requireRole("CUSTOMER");

  const values = {
    firstName: String(formData.get("firstName") ?? ""),
    lastName: String(formData.get("lastName") ?? ""),
  };

  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: toFieldErrors(parsed.error), values };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name },
    select: { id: true },
  });

  // The header greeting and sidebar read the name too.
  revalidatePath("/dashboard");

  return { success: "Your profile has been updated.", values };
}
