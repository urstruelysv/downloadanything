import { withApi, type UrlApiContext } from "@/lib/http/with-api";
import { extract } from "@/lib/extraction";
import { supabaseService } from "@/lib/auth/supabase-server";
import { supportedPlatforms } from "@/lib/platform";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApi(
  { requireUrl: true },
  async (_req, ctx: UrlApiContext) => {
    const result = await extract(ctx.url);

    supabaseService()
      .from("downloads")
      .insert({
        user_id: ctx.user?.id ?? null,
        ip: ctx.ip,
        url: ctx.url,
        platform: ctx.platform!.platform,
        format: null,
        bytes: null,
        status: "success",
        error: null,
      })
      .then(({ error }) => {
        if (error) console.error("[extract] log failed", error);
      });

    return Response.json({
      ...result,
      plan: ctx.plan,
      remaining: ctx.quota.remaining,
      supportedPlatforms: supportedPlatforms(),
    });
  },
);
