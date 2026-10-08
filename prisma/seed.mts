/**
 * Idempotent admin seed.
 *
 * Admins cannot self-register anywhere in the app; this is the only way an
 * ADMIN row is created. Credentials come from the environment, never from
 * this file — nothing here is a usable password if the repository leaks.
 *
 * Run with:  npm run db:seed
 *
 * Required environment variables:
 *   ADMIN_EMAIL     — the admin's email address
 *   ADMIN_PASSWORD  — at least 12 characters
 * Optional:
 *   ADMIN_NAME      — display name, defaults to "Covet Admin"
 */
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const MIN_PASSWORD_LENGTH = 12;

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `${name} is not set. Add it to your .env before running the seed.`,
    );
  }
  return value;
}

async function main(): Promise<void> {
  const email = requireEnv("ADMIN_EMAIL").toLowerCase();
  const password = requireEnv("ADMIN_PASSWORD");
  const name = process.env.ADMIN_NAME?.trim() || "Covet Admin";

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true, role: true },
  });

  if (existing) {
    if (existing.role !== "ADMIN") {
      // Refuse to silently promote an existing customer or vendor account.
      throw new Error(
        `${email} already exists with role ${existing.role}. Use a different ADMIN_EMAIL.`,
      );
    }
    // Already seeded. Re-running must not create a second admin, and must not
    // quietly reset the password of a live account.
    console.log(`Admin already present for ${email} — nothing to do.`);
    return;
  }

  const created = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: await hash(password, 12),
      role: "ADMIN",
    },
    select: { id: true, email: true },
  });

  // The password is never logged.
  console.log(`Created admin ${created.email} (${created.id}).`);
}

main()
  .catch((error: unknown) => {
    console.error(
      "Admin seed failed:",
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
