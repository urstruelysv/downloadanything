import crypto from "node:crypto";

const API = "https://api.lemonsqueezy.com/v1";

type PlanId = "monthly" | "yearly";

function variantId(plan: PlanId): string {
  const id =
    plan === "monthly"
      ? process.env.LEMONSQUEEZY_VARIANT_ID_MONTHLY
      : process.env.LEMONSQUEEZY_VARIANT_ID_YEARLY;
  if (!id) throw new Error(`LS variant id missing for ${plan}`);
  return id;
}

export async function createCheckoutUrl(userId: string, plan: PlanId): Promise<string> {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  if (!apiKey || !storeId) throw new Error("LS env missing");

  const res = await fetch(`${API}/checkouts`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/vnd.api+json",
      accept: "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            custom: { user_id: userId },
          },
          product_options: { redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/account?upgraded=1` },
        },
        relationships: {
          store: { data: { type: "stores", id: storeId } },
          variant: { data: { type: "variants", id: variantId(plan) } },
        },
      },
    }),
  });
  if (!res.ok) {
    throw new Error(`LS checkout failed: ${res.status} ${await res.text()}`);
  }
  const body = (await res.json()) as { data: { attributes: { url: string } } };
  return body.data.attributes.url;
}

export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(signature, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
