import { auth } from "@/lib/auth/better-auth";
import { headers } from "next/headers";

export async function getSession() {
  return await auth.api.getSession({
    headers: await headers(),
  });
}

export async function getUserPlan(userId: string): Promise<"free" | "subscribed"> {
  const { db } = await import("@/lib/db");
  const { subscriptions } = await import("@/lib/db/schema");
  const { eq } = await import("drizzle-orm");

  try {
    const sub = await db
      .select({ status: subscriptions.status })
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .limit(1)
      .then((res) => res[0]);

    if (!sub) return "free";
    return sub.status === "active" ? "subscribed" : "free";
  } catch (e) {
    console.error("[db] failed to fetch user plan:", e);
    return "free";
  }
}
