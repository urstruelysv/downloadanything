export const SpinnerView = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) => (
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
        {title}
      </div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6 }}>
        {subtitle}
      </div>
    </div>
  </div>
);
