import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Protect owner-only routes
    if (path.startsWith("/api/v1/users") || path.startsWith("/staff-management") || path.startsWith("/analytics") || path.startsWith("/api/v1/analytics")) {
      if (token?.role !== "owner") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    
    // Protect owner-only products/categories modifications
    if ((path.startsWith("/api/v1/products") || path.startsWith("/api/v1/categories")) && req.method !== "GET" && path.includes("/search") === false) {
      if (token?.role !== "owner") {
         return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/inventory/:path*",
    "/purchases/:path*",
    "/billing/:path*",
    "/bookings/:path*",
    "/analytics/:path*",
    "/staff-management/:path*",
    "/api/v1/:path*",
  ],
};
