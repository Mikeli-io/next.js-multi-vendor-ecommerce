/**
 * Role and status literals, declared without importing `@prisma/client`, so
 * that `proxy.ts` and other non-database code can reason about roles without
 * pulling the Prisma client into their bundle.
 *
 * `lib/auth/guards.ts` asserts at compile time that these stay in sync with
 * the enums generated from `prisma/schema.prisma`.
 */
export type AppRole = "CUSTOMER" | "VENDOR" | "ADMIN";

export type AppVendorStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
