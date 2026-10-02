import "server-only";
import { randomBytes, randomInt, scrypt, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
// No look-alike characters (0/O, 1/l/I) — admins read these out to people.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

const derive = (plain: string, salt: Buffer) =>
  new Promise<Buffer>((resolve, reject) => {
    scrypt(plain, salt, KEY_LENGTH, (error, key) =>
      error ? reject(error) : resolve(key),
    );
  });

export async function hashPassword(plain: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await derive(plain, salt);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function verifyPassword(
  plain: string,
  stored: string,
): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  if (expected.length !== KEY_LENGTH) return false;
  const actual = await derive(plain, Buffer.from(saltHex, "hex"));
  return timingSafeEqual(actual, expected);
}

export function generatePassword(): string {
  return Array.from(
    { length: 14 },
    () => ALPHABET[randomInt(ALPHABET.length)],
  ).join("");
}
