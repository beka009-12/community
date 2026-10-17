import { apiOrigin } from "@/src/server/api/media";

// Only what the API stores for people and projects. No SVG or HTML: those
// could run scripts on our origin.
const ALLOWED_TYPES = /^(image\/(png|jpeg|webp|gif|avif)|application\/pdf)$/;
const TIMEOUT_MS = 10_000;

// Streams API media from our own origin, so pages never link to the backend.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { path } = await params;
  const origin = apiOrigin();
  if (!origin || path.length === 0 || path.some((part) => part === "" || part === "." || part === "..")) {
    return new Response(null, { status: 404 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${origin}/media/${path.map(encodeURIComponent).join("/")}`, {
      redirect: "manual",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
  } catch (error) {
    console.error("Media proxy failed", error);
    return new Response(null, { status: 502 });
  }

  const type = upstream.headers.get("content-type")?.split(";")[0].trim().toLowerCase() ?? "";
  if (!upstream.ok || !ALLOWED_TYPES.test(type)) {
    await upstream.body?.cancel();
    return new Response(null, { status: 404 });
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": type,
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
