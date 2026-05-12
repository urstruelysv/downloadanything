import type { Format } from "@/shared/types";
import type { ExtractApiResponse } from "./types";
import { fmtDuration, fmtBytes } from "./constants";
import { Icon } from "../logo";
import { Platform } from "../platforms";

function deliveryLabel(format: Format): string {
  if (format.directUrl) return "Verified download link";
  if (format.delivery === "worker-r2") return "Server-merged";
  if (format.delivery === "worker-stream") return "Streamed";
  return "Direct download";
}

export const PreviewView = ({
  result,
  flatFormats,
  selectedFormatId,
  onSelectFormat,
  onDownload,
  onReset,
  platformLabel,
  thumbColor,
}: {
  result: ExtractApiResponse;
  flatFormats: Format[];
  selectedFormatId: string;
  onSelectFormat: (id: string) => void;
  onDownload: () => void;
  onReset: () => void;
  platformLabel: string;
  thumbColor: string;
}) => (
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
            onClick={() => onSelectFormat(f.formatId)}
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
              {deliveryLabel(f)}
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
        onClick={onReset}
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
        onClick={onDownload}
        disabled={!selectedFormatId}
        style={{ padding: "14px 24px" }}
      >
        <Icon name="download" size={16} stroke="white" />
        Download
      </button>
    </div>
  </div>
);
