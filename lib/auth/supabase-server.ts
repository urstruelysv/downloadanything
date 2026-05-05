import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function supabaseServer() {
  const store = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll().map((c) => ({ name: c.name, value: c.value })),
        setAll: (entries: Array<{ name: string; value: string; options: CookieOptions }>) => {
          for (const e of entries) {
            store.set({ name: e.name, value: e.value, ...e.options });
          }
        },
      },
    },
  );
}

export function supabaseService() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase service env missing");
  return createClient(url, key, { auth: { persistSession: false } });
}

export async function getCurrentUser() {
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  return data.user ?? null;
}

export async function getUserPlan(userId: string): Promise<"free" | "subscribed"> {
  const sb = supabaseService();
  const { data, error } = await sb
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return "free";
  return data.status === "active" ? "subscribed" : "free";
}
