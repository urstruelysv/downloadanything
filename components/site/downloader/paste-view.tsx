import { Icon } from "../logo";

export const PasteView = ({
  url,
  onUrlChange,
  onAnalyze,
  onPaste,
}: {
  url: string;
  onUrlChange: (v: string) => void;
  onAnalyze: (url: string) => void;
  onPaste: () => void;
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
    <div className="input-wrap" style={{ padding: "6px 6px 6px 22px" }}>
      <Icon name="link" size={18} stroke="var(--muted)" />
      <input
        autoFocus
        value={url}
        onChange={(e) => onUrlChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && url.trim()) onAnalyze(url.trim());
        }}
        placeholder="Paste a URL from any supported platform…"
      />
      <button
        className="btn btn-grad"
        style={{ padding: "10px 22px" }}
        onClick={() => url.trim() && onAnalyze(url.trim())}
      >
        Analyze
        <Icon name="arrow-right" size={16} />
      </button>
    </div>
    <button
      onClick={onPaste}
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
);
