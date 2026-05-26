import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  // Better-Auth session is handled in withAuth/withQuota for API
  // and can be used in Server Components for pages.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
