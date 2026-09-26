import { compare, hash } from "bcryptjs";

const BCRYPT_ROUNDS = 12;

/**
 * A valid bcrypt digest of a value no user can supply. Hashing against it when
 * an email does not exist keeps the "unknown email" and "wrong password" paths
 * at comparable cost, so response time does not reveal which one occurred.
 */
const ABSENT_USER_HASH =
  "$2b$12$sNxb1emz4WIw0VsKt.iChOHEvmWtkdMmZN8wHPaTensJ0COmNgcYG";

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, BCRYPT_ROUNDS);
}

export function verifyPassword(
  plain: string,
  passwordHash: string,
): Promise<boolean> {
  return compare(plain, passwordHash);
}

/** Burn the same work as a real password check, then report failure. */
export async function fakeVerifyPassword(plain: string): Promise<false> {
  await compare(plain, ABSENT_USER_HASH);
  return false;
}
