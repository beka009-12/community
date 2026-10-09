import { isApiError } from "./errors";
import { request, requestNoContent } from "./http";
import { accountSchema, tokensSchema, type Account, type Tokens } from "./schemas";

// No `server-only`: proxy.ts refreshes and verifies tokens with these.

export const loginWithPassword = (username: string, password: string): Promise<Tokens> =>
  request("/auth/login/", tokensSchema, {
    method: "POST",
    body: { username, password },
    cache: "no-store",
  });

export const refreshTokens = (refresh: string): Promise<Tokens> =>
  request("/auth/login/refresh/", tokensSchema, { method: "POST", body: { refresh }, cache: "no-store" });

// true: the backend still accepts this access token.
export async function verifyAccess(access: string): Promise<boolean> {
  try {
    await requestNoContent("/auth/verify/", { token: access, cache: "no-store" });
    return true;
  } catch (error) {
    if (isApiError(error, "unauthorized")) return false;
    throw error;
  }
}

export const getAccountWithToken = (access: string): Promise<Account> =>
  request("/personal-account/", accountSchema, { token: access, cache: "no-store" });

export async function logoutFromApi(access: string | undefined, refresh: string | undefined): Promise<void> {
  await requestNoContent("/auth/logout/", {
    method: "POST",
    token: access,
    body: refresh ? { refresh } : {},
    cache: "no-store",
  });
}
