import { NextRequest, NextResponse } from "next/server";
import { withApi, type UrlApiContext } from "@/lib/http/with-api";
import { download } from "@/lib/extraction";
import { supabaseService } from "@/lib/auth/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export const POST = withApi(
  { requireUrl: true },
  async (req: NextRequest, ctx: UrlApiContext) => {
    const formatId = ctx.body.formatId as string | undefined;
    const directUrl = ctx.body.directUrl as string | undefined;

    if (!formatId || typeof formatId !== "string") {
      return NextResponse.json({ error: "invalid_request" }, { status: 400 });
    }

    const result = await download(ctx.url, formatId, directUrl);

    recordDownload(
      ctx.user?.id ?? null,
      ctx.ip,
      ctx.url,
      ctx.platform!.platform,
      formatId,
    );

    switch (result.kind) {
      case "redirect":
        return NextResponse.redirect(result.directUrl, 302);
      case "r2":
        return Response.json({ r2Url: result.r2Url });
      case "stream":
        return new Response(result.body, { status: 200, headers: result.headers });
    }
  },
);

function recordDownload(
  userId: string | null,
  ip: string,
  url: string,
  platform: string,
  format: string,
) {
  supabaseService()
    .from("downloads")
    .insert({ user_id: userId, ip, url, platform, format, status: "success" })
    .then(({ error }) => {
      if (error) console.error("[download] log failed", error);
    });
}
