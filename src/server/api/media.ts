// API uploads reach the browser through our own /media route (app/media),
// so the backend's address never appears in a page and its plain-http files
// still load on an https site. No `server-only`: schemas.ts uses this.

export function apiOrigin(): string | null {
  const base = process.env.API_URL;
  if (!base) return null;
  try {
    return new URL(base).origin;
  } catch {
    return null;
  }
}

const HAS_SCHEME = /^[a-z][a-z\d+.-]*:/i;

export function toMediaPath(value: string | null | undefined): string | null {
  if (!value) return null;
  const origin = apiOrigin();
  let url: URL;
  try {
    url = new URL(value, origin ?? "http://api.invalid");
  } catch {
    return null;
  }
  const fromApi = !HAS_SCHEME.test(value) || url.origin === origin;
  if (fromApi) return url.pathname.startsWith("/media/") ? `${url.pathname}${url.search}` : null;
  return url.protocol === "https:" ? url.href : null;
}
