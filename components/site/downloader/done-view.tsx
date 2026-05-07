import { Icon } from "../logo";

export const DoneView = ({
  title,
  remaining,
  onReset,
}: {
  title: string;
  remaining: number | null;
  onReset: () => void;
}) => (
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
        background: "linear-gradient(135deg, var(--grad-from), var(--grad-to))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
      }}
    >
      <Icon name="check" size={32} stroke="white" strokeWidth={2.5} />
    </div>
    <div style={{ textAlign: "center" }}>
      <div
        className="serif"
        style={{ fontSize: 32, lineHeight: 1.1, color: "var(--ink)" }}
      >
        Saved.
      </div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
        {title}
      </div>
      {remaining !== null && (
        <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
          {remaining === Infinity
            ? "Unlimited downloads"
            : `${remaining} download${remaining === 1 ? "" : "s"} left today`}
        </div>
      )}
    </div>
    <button className="btn btn-ghost" onClick={onReset}>
      Download another
    </button>
  </div>
);
