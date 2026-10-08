import { Prisma } from "@prisma/client";

/**
 * Prisma error checks shared by the admin Server Actions, so each can map a
 * database failure to a safe, specific message instead of leaking the raw
 * error.
 */

/** A unique constraint was violated (P2002); `target` names the field(s). */
export function isUniqueViolation(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

/** A foreign key blocked the write (P2003) — e.g. deleting a parent still in use. */
export function isForeignKeyViolation(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003";
}

export function violatedTarget(error: Prisma.PrismaClientKnownRequestError): string {
  return String(error.meta?.target ?? "");
}
