import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/billing/lemonsqueezy";
import { supabaseService } from "@/lib/auth/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LSEvent =
  | "subscription_created"
  | "subscription_updated"
  | "subscription_cancelled"
  | "subscription_expired"
  | "subscription_payment_success"
  | "subscription_payment_failed";

const ACTIVE_STATUSES = new Set(["active", "on_trial", "past_due"]);

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const sig = req.headers.get("x-signature");
  if (!verifyWebhookSignature(raw, sig)) {
    return NextResponse.json({ error: "bad_signature" }, { status: 401 });
  }

  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400 });
  }

  const eventName = body?.meta?.event_name as LSEvent | undefined;
  const userId = body?.meta?.custom_data?.user_id as string | undefined;
  const sub = body?.data?.attributes;
  const subId = body?.data?.id as string | undefined;

  if (!eventName || !userId || !subId || !sub) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const status: string = sub.status ?? "expired";
  const variantName: string = (sub.variant_name ?? "").toLowerCase();
  const plan = variantName.includes("year") ? "yearly" : "monthly";
  const renewsAt: string | null = sub.renews_at ?? null;

  const sb = supabaseService();
  const effectiveStatus = ACTIVE_STATUSES.has(status) ? "active" : status;

  await sb.from("subscriptions").upsert(
    {
      user_id: userId,
      ls_subscription_id: subId,
      status: effectiveStatus,
      plan,
      renews_at: renewsAt,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  return NextResponse.json({ ok: true });
}
