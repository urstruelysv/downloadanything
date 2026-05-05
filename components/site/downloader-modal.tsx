"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";
import { Icon, Logo } from "./logo";
import { Platform } from "./platforms";

export type DownloadRecord = {
  url: string;
  platform: string | null;
  meta: { title: string; thumbColor: string };
  quality: string;
  format: string;
  completedAt: number;
};

type Format = {
  formatId: string;
  quality: string;
  ext: string;
  sizeBytes?: number;
  delivery: "direct" | "worker-stream" | "worker-r2";
  directUrl?: string;
};

type ExtractItem = {
  id: string;
  type: "video" | "photo" | "audio";
  formats: Format[];
};

type ExtractResult = {
  platform: string;
  contentType: string;
  title: string;
  thumbnail?: string;
  duration?: number;
  items: ExtractItem[];
  remaining?: number;
  plan?: "free" | "subscribed";
};

const PLATFORM_LABEL: Record<string, string> = {
  youtube: "YouTube",
  instagram: "Instagram",
  tiktok: "TikTok",
  twitter: "Twitter",
  facebook: "Facebook",
  reddit: "Reddit",
  pinterest: "Pinterest",
  vimeo: "Vimeo",
  soundcloud: "SoundCloud",
  generic: "Source",
};

const PLATFORM_COLOR: Record<string, string> = {
  youtube: "linear-gradient(135deg,#ff4d4d,#7a0000)",
  instagram: "linear-gradient(135deg,#feda75,#d62976,#4f5bd5)",
  tiktok: "linear-gradient(135deg,#25f4ee,#000,#fe2c55)",
  twitter: "linear-gradient(135deg,#000,#222)",
  facebook: "linear-gradient(135deg,#1877f2,#0a3d91)",
  reddit: "linear-gradient(135deg,#ff4500,#a02b00)",
  pinterest: "linear-gradient(135deg,#e60023,#7a0012)",
  vimeo: "linear-gradient(135deg,#1ab7ea,#005670)",
  soundcloud: "linear-gradient(135deg,#ff7a00,#ff3300)",
  generic: "linear-gradient(135deg,#666,#222)",
};

type Step = "paste" | "analyzing" | "preview" | "downloading" | "done" | "error";

function fmtDuration(s?: number): string {
  if (!s || s <= 0) return "—";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function fmtBytes(b?: number): string {
  if (!b) return "";
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export const DownloaderModal = ({
  open,
  onClose,
  initialUrl = "",
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  initialUrl?: string;
  onComplete?: (record: DownloadRecord) => void;
}) => {
  const [step, setStep] = useState<Step>("paste");
  const [url, setUrl] = useState(initialUrl);
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [selectedFormatId, setSelectedFormatId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [errorCode, setErrorCode] = useState<string>("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open) {
      setUrl(initialUrl);
      setResult(null);
      setErrorMsg("");
      setErrorCode("");
      setStep("paste");
      if (initialUrl) {
        analyze(initialUrl);
      }
    } else {
      abortRef.current?.abort();
    }
    return () => abortRef.current?.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialUrl]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const analyze = async (link: string) => {
    if (!link.trim()) return;
    setStep("analyzing");
    setErrorMsg("");
    setErrorCode("");
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: link }),
        signal: ac.signal,
      });
      const body = await res.json();
      if (!res.ok) {
        setErrorCode(body.error ?? "internal");
        setErrorMsg(body.message ?? labelForError(body.error));
        setStep("error");
        return;
      }
      const r = body as ExtractResult;
      setResult(r);
      const flat = r.items.flatMap((i) => i.formats);
      setSelectedFormatId(flat[0]?.formatId ?? "");
      setStep("preview");
    } catch (e: any) {
      if (e.name === "AbortError") return;
      setErrorCode("network");
      setErrorMsg("Network error. Check your connection and retry.");
      setStep("error");
    }
  };

  const startDownload = async () => {
    if (!result || !selectedFormatId) return;
    const flat = result.items.flatMap((i) => i.formats);
    const fmt = flat.find((f) => f.formatId === selectedFormatId);
    if (!fmt) return;
    setStep("downloading");
    setErrorMsg("");
    try {
      const body: Record<string, string> = {
        url,
        formatId: selectedFormatId,
      };
      if (fmt.delivery === "direct" && fmt.directUrl) {
        body.directUrl = fmt.directUrl;
      }
      const res = await fetch("/api/download", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        redirect: "follow",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        setErrorCode(err.error ?? "internal");
        setErrorMsg(err.message ?? labelForError(err.error));
        setStep("error");
        return;
      }
      const ct = res.headers.get("content-type") ?? "";
      let downloadUrl: string;
      let blob: Blob | null = null;
      if (ct.includes("application/json")) {
        const j = (await res.json()) as { r2Url: string };
        downloadUrl = j.r2Url;
      } else {
        blob = await res.blob();
        downloadUrl = URL.createObjectURL(blob);
      }
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `${result.title.replace(/[^\w\d.-]+/g, "_")}.${fmt.ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      if (blob) setTimeout(() => URL.revokeObjectURL(downloadUrl), 30_000);
      onComplete?.({
        url,
        platform: PLATFORM_LABEL[result.platform] ?? null,
        meta: {
          title: result.title,
          thumbColor: PLATFORM_COLOR[result.platform] ?? PLATFORM_COLOR.generic,
        },
        quality: fmt.quality,
        format: fmt.ext.toUpperCase(),
        completedAt: Date.now(),
      });
      setStep("done");
    } catch (e) {
      setErrorCode("network");
      setErrorMsg("Network error during download. Retry.");
      setStep("error");
    }
  };

  const reset = () => {
    setUrl("");
    setResult(null);
    setSelectedFormatId("");
    setErrorMsg("");
    setErrorCode("");
    setStep("paste");
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        analyze(text);
      }
    } catch {}
  };

  if (!open) return null;

  const platformLabel = result ? PLATFORM_LABEL[result.platform] ?? "Source" : "";
  const thumbColor = result ? PLATFORM_COLOR[result.platform] ?? PLATFORM_COLOR.generic : "";
  const flatFormats = result ? result.items.flatMap((i) => i.formats) : [];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 24px",
            borderBottom: "1px solid var(--line)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo size={22} />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>
                {step === "paste" && "Paste any link"}
                {step === "analyzing" && "Analyzing link…"}
                {step === "preview" && "Ready to download"}
                {step === "downloading" && "Downloading"}
                {step === "done" && "Download complete"}
                {step === "error" && "Couldn't process this link"}
              </span>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                {step === "paste" && "YouTube, Instagram, TikTok, X, Facebook, Reddit, Pinterest, Vimeo, SoundCloud"}
                {step === "analyzing" && "Fetching real metadata"}
                {step === "preview" && result && `${platformLabel} · ${fmtDuration(result.duration)}`}
                {step === "downloading" && "Streaming to your device"}
                {step === "done" && "Saved"}
                {step === "error" && (errorMsg || errorCode)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--line)",
              borderRadius: 999,
              width: 34,
              height: 34,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--muted)",
            }}
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="scroll-area" style={{ padding: 28, overflowY: "auto" }}>
          {step === "paste" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div className="input-wrap" style={{ padding: "6px 6px 6px 22px" }}>
                <Icon name="link" size={18} stroke="var(--muted)" />
                <input
                  autoFocus
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && url.trim()) analyze(url.trim());
                  }}
                  placeholder="Paste a URL from any supported platform…"
                />
                <button
                  className="btn btn-grad"
                  style={{ padding: "10px 22px" }}
                  onClick={() => url.trim() && analyze(url.trim())}
                >
                  Analyze
                  <Icon name="arrow-right" size={16} />
                </button>
              </div>
              <button
                onClick={handlePaste}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--muted)",
                  fontSize: 13,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  alignSelf: "flex-start",
                }}
              >
                <Icon name="paste" size={14} /> Paste from clipboard
              </button>
            </div>
          )}

          {step === "analyzing" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                padding: "40px 0",
              }}
            >
              <div style={{ position: "relative", width: 80, height: 80 }}>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    border: "3px solid var(--line)",
                  }}
                />
                <div
                  className="spin-slow"
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    border: "3px solid transparent",
                    borderTopColor: "var(--grad-from)",
                    borderRightColor: "var(--grad-to)",
                  }}
                />
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: 26,
                    lineHeight: 1.1,
                    color: "var(--ink)",
                  }}
                >
                  Reading the source…
                </div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
                  Resolving title, formats, sizes
                </div>
              </div>
            </div>
          )}

          {step === "preview" && result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <div
                style={{
                  display: "flex",
                  gap: 16,
                  padding: 14,
                  border: "1px solid var(--line)",
                  borderRadius: 16,
                  background: "var(--surface)",
                }}
              >
                <div
                  style={{
                    width: 132,
                    height: 84,
                    borderRadius: 10,
                    background: result.thumbnail
                      ? `center / cover no-repeat url("${result.thumbnail}")`
                      : thumbColor,
                    flexShrink: 0,
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      bottom: 6,
                      right: 6,
                      background: "rgba(0,0,0,0.7)",
                      color: "white",
                      fontSize: 10,
                      padding: "2px 6px",
                      borderRadius: 4,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    {fmtDuration(result.duration)}
                  </span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "var(--ink)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {result.title}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginTop: 8,
                    }}
                  >
                    <Platform name={platformLabel} size={16} />
                    <span style={{ fontSize: 11, color: "var(--muted)" }}>
                      {platformLabel} · {result.contentType}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 10,
                  }}
                >
                  Format & quality
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 8,
                    maxHeight: 260,
                    overflowY: "auto",
                  }}
                >
                  {flatFormats.map((f) => (
                    <button
                      key={f.formatId}
                      className={`pill ${selectedFormatId === f.formatId ? "active" : ""}`}
                      onClick={() => setSelectedFormatId(f.formatId)}
                      style={{
                        flexDirection: "column",
                        alignItems: "flex-start",
                        padding: "10px 12px",
                        gap: 2,
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 500 }}>
                        {f.quality} · {f.ext.toUpperCase()}
                      </span>
                      <span className="sub" style={{ fontSize: 11 }}>
                        {f.delivery === "direct"
                          ? "Direct from source"
                          : f.delivery === "worker-r2"
                          ? "Server-merged"
                          : "Streamed"}
                        {f.sizeBytes ? ` · ${fmtBytes(f.sizeBytes)}` : ""}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: 6,
                }}
              >
                <button
                  onClick={reset}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--muted)",
                    fontSize: 13,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  Different link
                </button>
                <button
                  className="btn btn-primary"
                  onClick={startDownload}
                  disabled={!selectedFormatId}
                  style={{ padding: "14px 24px" }}
                >
                  <Icon name="download" size={16} stroke="white" />
                  Download
                </button>
              </div>
            </div>
          )}

          {step === "downloading" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                padding: "40px 0",
              }}
            >
              <div style={{ position: "relative", width: 80, height: 80 }}>
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    border: "3px solid var(--line)",
                  }}
                />
                <div
                  className="spin-slow"
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: "50%",
                    border: "3px solid transparent",
                    borderTopColor: "var(--grad-from)",
                    borderRightColor: "var(--grad-to)",
                  }}
                />
              </div>
              <div style={{ textAlign: "center" }}>
                <div
                  style={{
                    fontFamily: "'Instrument Serif', serif",
                    fontSize: 26,
                    lineHeight: 1.1,
                    color: "var(--ink)",
                  }}
                >
                  Fetching your file…
                </div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
                  Large files may take up to a minute.
                </div>
              </div>
            </div>
          )}

          {step === "done" && result && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 16,
                padding: "20px 0",
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg, var(--grad-from), var(--grad-to))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                }}
              >
                <Icon name="check" size={32} stroke="white" strokeWidth={2.5} />
              </div>
              <div style={{ textAlign: "center" }}>
                <div className="serif" style={{ fontSize: 32, lineHeight: 1.1, color: "var(--ink)" }}>
                  Saved.
                </div>
                <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
                  {result.title}
                </div>
              </div>
              <button className="btn btn-ghost" onClick={reset}>
                Download another
              </button>
            </div>
          )}

          {step === "error" && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                padding: "10px 0",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 500,
                  color: "var(--ink)",
                }}
              >
                {labelForError(errorCode)}
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)" }}>{errorMsg}</div>
              {errorCode === "quota_exceeded" && (
                <a
                  className="btn btn-grad"
                  href="/#pricing"
                  style={{ alignSelf: "center", padding: "12px 22px" }}
                >
                  See Pro plan
                </a>
              )}
              {errorCode !== "quota_exceeded" && (
                <button className="btn btn-ghost" onClick={reset}>
                  Try another link
                </button>
              )}
            </div>
          )}
        </div>

        {step !== "done" && step !== "error" && (
          <div
            style={{
              padding: "14px 24px",
              borderTop: "1px solid var(--line)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 11,
              color: "var(--muted)",
              background: "var(--surface)",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="lock" size={12} /> HTTPS only · No file bytes proxied beyond what's needed
            </span>
            <span>Free tier: 5 / day · Pro: unlimited</span>
          </div>
        )}
      </div>
    </div>
  );
};

function labelForError(code: string): string {
  switch (code) {
    case "invalid_url":
      return "That URL doesn't look right.";
    case "unsupported_platform":
      return "We don't support this platform yet.";
    case "unavailable":
      return "Source is private or removed.";
    case "quota_exceeded":
      return "Daily limit reached. Subscribe for unlimited downloads.";
    case "rate_limited":
      return "Too many requests. Slow down for a moment.";
    case "auth_required":
      return "Sign in required.";
    case "degraded":
      return "Extraction service is degraded. Try again in a minute.";
    case "network":
      return "Network error.";
    default:
      return "Something went wrong.";
  }
}
