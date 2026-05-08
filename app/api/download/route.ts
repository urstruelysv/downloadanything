import { NextRequest, NextResponse } from "next/server";
import { withApi, type UrlApiContext } from "@/lib/http/with-api";
import { download } from "@/lib/extraction";
import { consumeAnon, consumeUser } from "@/lib/quota";
import { jsonError } from "@/lib/http/errors";
import { logDownload } from "@/lib/logging/downloads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const POST = withApi(
  { requireUrl: true },
  async (req: NextRequest, ctx: UrlApiContext) => {
    const formatId = ctx.body.formatId as string | undefined;
    const directUrl = ctx.body.directUrl as string | undefined;
    const directHeaders = ctx.body.directHeaders as Record<string, string> | undefined;
    const title = ctx.body.title as string | undefined;
    const ext = ctx.body.ext as string | undefined;

    if (!formatId || typeof formatId !== "string") {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const consume = ctx.user
      ? await consumeUser(ctx.user.id, ctx.plan)
      : await consumeAnon(ctx.ip);
    if (!consume.allowed) {
      return jsonError(consume.reason ?? "quota_exceeded", 429, { upgradeUrl: "/pricing" });
    }

    const result = await download(ctx.url, formatId, directUrl, directHeaders, title, ext);

    logDownload({
      userId: ctx.user?.id ?? null,
      ip: ctx.ip,
      url: ctx.url,
      platform: ctx.platform!.platform,
      format: formatId,
      status: "success",
    });

    switch (result.kind) {
      case "r2":
        return Response.json({ r2Url: result.r2Url, remaining: consume.remaining });
      case "stream": {
        const headers = new Headers(result.headers);
        headers.set("x-remaining", String(consume.remaining));
        return new Response(result.body, { status: 200, headers });
      }
    }
  },
);
