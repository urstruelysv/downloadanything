"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/auth/supabase-browser";
import { Icon, LogoLockup } from "@/components/site/logo";
import { FREE_USER_DAILY_DOWNLOAD_LIMIT } from "@/shared/quota";
import type { User } from "@supabase/supabase-js";

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
  const [user, setUser] = useState<User | null>(null);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [history, setHistory] = useState<Download[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const sb = supabaseBrowser();
      const { data } = await sb.auth.getUser();
      if (!data.user) {
        window.location.href = "/login?next=/account";
        return;
      }
      setUser(data.user);

      const [meRes, dlRes] = await Promise.all([
        fetch("/api/me"),
        sb
          .from("downloads")
          .select("id, url, platform, format, status, created_at")
          .eq("user_id", data.user.id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (meRes.ok) setMe(await meRes.json());
      if (dlRes.data) setHistory(dlRes.data as Download[]);
      setLoading(false);
    })();
  }, []);

  const signOut = async () => {
    await supabaseBrowser().auth.signOut();
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
      <nav style={{ background: "white", borderBottom: "1px solid var(--line)", padding: "16px 0" }}>
        <div className="container-da" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 32px" }}>
          <a href="/" style={{ textDecoration: "none" }}>
            <LogoLockup size={24} />
          </a>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 13, color: "var(--muted)" }}>{user?.email}</span>
            <button
              onClick={signOut}
              style={{
                fontSize: 13, color: "var(--muted)", background: "none",
                border: "1px solid var(--line)", borderRadius: 8, padding: "6px 14px", cursor: "pointer",
              }}
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <div className="container-da" style={{ padding: "48px 32px", maxWidth: 800 }}>
        <h1 className="serif" style={{ fontSize: 32, color: "var(--ink)", marginBottom: 32 }}>Account</h1>

        {/* Plan card */}
        <div
          style={{
            padding: 28, borderRadius: 16, marginBottom: 32,
            background: isPro ? "linear-gradient(135deg, var(--grad-from), var(--grad-to))" : "white",
            color: isPro ? "white" : "var(--ink)",
            border: isPro ? "none" : "1px solid var(--line)",
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.7, marginBottom: 8 }}>
            Current plan
          </div>
          <div className="serif" style={{ fontSize: 36, lineHeight: 1.1 }}>
            {isPro ? "Pro" : "Free"}
          </div>
          <p style={{ fontSize: 14, opacity: 0.8, marginTop: 8 }}>
            {isPro
              ? "Unlimited downloads, up to 8K, playlists, 50-URL batches, permanent history."
              : `${FREE_USER_DAILY_DOWNLOAD_LIMIT} downloads / day, up to 1080p, single URL, 7-day history. Paid plans are coming soon.`}
          </p>
          {!isPro && (
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <span className="btn btn-ghost" style={{ padding: "10px 20px", background: "var(--surface)" }}>
                Pro coming soon
              </span>
            </div>
          )}
        </div>

        {/* Download history */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--ink)", margin: 0 }}>Download history</h2>
            <span style={{ fontSize: 12, color: "var(--muted)" }}>{history.length} items</span>
          </div>

          {history.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--muted)", fontSize: 14, background: "white", borderRadius: 16, border: "1px solid var(--line)" }}>
              No downloads yet. <a href="/" style={{ color: "var(--grad-to)" }}>Start downloading</a>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {history.map((d) => (
                <div
                  key={d.id}
                  style={{
                    display: "flex", alignItems: "center", gap: 14, padding: "14px 18px",
                    background: "white", border: "1px solid var(--line)", borderRadius: 12,
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: "var(--surface)", display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Icon name={d.status === "success" ? "check" : "x"} size={16} stroke={d.status === "success" ? "var(--grad-to)" : "#d32f2f"} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {d.url}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                      {d.platform} · {d.format ?? "—"} · {new Date(d.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
