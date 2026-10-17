// Reads `exp` without checking the signature: only the backend can verify
// its tokens; we just need to know when to refresh them.
export function jwtExpiresAt(token: string): number | null {
  const payload = token.split(".")[1];
  if (!payload) return null;
  try {
    const json: unknown = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    const exp = json && typeof json === "object" ? (json as { exp?: unknown }).exp : undefined;
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}
