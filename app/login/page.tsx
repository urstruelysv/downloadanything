"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth/auth-client";
import { Icon, LogoLockup } from "@/components/site/logo";
import { FREE_USER_DAILY_DOWNLOAD_LIMIT } from "@/shared/quota";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const signInEmail = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    const { error: err } = await authClient.signIn.email({
      email: email.trim(),
      password: "TEMPORARY_PASSWORD_OR_FLOW_CHANGE", // Better-Auth email flow usually requires password or magic link plugin
    });
    setLoading(false);
    if (err) {
      setError(err.message || "Failed to sign in");
    } else {
      setSent(true);
    }
  };

  const signInGoogle = async () => {
    setError("");
    await authClient.signIn.social({
      provider: "google",
      callbackURL: "/account",
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--surface)",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          background: "white",
          border: "1px solid var(--line)",
          borderRadius: 20,
          padding: 36,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        <div style={{ textAlign: "center" }}>
          <LogoLockup size={26} />
          <h1
            className="serif"
            style={{ fontSize: 28, marginTop: 16, color: "var(--ink)" }}
          >
            Sign in
          </h1>
          <p style={{ fontSize: 14, color: "var(--muted)", marginTop: 6 }}>
            Sign in for {FREE_USER_DAILY_DOWNLOAD_LIMIT} downloads/day, session
            persistence, and short-term history.
          </p>
        </div>

        <button
          onClick={signInGoogle}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "12px 16px",
            borderRadius: 12,
            border: "1px solid var(--line)",
            background: "white",
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 500,
            color: "var(--ink)",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "var(--muted)",
            fontSize: 12,
          }}
        >
          <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
          or
          <div style={{ flex: 1, height: 1, background: "var(--line)" }} />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
            Email sign-in is currently being updated. Please use Google.
          </p>
        </div>

        {error && (
          <p
            style={{
              fontSize: 13,
              color: "#d32f2f",
              textAlign: "center",
              margin: 0,
            }}
          >
            {error}
          </p>
        )}

        <a
          href="/"
          style={{
            fontSize: 13,
            color: "var(--muted)",
            textAlign: "center",
            textDecoration: "none",
          }}
        >
          ← Back to home
        </a>
      </div>
    </div>
  );
}
