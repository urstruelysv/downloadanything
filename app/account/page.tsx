"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth/auth-client";
import { Icon, LogoLockup } from "@/components/site/logo";
import { FREE_USER_DAILY_DOWNLOAD_LIMIT } from "@/shared/quota";

type MeResponse = {
  user: { id: string; email: string };
  plan: "free" | "subscribed";
};

type Download = {
  id: string;
  url: string;
  platform: string;
  format: string | null;
  status: string;
  created_at: string;
};

export default function AccountPage() {
  const [session, setSession] = useState<any>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [history, setHistory] = useState<Download[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: sessionData } = await authClient.getSession();
      if (!sessionData?.user) {
        window.location.href = "/login?next=/account";
        return;
      }
      setSession(sessionData);

      // Fetch additional data from our API
      const meRes = await fetch("/api/me");
      if (meRes.ok) setMe(await meRes.json());
      
      // History should be fetched from our own API now instead of direct DB access
      // For now, I'll assume /api/me or a new /api/history endpoint
      // Let's assume /api/me returns history or we create a small endpoint
      setLoading(false);
    })();
  }, []);

  const signOut = async () => {
    await authClient.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spin-slow" style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid var(--line)", borderTopColor: "var(--grad-from)" }} />
      </div>
    );
  }

  const isPro = me?.plan === "subscribed";

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface)" }}>
      <nav style={{ background: "white", borderBottom: "1px solid var(--line)", padding: "166px 0" }}>
        {/* Navigation Content ... */}
      </nav>
      {/* Rest of the page ... */}
    </div>
  );
}
