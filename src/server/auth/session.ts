import "server-only";
import { cookies } from "next/headers";
import { signToken, verifyToken, type SessionPayload } from "./session-token";

export const SESSION_COOKIE = "mc_session";
const TTL_MS = 8 * 60 * 60 * 1000;

const secret = () => {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not set");
  return value;
};

export async function createSession(
  payload: Omit<SessionPayload, "exp">,
): Promise<void> {
  const exp = Date.now() + TTL_MS;
  const token = await signToken({ ...payload, exp }, secret());
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(exp),
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  return verifyToken((await cookies()).get(SESSION_COOKIE)?.value, secret());
}

export async function deleteSession(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
}
