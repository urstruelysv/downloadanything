import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { workerDownload } from "@/lib/extract/worker-client";
import { ExtractError } from "@/lib/extract/router";
import { assertSafeExtractTarget } from "@/lib/security/url-allowlist";
import { checkAnon, checkUser } from "@/lib/quota";
import { clientIp } from "@/lib/http/ip";
import { getCurrentUser, getUserPlan, supabaseService } from "@/lib/auth/supabase-server";
import { jsonError } from "@/lib/http/errors";
import { detect } from "@/lib/platform/detector";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const Body = z.object({
  url: z.string().min(1).max(2048),
  formatId: z.string().min(1).max(128),
  directUrl: z.string().url().optional(),
});

export async function POST(req: NextRequest) {
  let parsed;
  try {
    parsed = Body.parse(await req.json());
  } catch {
    return jsonError("invalid_url", 400);
  }
  const { url, formatId, directUrl } = parsed;

  const safety = assertSafeExtractTarget(url);
  if (!safety.ok) return jsonError(safety.reason, 400);

  const ip = clientIp(req);
  const user = await getCurrentUser();
  let plan: "free" | "subscribed" = "free";
  let quota;
  if (user) {
    plan = await getUserPlan(user.id);
    quota = await checkUser(user.id, ip, plan);
  } else {
    quota = await checkAnon(ip);
  }
  if (!quota.allowed) {
    return jsonError(quota.reason ?? "quota_exceeded", 429, { upgradeUrl: "/pricing" });
  }

  const det = detect(url)!;

  try {
    if (directUrl) {
      void recordDownload(user?.id ?? null, ip, url, det.platform, formatId, "success");
      return NextResponse.redirect(directUrl, 302);
    }

    const dl = await workerDownload(url, formatId);
    if (dl.kind === "r2") {
      void recordDownload(user?.id ?? null, ip, url, det.platform, formatId, "success");
      return Response.json({ r2Url: dl.r2Url });
    }
    void recordDownload(user?.id ?? null, ip, url, det.platform, formatId, "success");
    const headers = new Headers(dl.res.headers);
    headers.delete("x-worker-token");
    return new Response(dl.res.body, { status: dl.res.status, headers });
  } catch (e) {
    void recordDownload(user?.id ?? null, ip, url, det.platform, formatId, "failed", String(e));
    if (e instanceof ExtractError) {
      return jsonError(e.code, e.httpStatus, e.message ? { message: e.message } : undefined);
    }
    return jsonError("internal", 500);
  }
}

async function recordDownload(
  userId: string | null,
  ip: string,
  url: string,
  platform: string,
  format: string,
  status: "success" | "failed",
  error?: string,
): Promise<void> {
  try {
    await supabaseService().from("downloads").insert({
      user_id: userId,
      ip,
      url,
      platform,
      format,
      status,
      error: error ?? null,
    });
  } catch {}
}
