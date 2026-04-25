import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const hasAccess = request.cookies.get("lps_paid")?.value === "1";

  if (!hasAccess) {
    const url = new URL("/", request.url);
    url.searchParams.set("paywall", "1");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/calendar/:path*"],
};
