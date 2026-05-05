import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () =>
          req.cookies.getAll().map((c) => ({ name: c.name, value: c.value })),
        setAll: (
          entries: Array<{ name: string; value: string; options: CookieOptions }>,
        ) => {
          for (const e of entries) {
            req.cookies.set({ name: e.name, value: e.value });
            res.cookies.set({ name: e.name, value: e.value, ...e.options });
          }
        },
      },
    },
  );

  await supabase.auth.getUser();
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
