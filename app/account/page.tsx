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

      try {
        const meRes = await fetch("/api/me");

        if (meRes.ok) {
          const meData = await meRes.json();
          setMe(meData);

          if (meData.history) {
            setHistory(meData.history);
          }
        }
      } catch (e) {
        console.error(e);
      }

      setLoading(false);
    })();
  }, []);

  const signOut = async () => {
    await authClient.signOut();
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--bg)",
        }}
      >
        <div
          className="spin-slow"
          style={{
            width: 42,
            height: 42,
            borderRadius: "50%",
            border: "3px solid var(--line)",
            borderTopColor: "var(--grad-from)",
          }}
        />
      </div>
    );
  }

  const isPro = me?.plan === "subscribed";

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
      }}
    >
      <nav className="nav">
        <div
          className="container-da"
          style={{
            height: 76,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <a
            href="/"
            style={{
              textDecoration: "none",
            }}
          >
            <LogoLockup />
          </a>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div className="tag">
              {isPro ? (
                <>
                  <Icon name="gem" size={12} />
                  PRO
                </>
              ) : (
                <>
                  <Icon name="bolt" size={12} />
                  FREE
                </>
              )}
            </div>

            <button className="btn btn-ghost" onClick={signOut}>
              Sign out
            </button>
          </div>
        </div>
      </nav>

      <main
        className="container-da"
        style={{
          paddingTop: 72,
          paddingBottom: 96,
        }}
      >
        <div
          className="fade-rise"
          style={{
            marginBottom: 48,
          }}
        >
          <div className="eyebrow">
            <span className="dot" />
            Account
          </div>

          <h1
            className="display"
            style={{
              fontSize: "clamp(54px, 8vw, 92px)",
              marginTop: 18,
              marginBottom: 16,
            }}
          >
            Your <em>downloads</em>
          </h1>

          <p
            style={{
              color: "var(--muted)",
              fontSize: 18,
              maxWidth: 700,
              lineHeight: 1.7,
            }}
          >
            Signed in as{" "}
            <span
              style={{
                color: "var(--ink)",
                fontWeight: 600,
              }}
            >
              {session?.user?.email}
            </span>
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.1fr 0.9fr",
            gap: 24,
            alignItems: "start",
          }}
        >
          <div
            className="card fade-rise-1"
            style={{
              padding: 28,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 28,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                    marginBottom: 8,
                  }}
                >
                  Download History
                </div>

                <div
                  style={{
                    color: "var(--muted)",
                    fontSize: 15,
                  }}
                >
                  Your recent downloads and exports.
                </div>
              </div>

              <div className="tag">
                <Icon name="clock" size={12} />
                {history.length} items
              </div>
            </div>

            {history.length === 0 ? (
              <div
                style={{
                  border: "1px dashed var(--line)",
                  borderRadius: 18,
                  padding: "44px 28px",
                  textAlign: "center",
                  background: "var(--surface)",
                }}
              >
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, rgba(30,111,217,.12), rgba(45,138,78,.12))",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px",
                  }}
                >
                  <Icon name="download" size={28} />
                </div>

                <div
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    marginBottom: 10,
                  }}
                >
                  No downloads yet
                </div>

                <p
                  style={{
                    color: "var(--muted)",
                    fontSize: 15,
                    maxWidth: 420,
                    margin: "0 auto",
                    lineHeight: 1.7,
                  }}
                >
                  Paste a link on the homepage to start downloading videos,
                  music, images, and more.
                </p>

                <a
                  href="/"
                  className="btn btn-grad"
                  style={{
                    marginTop: 28,
                  }}
                >
                  <Icon name="paste" size={16} stroke="white" />
                  Start Downloading
                </a>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                }}
              >
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="card card-hover"
                    style={{
                      padding: 18,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        minWidth: 0,
                        flex: 1,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          marginBottom: 8,
                        }}
                      >
                        <div className="tag">
                          {item.platform}
                        </div>

                        {item.format && (
                          <div className="tag">
                            {item.format}
                          </div>
                        )}
                      </div>

                      <div
                        style={{
                          fontSize: 14,
                          color: "var(--muted)",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {item.url}
                      </div>
                    </div>

                    <div
                      style={{
                        marginLeft: 18,
                      }}
                    >
                      <Icon name="arrow-right" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div
            className="fade-rise-2"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            <div
              className={`card ${isPro ? "price-pop" : ""}`}
              style={{
                padding: 28,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 20,
                }}
              >
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 700,
                  }}
                >
                  {isPro ? "Pro Plan" : "Free Plan"}
                </div>

                <div className="tag">
                  {isPro ? (
                    <>
                      <Icon name="gem" size={12} />
                      ACTIVE
                    </>
                  ) : (
                    <>
                      <Icon name="bolt" size={12} />
                      LIMITED
                    </>
                  )}
                </div>
              </div>

              <p
                className={isPro ? "label" : ""}
                style={{
                  lineHeight: 1.7,
                  marginBottom: 24,
                  color: isPro ? undefined : "var(--muted)",
                }}
              >
                {isPro
                  ? "Unlimited high-quality downloads with priority processing."
                  : `Free users can download up to ${FREE_USER_DAILY_DOWNLOAD_LIMIT} files per day.`}
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  marginBottom: 28,
                }}
              >
                {[
                  "No watermarks",
                  "High quality exports",
                  "Fast extraction",
                  "Multi-platform support",
                ].map((feature) => (
                  <div
                    key={feature}
                    className={isPro ? "feature" : ""}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <Icon
                      name="check"
                      size={16}
                      stroke={isPro ? "white" : "var(--grad-from)"}
                    />
                    {feature}
                  </div>
                ))}
              </div>

              {!isPro && (
                <button
                  className="btn btn-grad"
                  style={{
                    width: "100%",
                  }}
                >
                  Upgrade to Pro
                </button>
              )}
            </div>

            <div
              className="card"
              style={{
                padding: 28,
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  marginBottom: 18,
                }}
              >
                Account Details
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 18,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: ".08em",
                      color: "var(--muted-2)",
                      marginBottom: 6,
                    }}
                  >
                    Email
                  </div>

                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 500,
                    }}
                  >
                    {session?.user?.email}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: ".08em",
                      color: "var(--muted-2)",
                      marginBottom: 6,
                    }}
                  >
                    Account Type
                  </div>

                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 500,
                    }}
                  >
                    {isPro ? "Pro Subscriber" : "Free User"}
                  </div>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: 12,
                      textTransform: "uppercase",
                      letterSpacing: ".08em",
                      color: "var(--muted-2)",
                      marginBottom: 6,
                    }}
                  >
                    Authentication
                  </div>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontSize: 15,
                      fontWeight: 500,
                    }}
                  >
                    <Icon name="shield" size={15} />
                    Google OAuth
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}