import "server-only";
import { randomInt } from "node:crypto";

// No look-alike characters (0/O, 1/l/I) — admins read these out to people.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";

export function generatePassword(): string {
  return Array.from({ length: 14 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}
