"use client";

import * as React from "react";
import { useState } from "react";
import { Icon, LogoLockup } from "./logo";
import { Platform } from "./platforms";
import { ANON_DAILY_DOWNLOAD_LIMIT, FREE_USER_DAILY_DOWNLOAD_LIMIT } from "@/shared/quota";

export const PlatformsSection = () => {
  const platforms = [
    "YouTube",
    "Instagram",
    "TikTok",
    "Twitter",
    "Facebook",
    "Reddit",
    "Pinterest",
    "Vimeo",
    "SoundCloud",
  ];
  const row = [...platforms, ...platforms];
  return (
    <section
      id="platforms"
      className="section-pad"
      style={{
        background: "var(--surface)",
        borderTop: "1px solid var(--line)",
        borderBottom: "1px solid var(--line)",
      }}
    >
      <div className="container-da" style={{ textAlign: "center", marginBottom: 40 }}>
        <span className="eyebrow">
          <span className="dot" />
          Universal compatibility
        </span>
        <h2
          className="display"
          style={{ fontSize: "clamp(36px, 5vw, 64px)", marginTop: 18, marginBottom: 14 }}
        >
          One tool for <em>every major platform.</em>
        </h2>
        <p
          style={{
            color: "var(--muted)",
            fontSize: 17,
            maxWidth: 600,
            margin: "0 auto",
            lineHeight: 1.6,
          }}
        >
          The networks people actually use — videos, photos, carousels, audio,
          playlists. One pipeline, real data, no fakes.
        </p>
      </div>
      <div
        style={{
          overflow: "hidden",
          maskImage:
            "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        }}
      >
        <div
          className="marquee-track"
          style={{ display: "flex", gap: 14, width: "max-content" }}
        >
          {row.map((p, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "14px 22px",
                background: "white",
                border: "1px solid var(--line)",
                borderRadius: 14,
                minWidth: 200,
              }}
            >
              <Platform name={p} size={32} />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
                  {p}
                </span>
                <span style={{ fontSize: 11, color: "var(--muted)" }}>Supported · 4K</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="container-da" style={{ textAlign: "center", marginTop: 40 }}>
        <span style={{ color: "var(--muted)", fontSize: 13 }}>
          Plus generic image / direct-file URLs.
        </span>
      </div>
    </section>
  );
};

export const FeaturesSection = () => {
  const features = [
    {
      icon: "globe" as const,
      title: "Every major platform",
      body:
        "YouTube, Instagram, TikTok, X, Facebook, Reddit, Pinterest, Vimeo, SoundCloud — videos, photos, carousels, audio, playlists, all from one engine.",
      stat: "9+",
      statLabel: "platforms",
    },
    {
      icon: "gem" as const,
      title: "Original quality",
      body:
        "Up to 8K when the source has it. No re-encoding, no compression artifacts. We pull the best master available and pass it to you, untouched.",
      stat: "8K",
      statLabel: "native max",
    },
    {
      icon: "bolt" as const,
      title: "Lightning Fast",
      body:
        "Distributed edge nodes and a streaming pipeline mean you start receiving the file in milliseconds — not after a long server-side wait.",
      stat: "< 200ms",
      statLabel: "time-to-first-byte",
    },
  ];
  return (
    <section id="features" className="section-pad">
      <div className="container-da">
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: 56,
            gap: 40,
            flexWrap: "wrap",
          }}
        >
          <div style={{ maxWidth: 640 }}>
            <span className="eyebrow">
              <span className="dot" />
              What makes it different
            </span>
            <h2
              className="display"
              style={{ fontSize: "clamp(40px, 5.5vw, 72px)", marginTop: 18 }}
            >
              Built for people who <em>care about quality.</em>
            </h2>
          </div>
          <p
            style={{
              color: "var(--muted)",
              fontSize: 16,
              lineHeight: 1.6,
              maxWidth: 380,
            }}
          >
            Most downloaders are clutter — ads, redirects, mystery files. We rebuilt
            the category around three uncompromising principles.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 20,
          }}
        >
          {features.map((f, i) => (
            <div
              key={i}
              className="card card-hover"
              style={{
                padding: 32,
                display: "flex",
                flexDirection: "column",
                gap: 24,
                minHeight: 360,
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, var(--grad-from), var(--grad-to))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                }}
              >
                <Icon name={f.icon} size={24} stroke="white" />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  className="serif"
                  style={{
                    fontSize: 28,
                    lineHeight: 1.1,
                    marginBottom: 12,
                    color: "var(--ink)",
                  }}
                >
                  {f.title}
                </div>
                <p
                  style={{
                    color: "var(--muted)",
                    fontSize: 15,
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {f.body}
                </p>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                  paddingTop: 20,
                  borderTop: "1px solid var(--line)",
                }}
              >
                <span
                  className="serif brand-grad-text"
                  style={{ fontSize: 36, lineHeight: 1 }}
                >
                  {f.stat}
                </span>
                <span style={{ color: "var(--muted)", fontSize: 13 }}>
                  {f.statLabel}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const HowItWorksSection = ({ onDemo }: { onDemo: () => void }) => {
  const steps = [
    {
      n: "01",
      title: "Paste any link",
      body: "A URL from a video, song, image, post, or thread. We auto-detect the platform.",
    },
    {
      n: "02",
      title: "Pick quality & format",
      body: "Choose a v1 free format up to 1080p, including video, audio-only, or image downloads.",
    },
    {
      n: "03",
      title: "Download in seconds",
      body: "Streamed straight to your device, encrypted in transit, no history retained.",
    },
  ];
  return (
    <section className="section-pad" style={{ background: "var(--ink)", color: "white" }}>
      <div className="container-da">
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <span
            className="eyebrow"
            style={{
              background: "rgba(255,255,255,0.05)",
              borderColor: "rgba(255,255,255,0.1)",
              color: "white",
            }}
          >
            <span className="dot" />
            Three steps. That&apos;s it.
          </span>
          <h2
            className="display"
            style={{
              fontSize: "clamp(40px, 5.5vw, 72px)",
              marginTop: 18,
              color: "white",
            }}
          >
            From link to file in{" "}
            <em style={{ color: "rgba(255,255,255,0.5)" }}>under ten seconds.</em>
          </h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 0,
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 24,
            overflow: "hidden",
          }}
        >
          {steps.map((s, i) => (
            <div
              key={i}
              style={{
                padding: 36,
                borderRight:
                  i < steps.length - 1 ? "1px solid rgba(255,255,255,0.08)" : "none",
                display: "flex",
                flexDirection: "column",
                gap: 20,
                minHeight: 280,
                position: "relative",
              }}
            >
              <span
                className="serif brand-grad-text"
                style={{ fontSize: 56, lineHeight: 1 }}
              >
                {s.n}
              </span>
              <div>
                <div
                  className="serif"
                  style={{ fontSize: 26, color: "white", marginBottom: 10 }}
                >
                  {s.title}
                </div>
                <p
                  style={{
                    color: "rgba(255,255,255,0.6)",
                    fontSize: 15,
                    lineHeight: 1.6,
                    margin: 0,
                  }}
                >
                  {s.body}
                </p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 40 }}>
          <button className="btn btn-grad" onClick={onDemo}>
            Try it now <Icon name="arrow-right" size={16} stroke="white" />
          </button>
        </div>
      </div>
    </section>
  );
};

export const StatsSection = () => {
  const stats = [
    { num: "1080p", label: "Free quality cap" },
    { num: "9+", label: "Platforms supported" },
    { num: "Soon", label: "Paid plans" },
    { num: "0", label: "Ads, watermarks, tracking" },
  ];
  return (
    <section className="section-pad">
      <div className="container-da">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 40,
            padding: "60px 40px",
            background: "var(--surface)",
            borderRadius: 24,
            border: "1px solid var(--line)",
          }}
        >
          {stats.map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 6,
                borderLeft: i > 0 ? "1px solid var(--line)" : "none",
                paddingLeft: i > 0 ? 32 : 0,
              }}
            >
              <span
                className="serif"
                style={{
                  fontSize: "clamp(40px, 4vw, 56px)",
                  lineHeight: 1,
                  color: "var(--ink)",
                }}
              >
                {s.num}
              </span>
              <span style={{ color: "var(--muted)", fontSize: 14 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const TestimonialsSection = () => {
  const quotes = [
    {
      quote:
        "I’ve been a power user of every downloader on the market. None of them feel as considered, fast, or trustworthy as this one.",
      author: "Mira Okafor",
      role: "Documentary editor",
      initial: "M",
    },
    {
      quote:
        "Our archival team uses it daily. The 4K source preservation and audio-extraction quality are genuinely best in class.",
      author: "Daniel Reyes",
      role: "Lead, Atrium Records",
      initial: "D",
    },
    {
      quote:
        "Switched the whole studio over within a week. The clipboard-paste flow alone saves us hours.",
      author: "Lina Craft",
      role: "Founder, Lina Studio",
      initial: "L",
    },
    {
      quote:
        "Finally a tool that respects users. No ads, no dark patterns, no surprises — just a beautifully made product.",
      author: "Hiroshi Tanaka",
      role: "Product designer",
      initial: "H",
    },
  ];
  return (
    <section className="section-pad" style={{ background: "var(--surface)" }}>
      <div className="container-da">
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <span className="eyebrow">
            <span className="dot" />
            Built for power users
          </span>
          <h2
            className="display"
            style={{ fontSize: "clamp(40px, 5.5vw, 72px)", marginTop: 18 }}
          >
            People who <em>rely</em> on it daily.
          </h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {quotes.map((q, i) => (
            <div
              key={i}
              className="card"
              style={{
                padding: 28,
                display: "flex",
                flexDirection: "column",
                gap: 20,
                background: "white",
              }}
            >
              <div style={{ display: "flex", gap: 2, color: "#f5b301" }}>
                {[0, 1, 2, 3, 4].map((s) => (
                  <Icon key={s} name="star" size={14} />
                ))}
              </div>
              <p
                className="serif"
                style={{
                  fontSize: 20,
                  lineHeight: 1.35,
                  color: "var(--ink)",
                  margin: 0,
                  flex: 1,
                }}
              >
                &ldquo;{q.quote}&rdquo;
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  paddingTop: 16,
                  borderTop: "1px solid var(--line)",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, var(--grad-from), var(--grad-to))",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 14,
                    fontWeight: 500,
                  }}
                >
                  {q.initial}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
                    {q.author}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{q.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export const PricingSection = () => {
  const tiers = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      blurb: "Occasional downloads, no card required.",
      cta: "Start free",
      ctaStyle: "ghost" as const,
      disabled: false,
      features: [
        `${ANON_DAILY_DOWNLOAD_LIMIT} anonymous downloads / day`,
        `${FREE_USER_DAILY_DOWNLOAD_LIMIT} signed-in downloads / day`,
        "Up to 1080p quality",
        "MP4 / MP3 / JPG",
        "Single-URL only",
        "7-day history (signed-in)",
      ],
      popular: false,
    },
    {
      name: "Pro",
      price: "Soon",
      period: "",
      blurb: "Paid plans are coming after the core downloader proves demand.",
      cta: "Coming soon",
      ctaStyle: "pop" as const,
      disabled: true,
      features: [
        "Unlimited downloads",
        "Up to 8K quality",
        "Playlists (YouTube, etc.)",
        "Batch up to 50 URLs",
        "Carousels delivered as zip",
        "Permanent history",
      ],
      popular: true,
    },
  ];

  const onCta = async (tier: (typeof tiers)[number]) => {
    if (tier.disabled) return;
    window.location.hash = "#";
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <section id="pricing" className="section-pad">
      <div className="container-da">
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <span className="eyebrow">
            <span className="dot" />
            Pricing
          </span>
          <h2
            className="display"
            style={{
              fontSize: "clamp(40px, 5.5vw, 72px)",
              marginTop: 18,
              marginBottom: 14,
            }}
          >
            Simple plans. <em>No surprises.</em>
          </h2>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: 16,
            alignItems: "stretch",
            maxWidth: 760,
            margin: "0 auto",
          }}
        >
          {tiers.map((t, i) => {
            const pop = t.ctaStyle === "pop";
            return (
              <div
                key={i}
                className={pop ? "price-pop" : "card"}
                style={{
                  padding: 32,
                  borderRadius: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 22,
                  position: "relative",
                  border: pop ? "none" : "1px solid var(--line)",
                }}
              >
                {t.popular && (
                  <span
                    style={{
                      position: "absolute",
                      top: 16,
                      right: 16,
                      fontSize: 10,
                      fontWeight: 600,
                      padding: "4px 10px",
                      borderRadius: 999,
                      background:
                        "linear-gradient(135deg,var(--grad-from),var(--grad-to))",
                      color: "white",
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Coming soon
                  </span>
                )}
                <div>
                  <div
                    className={pop ? "label" : ""}
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: pop ? undefined : "var(--muted)",
                      marginBottom: 6,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                    }}
                  >
                    {t.name}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span
                      className="serif"
                      style={{
                        fontSize: 56,
                        lineHeight: 1,
                        color: pop ? "white" : "var(--ink)",
                      }}
                    >
                      {t.price}
                    </span>
                    {t.period && (
                      <span
                        style={{
                          fontSize: 13,
                          color: pop ? "rgba(255,255,255,0.5)" : "var(--muted)",
                          whiteSpace: "nowrap",
                          marginTop: 4,
                        }}
                      >
                        {t.period}
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: 14,
                      color: pop ? "rgba(255,255,255,0.7)" : "var(--muted)",
                      margin: "10px 0 0",
                      lineHeight: 1.5,
                    }}
                  >
                    {t.blurb}
                  </p>
                </div>
                <div
                  style={{
                    height: 1,
                    background: pop ? "rgba(255,255,255,0.1)" : "var(--line)",
                  }}
                />
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    flex: 1,
                  }}
                >
                  {t.features.map((feat, j) => (
                    <li
                      key={j}
                      className={pop ? "feature" : ""}
                      style={{
                        display: "flex",
                        gap: 10,
                        fontSize: 14,
                        color: pop ? undefined : "var(--ink-2)",
                        lineHeight: 1.4,
                      }}
                    >
                      <Icon
                        name="check"
                        size={16}
                        stroke={pop ? "#3aa86a" : "var(--grad-to)"}
                        strokeWidth={2.2}
                      />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={pop ? "btn btn-grad" : "btn btn-ghost"}
                  onClick={() => onCta(t)}
                  disabled={t.disabled}
                  aria-disabled={t.disabled}
                  style={{
                    width: "100%",
                    justifyContent: "center",
                    padding: "14px 24px",
                    cursor: t.disabled ? "default" : "pointer",
                    opacity: t.disabled ? 0.82 : 1,
                  }}
                >
                  {t.cta}{" "}
                  <Icon
                    name="arrow-right"
                    size={14}
                    stroke={pop ? "white" : "var(--ink)"}
                  />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export const FAQSection = () => {
  const faqs = [
    {
      q: "Is it actually free?",
      a: `Yes. Anonymous users get ${ANON_DAILY_DOWNLOAD_LIMIT} downloads per day; signed-in free users get ${FREE_USER_DAILY_DOWNLOAD_LIMIT}, no card required. Pro is coming soon after the core downloader proves demand.`,
    },
    {
      q: "Do you keep my download history?",
      a: "Anonymous downloads keep no history. Signed-in free users get 7 days. Longer history is planned for paid plans when they launch. Source URLs are processed in-memory; we don't proxy or cache file bytes beyond what's needed to deliver them.",
    },
    {
      q: "Which platforms do you support?",
      a: "YouTube, Instagram, TikTok, X/Twitter, Facebook, Reddit, Pinterest, Vimeo, SoundCloud, plus generic image / direct-file URLs. More platforms get added based on real demand — not a vanity number.",
    },
    {
      q: "Is downloading content legal?",
      a: "It depends on the source and your local laws. Download Anything is a tool — you’re responsible for ensuring you have the right to download a given piece of content. We do not facilitate piracy.",
    },
    {
      q: "Do I need to install anything?",
      a: "No. It runs entirely in your browser. Paste, pick, download.",
    },
    {
      q: "Can I download in 4K or 8K?",
      a: "Free downloads are capped at 1080p for v1. Higher-quality Pro downloads are planned, but paid plans are not available yet.",
    },
    {
      q: "What about audio-only files?",
      a: "You can extract audio as MP3 from any video source — useful for podcasts, lectures, and music.",
    },
  ];
  const [open, setOpen] = useState<number>(0);
  return (
    <section id="faq" className="section-pad" style={{ background: "var(--surface)" }}>
      <div className="container-da" style={{ maxWidth: 880 }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <span className="eyebrow">
            <span className="dot" />
            FAQ
          </span>
          <h2
            className="display"
            style={{ fontSize: "clamp(40px, 5.5vw, 72px)", marginTop: 18 }}
          >
            Questions, <em>answered.</em>
          </h2>
        </div>
        <div
          style={{
            background: "white",
            borderRadius: 20,
            border: "1px solid var(--line)",
            padding: "8px 32px",
          }}
        >
          {faqs.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                className="faq-item"
                style={{
                  borderBottom:
                    i < faqs.length - 1 ? "1px solid var(--line)" : "none",
                }}
              >
                <button
                  className="faq-trigger"
                  onClick={() => setOpen(isOpen ? -1 : i)}
                >
                  <span>{f.q}</span>
                  <span
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: isOpen ? "var(--ink)" : "var(--surface)",
                      color: isOpen ? "white" : "var(--ink)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all .25s ease",
                      flexShrink: 0,
                      marginLeft: 16,
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        transition: "transform .25s ease",
                        transform: isOpen ? "rotate(45deg)" : "rotate(0)",
                      }}
                    >
                      <Icon
                        name="plus"
                        size={14}
                        stroke={isOpen ? "white" : "var(--ink)"}
                      />
                    </span>
                  </span>
                </button>
                <div
                  className="faq-content"
                  style={{
                    maxHeight: isOpen ? 200 : 0,
                    opacity: isOpen ? 1 : 0,
                    paddingTop: isOpen ? 14 : 0,
                  }}
                >
                  {f.a}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export const CTAStrip = ({ onDemo }: { onDemo: () => void }) => (
  <section className="section-pad">
    <div className="container-da">
      <div
        style={{
          position: "relative",
          borderRadius: 32,
          overflow: "hidden",
          padding: "80px 40px",
          background:
            "linear-gradient(135deg, var(--grad-from) 0%, var(--grad-mid) 50%, var(--grad-to) 100%)",
          textAlign: "center",
          color: "white",
        }}
      >
        <div
          className="blob-float"
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.15)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="blob-float"
          style={{
            position: "absolute",
            bottom: -120,
            left: -120,
            width: 360,
            height: 360,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.1)",
            filter: "blur(60px)",
            animationDelay: "4s",
          }}
        />
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2
            className="display"
            style={{
              fontSize: "clamp(40px, 5.5vw, 72px)",
              color: "white",
              marginBottom: 18,
            }}
          >
            Beyond clutter, we build{" "}
            <em style={{ color: "rgba(255,255,255,0.7)" }}>the simple.</em>
          </h2>
          <p
            style={{
              fontSize: 18,
              color: "rgba(255,255,255,0.85)",
              maxWidth: 580,
              margin: "0 auto 32px",
              lineHeight: 1.6,
            }}
          >
            Start with a single link. Stay for the craft. Free forever — upgrade only
            if you need more.
          </p>
          <button
            className="btn"
            onClick={onDemo}
            style={{
              background: "white",
              color: "var(--ink)",
              padding: "16px 32px",
              borderRadius: 999,
              fontSize: 15,
            }}
          >
            Try Download Anything <Icon name="arrow-right" size={16} stroke="var(--ink)" />
          </button>
        </div>
      </div>
    </div>
  </section>
);

export const Footer = () => {
  const cols = [
    { title: "Product", links: ["Downloader", "Pricing", "Changelog", "API", "Status"] },
    {
      title: "Resources",
      links: ["Documentation", "Help center", "Community", "Blog", "Brand kit"],
    },
    { title: "Company", links: ["About", "Careers", "Press", "Contact"] },
    {
      title: "Legal",
      links: ["Terms", "Privacy", "Cookies", "DMCA", "Acceptable use"],
    },
  ];
  return (
    <footer style={{ background: "var(--ink)", color: "white", padding: "80px 0 40px" }}>
      <div className="container-da">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.4fr repeat(4, 1fr)",
            gap: 40,
            paddingBottom: 60,
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div>
            <LogoLockup size={28} color="white" />
            <p
              style={{
                color: "rgba(255,255,255,0.5)",
                fontSize: 14,
                lineHeight: 1.6,
                marginTop: 18,
                maxWidth: 280,
              }}
            >
              Universal download solution. From a single link to a beautifully delivered
              file.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 24 }}>
              {["Twitter", "Instagram", "LinkedIn", "Reddit"].map((p) => (
                <div
                  key={p}
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    border: "1px solid rgba(255,255,255,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                  }}
                >
                  <Platform name={p} size={20} />
                </div>
              ))}
            </div>
          </div>
          {cols.map((c, i) => (
            <div key={i}>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  color: "white",
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 18,
                }}
              >
                {c.title}
              </div>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {c.links.map((l, j) => (
                  <li key={j}>
                    <a
                      href="#"
                      style={{
                        color: "rgba(255,255,255,0.6)",
                        textDecoration: "none",
                        fontSize: 14,
                      }}
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 28,
            fontSize: 13,
            color: "rgba(255,255,255,0.4)",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <span>© 2026 Download Anything. All rights reserved.</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span
              className="pulse-dot"
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#3aa86a",
              }}
            />
            All systems operational
          </span>
        </div>
      </div>
    </footer>
  );
};
