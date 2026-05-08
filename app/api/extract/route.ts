import { withApi, type UrlApiContext } from "@/lib/http/with-api";
import { extract } from "@/lib/extraction";
import { logDownload } from "@/lib/logging/downloads";
import { supportedPlatforms } from "@/lib/platform";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = withApi(
  { requireUrl: true },
  async (_req, ctx: UrlApiContext) => {
    const result = await extract(ctx.url);

    logDownload({
      userId: ctx.user?.id ?? null,
      ip: ctx.ip,
      url: ctx.url,
      platform: ctx.platform!.platform,
      format: null,
      status: "success",
    });

    return Response.json({
      ...result,
      plan: ctx.plan,
      remaining: ctx.quota.remaining,
      supportedPlatforms: supportedPlatforms(),
    });
  },
);
