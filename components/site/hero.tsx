"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Icon, LogoLockup } from "./logo";
import { Platform } from "./platforms";
import { useAuth } from "@/hooks/use-auth";
import type { DownloadRecord } from "./downloader/types";

const VIDEO_SRC =
  "https://videos.pexels.com/video-files/3129671/3129671-hd_1920_1080_30fps.mp4";
const VIDEO_FALLBACK =
  "https://videos.pexels.com/video-files/2871916/2871916-hd_1920_1080_24fps.mp4";

export const Hero = ({
  onOpenDownloader,
  showVideo = true,
}: {
  onOpenDownloader: (url: string) => void;
  showVideo?: boolean;
}) => {
  const vA = useRef<HTMLVideoElement>(null);
  const vB = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const stateRef = useRef<{ active: "A" | "B" }>({ active: "A" });
  const [opA, setOpA] = useState(1);
  const [opB, setOpB] = useState(0);

  useEffect(() => {
    if (!showVideo) return;
    const a = vA.current;
    const b = vB.current;
    if (!a || !b) return;
    [a, b].forEach((v) => {
      v.muted = true;
      v.playsInline = true;
      v.preload = "auto";
    });
    const onErr = (v: HTMLVideoElement) => () => {
      if (v.src !== VIDEO_FALLBACK) v.src = VIDEO_FALLBACK;
    };
    const aErr = onErr(a);
    const bErr = onErr(b);
    a.addEventListener("error", aErr);
    b.addEventListener("error", bErr);
    const stallTimer = setTimeout(() => {
      if (a.readyState < 2 && a.src !== VIDEO_FALLBACK) {
        a.src = VIDEO_FALLBACK;
        a.load();
        a.play().catch(() => {});
      }
      if (b.readyState < 2 && b.src !== VIDEO_FALLBACK) {
        b.src = VIDEO_FALLBACK;
        b.load();
      }
    }, 3000);
    a.play().catch(() => {});

    const FADE = 0.8;

    const tick = () => {
      const active = stateRef.current.active === "A" ? a : b;
      const inactive = stateRef.current.active === "A" ? b : a;
      if (active.duration && !isNaN(active.duration)) {
        const t = active.currentTime;
        const d = active.duration;
        const remain = d - t;
        if (remain <= FADE && inactive.paused) {
          inactive.currentTime = 0;
          inactive.play().catch(() => {});
        }
        if (remain <= FADE) {
          const k = Math.max(0, remain / FADE);
          if (stateRef.current.active === "A") {
            setOpA(k);
            setOpB(1 - k);
          } else {
            setOpB(k);
            setOpA(1 - k);
          }
          if (remain <= 0.05) {
            stateRef.current.active = stateRef.current.active === "A" ? "B" : "A";
            active.pause();
            active.currentTime = 0;
            if (stateRef.current.active === "A") {
              setOpA(1);
              setOpB(0);
            } else {
              setOpA(0);
              setOpB(1);
            }
          }
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearTimeout(stallTimer);
      a.removeEventListener("error", aErr);
      b.removeEventListener("error", bErr);
    };
  }, [showVideo]);

  return (
    <section
      style={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        background: "#0a0a0a",
      }}
    >
      {showVideo && (
        <div
          style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}
        >
          <video
            ref={vA}
            src={VIDEO_SRC}
            autoPlay
            muted
            playsInline
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: opA,
              transition: "opacity 0.05s linear",
            }}
          />
          <video
            ref={vB}
            src={VIDEO_SRC}
            muted
            playsInline
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: opB,
              transition: "opacity 0.05s linear",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.45) 30%, rgba(0,0,0,0.55) 60%, rgba(10,10,10,0.85) 85%, #ffffff 100%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "radial-gradient(ellipse 70% 55% at 50% 42%, rgba(0,0,0,0.55), transparent 70%)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, rgba(0,0,0,0.4) 0%, transparent 25%, transparent 75%, rgba(0,0,0,0.4) 100%)",
              pointerEvents: "none",
            }}
          />
        </div>
      )}
      {!showVideo && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, #0a0a0a 0%, #0a0a0a 70%, #fff 100%)",
            zIndex: 0,
          }}
        />
      )}

      <nav style={{ position: "relative", zIndex: 10 }}>
        <div
          className="container-da"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 32px",
          }}
        >
          <div className="fade-rise" style={{ flex: "0 0 auto" }}>
            <LogoLockup size={26} color="white" />
          </div>
          <div
            className="fade-rise-1"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "6px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 999,
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
            }}
          >
            {["Features", "Platforms", "Pricing", "FAQ"].map((label) => (
              <a
                key={label}
                href={`#${label.toLowerCase()}`}
                style={{
                  fontSize: 13,
                  color: "rgba(255,255,255,0.85)",
                  textDecoration: "none",
                  padding: "8px 16px",
                  borderRadius: 999,
                  transition: "background .2s ease",
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.background =
                    "rgba(255,255,255,0.1)")
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLAnchorElement).style.background = "transparent")
                }
              >
                {label}
              </a>
            ))}
          </div>
          <NavAuth onOpenDownloader={onOpenDownloader} />
        </div>
      </nav>

      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "70px 24px 220px",
        }}
      >
        <div className="fade-rise-1" style={{ marginBottom: 28 }}>
          <span
            className="eyebrow"
            style={{
              background: "rgba(255,255,255,0.08)",
              borderColor: "rgba(255,255,255,0.15)",
              color: "white",
              backdropFilter: "blur(10px)",
            }}
          >
            <span className="dot" />
            One link · Every major platform · Up to 8K
          </span>
        </div>
        <h1
          className="display fade-rise-2"
          style={{
            fontSize: "clamp(44px, 8vw, 120px)",
            maxWidth: 1100,
            fontWeight: 400,
            margin: 0,
            padding: "0 16px",
            color: "white",
            textShadow:
              "0 2px 30px rgba(0,0,0,0.5), 0 1px 4px rgba(0,0,0,0.4)",
          }}
        >
          Paste a link. Get the file.{" "}
          <em style={{ color: "rgba(255,255,255,0.7)" }}>It&apos;s that simple.</em>
        </h1>
        <p
          className="fade-rise-3"
          style={{
            fontSize: "clamp(15px, 1.4vw, 19px)",
            color: "rgba(255,255,255,0.92)",
            maxWidth: 640,
            margin: "28px auto 0",
            lineHeight: 1.6,
            textShadow: "0 1px 20px rgba(0,0,0,0.6)",
          }}
        >
          Download videos, music, images, posts and playlists from YouTube, Instagram,
          TikTok, X, Facebook, Reddit, Pinterest, Vimeo, and SoundCloud — in original
          quality, up to 8K on Pro. No ads, no watermarks, no mock data.
        </p>

        <div
          className="fade-rise-4"
          style={{ width: "100%", maxWidth: 720, marginTop: 40, padding: "0 16px" }}
        >
          <HeroDownloaderTrigger onAnalyze={onOpenDownloader} />
          <div
            style={{
              display: "flex",
              gap: 16,
              justifyContent: "center",
              alignItems: "center",
              marginTop: 18,
              fontSize: 12,
              color: "rgba(255,255,255,0.7)",
              flexWrap: "wrap",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="lock" size={12} stroke="rgba(255,255,255,0.7)" /> Encrypted
            </span>
            <span>·</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="bolt" size={12} stroke="rgba(255,255,255,0.7)" /> Lightning fast
            </span>
            <span>·</span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="infinity" size={12} stroke="rgba(255,255,255,0.7)" /> 9+ major
              platforms
            </span>
          </div>
        </div>

        <div
          className="fade-rise-4"
          style={{
            display: "flex",
            gap: 14,
            alignItems: "center",
            marginTop: 56,
            flexWrap: "wrap",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.55)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            Works with
          </span>
          {["YouTube", "Instagram", "TikTok", "Twitter", "Facebook", "Reddit", "Vimeo", "SoundCloud"].map(
            (p) => (
              <Platform key={p} name={p} size={26} />
            )
          )}
        </div>
      </div>
    </section>
  );
};

const HeroDownloaderTrigger = ({
  onAnalyze,
}: {
  onAnalyze: (url: string) => void;
}) => {
  const [val, setVal] = useState("");
  const submit = () => {
    const url = val.trim();
    if (!url) return;
    onAnalyze(url);
  };
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "rgba(255,255,255,0.95)",
        border: "1px solid rgba(255,255,255,0.5)",
        borderRadius: 999,
        padding: "8px 8px 8px 22px",
        boxShadow: "0 24px 60px -10px rgba(0,0,0,0.5)",
        backdropFilter: "blur(20px)",
      }}
    >
      <Icon name="link" size={18} stroke="var(--muted)" />
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
        }}
        placeholder="Paste a YouTube, TikTok, Instagram, or any link…"
        style={{
          flex: 1,
          border: "none",
          outline: "none",
          fontFamily: "'Inter', sans-serif",
          fontSize: 15,
          color: "var(--ink)",
          background: "transparent",
          padding: "12px 8px",
        }}
      />
      <button
        className="btn btn-grad"
        onClick={submit}
        style={{ padding: "13px 26px", fontSize: 14 }}
      >
        <Icon name="download" size={16} stroke="white" />
        Download
      </button>
    </div>
  );
};

const NavAuth = ({ onOpenDownloader }: { onOpenDownloader: (url: string) => void }) => {
  const { user, loading, signOut } = useAuth();
  if (loading) return <div style={{ width: 120 }} />;
  if (user) {
    return (
      <div className="fade-rise-2" style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 auto" }}>
        <a
          href="/account"
          style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", textDecoration: "none", padding: "8px 14px" }}
        >
          Account
        </a>
        <button
          className="btn"
          onClick={() => onOpenDownloader("")}
          style={{ background: "white", color: "var(--ink)", borderRadius: 999, padding: "10px 18px", fontSize: 13, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <Icon name="download" size={14} stroke="var(--ink)" />
          Download
        </button>
      </div>
    );
  }
  return (
    <div className="fade-rise-2" style={{ display: "flex", alignItems: "center", gap: 10, flex: "0 0 auto" }}>
      <a
        href="/login"
        style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", textDecoration: "none", padding: "8px 14px" }}
      >
        Sign in
      </a>
      <button
        className="btn"
        onClick={() => onOpenDownloader("")}
        style={{ background: "white", color: "var(--ink)", borderRadius: 999, padding: "10px 18px", fontSize: 13, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6 }}
      >
        <Icon name="download" size={14} stroke="var(--ink)" />
        Start downloading
      </button>
    </div>
  );
};

export const RecentSection = ({ recent }: { recent: DownloadRecord[] }) => {
  if (!recent || recent.length === 0) return null;
  return (
    <section style={{ padding: "60px 0 0", background: "white" }}>
      <div className="container-da">
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 20,
            padding: 24,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="clock" size={18} stroke="var(--ink)" />
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)" }}>
                Recent downloads
              </span>
              <span className="tag">Local · {recent.length}</span>
            </div>
            <button
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--muted)",
                fontSize: 13,
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              Clear all <Icon name="trash" size={13} stroke="var(--muted)" />
            </button>
          </div>
          <div
            style={{ display: "flex", gap: 12, overflowX: "auto" }}
            className="no-scrollbar"
          >
            {recent.map((r, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: 12,
                  background: "white",
                  border: "1px solid var(--line)",
                  borderRadius: 12,
                  minWidth: 280,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 48,
                    borderRadius: 6,
                    background: r.meta.thumbColor,
                    position: "relative",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="play" size={18} stroke="white" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 500,
                      color: "var(--ink)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {r.meta.title}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 4,
                    }}
                  >
                    {r.platform && <Platform name={r.platform} size={14} />}
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>
                      {r.quality.toUpperCase()} · {r.format}
                    </span>
                  </div>
                </div>
                <button
                  style={{
                    alignSelf: "flex-start",
                    background: "var(--surface)",
                    border: "none",
                    borderRadius: 6,
                    width: 26,
                    height: 26,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon name="download" size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
