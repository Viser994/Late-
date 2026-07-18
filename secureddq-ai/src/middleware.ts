import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isDemoMode } from "@/lib/demo";

const hasClerk =
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY !== "pk_test_dummy" &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.endsWith("...");

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isDemoMode || pathname.startsWith("/demo")) {
    return NextResponse.next();
  }

  if (!hasClerk) {
    if (
      pathname === "/" ||
      pathname.startsWith("/sign-in") ||
      pathname.startsWith("/sign-up") ||
      pathname.startsWith("/api/health")
    ) {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL("/demo", request.url));
  }

  const { clerkMiddleware, createRouteMatcher } = await import(
    "@clerk/nextjs/server"
  );

  const isPublicRoute = createRouteMatcher([
    "/",
    "/pricing",
    "/features",
    "/about",
    "/sign-in(.*)",
    "/sign-up(.*)",
    "/api/webhooks(.*)",
    "/api/health",
    "/demo(.*)",
  ]);

  return clerkMiddleware(async (auth) => {
    if (!isPublicRoute(request)) {
      await auth.protect();
    }
  })(request, {} as never);
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
