import { scrypt as derive, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(derive);
export const normalizeUsername = (value: string) =>
  value.normalize("NFKC").trim().toLowerCase().replace(/\s+/g, ".");
export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${key.toString("hex")}`;
}
export async function verifyPassword(password: string, stored: string) {
  const [algorithm, salt, encoded] = stored.split(":");
  if (
    algorithm !== "scrypt" ||
    !/^[a-f0-9]{32}$/.test(salt || "") ||
    !/^[a-f0-9]{128}$/.test(encoded || "")
  )
    return false;
  const key = (await scrypt(password, salt, 64)) as Buffer;
  return timingSafeEqual(key, Buffer.from(encoded, "hex"));
}
