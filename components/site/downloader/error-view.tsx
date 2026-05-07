import { labelForError } from "./constants";

export const ErrorView = ({
  errorCode,
  errorMsg,
  onReset,
}: {
  errorCode: string;
  errorMsg: string;
  onReset: () => void;
}) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      gap: 16,
      padding: "10px 0",
      textAlign: "center",
    }}
  >
    <div style={{ fontSize: 18, fontWeight: 500, color: "var(--ink)" }}>
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
      <button className="btn btn-ghost" onClick={onReset}>
        Try another link
      </button>
    )}
  </div>
);
