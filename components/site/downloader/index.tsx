"use client";

import { useEffect } from "react";
import { Icon, Logo } from "../logo";
import { useExtraction } from "./use-extraction";
import { platformLabel as getPlatformLabel, platformGradient, fmtDuration } from "./constants";
import { PasteView } from "./paste-view";
import { SpinnerView } from "./spinner-view";
import { PreviewView } from "./preview-view";
import { DoneView } from "./done-view";
import { ErrorView } from "./error-view";
import type { DownloadRecord } from "./types";

export type { DownloadRecord } from "./types";

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
  const ext = useExtraction({ open, initialUrl, onComplete });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const platformLabel = ext.result
    ? getPlatformLabel(ext.result.platform)
    : "";
  const thumbColor = ext.result
    ? platformGradient(ext.result.platform)
    : "";
  const flatFormats = ext.result
    ? ext.result.items.flatMap((i) => i.formats)
    : [];

  const headerTitle: Record<string, string> = {
    paste: "Paste any link",
    analyzing: "Analyzing link…",
    preview: "Ready to download",
    downloading: "Downloading",
    done: "Download complete",
    error: "Couldn't process this link",
  };

  const headerSub: Record<string, string> = {
    paste: "YouTube, Instagram, TikTok, X, Facebook, Reddit, Pinterest, Vimeo, SoundCloud",
    analyzing: "Fetching real metadata",
    preview: ext.result
      ? `${platformLabel} · ${fmtDuration(ext.result.duration)}`
      : "",
    downloading: "Streaming to your device",
    done: "Saved",
    error: ext.errorMsg || ext.errorCode,
  };

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
              <span
                style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}
              >
                {headerTitle[ext.step]}
              </span>
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                {headerSub[ext.step]}
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
          {ext.step === "paste" && (
            <PasteView
              url={ext.url}
              onUrlChange={ext.setUrl}
              onAnalyze={ext.analyze}
              onPaste={ext.handlePaste}
            />
          )}
          {ext.step === "analyzing" && (
            <SpinnerView
              title="Reading the source…"
              subtitle="Resolving title, formats, sizes"
            />
          )}
          {ext.step === "preview" && ext.result && (
            <PreviewView
              result={ext.result}
              flatFormats={flatFormats}
              selectedFormatId={ext.selectedFormatId}
              onSelectFormat={ext.setSelectedFormatId}
              onDownload={ext.startDownload}
              onReset={ext.reset}
              platformLabel={platformLabel}
              thumbColor={thumbColor}
            />
          )}
          {ext.step === "downloading" && (
            <SpinnerView
              title="Fetching your file…"
              subtitle="Large files may take up to a minute."
            />
          )}
          {ext.step === "done" && ext.result && (
            <DoneView title={ext.result.title} remaining={ext.remaining} onReset={ext.reset} />
          )}
          {ext.step === "error" && (
            <ErrorView
              errorCode={ext.errorCode}
              errorMsg={ext.errorMsg}
              onReset={ext.reset}
            />
          )}
        </div>

        {ext.step !== "done" && ext.step !== "error" && (
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
            <span
              style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
            >
              <Icon name="lock" size={12} /> HTTPS only · No file bytes proxied
              beyond what's needed
            </span>
            <span>Free tier: 5 / day · Pro: unlimited</span>
          </div>
        )}
      </div>
    </div>
  );
};
