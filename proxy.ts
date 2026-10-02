import { NextResponse, type NextRequest } from "next/server";
import { verifyToken } from "@/src/server/auth/session-token";

const SESSION_COOKIE = "mc_session";

// Optimistic redirect only — requireAdmin() in pages and actions is the
// real guard.
export async function proxy(request: NextRequest) {
  const session = await verifyToken(
    request.cookies.get(SESSION_COOKIE)?.value,
    process.env.AUTH_SECRET ?? "",
  );
  const isAdmin = session?.role === "ADMIN";
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (pathname === "/login" && isAdmin) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*", "/login"] };
