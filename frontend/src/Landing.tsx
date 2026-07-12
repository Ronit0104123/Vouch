function VouchMark() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden="true">
      <circle cx="14" cy="14" r="12.5" stroke="var(--accent)" strokeWidth="2" />
      <path
        d="M8.5 14.5L12 18L19.5 10"
        stroke="var(--accent)"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Landing() {
  return (
    <main
      style={{
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px",
      }}
    >
      <header
        style={{
          width: "100%",
          maxWidth: 960,
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "12px 0 48px",
        }}
      >
        <VouchMark />
        <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "18px" }}>
          Vouch
        </span>
      </header>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          gap: "28px",
          paddingBottom: "48px",
        }}
      >
        <div style={{ maxWidth: 620, display: "flex", flexDirection: "column", gap: "16px" }}>
          <h1 style={{ fontSize: "44px", lineHeight: 1.1 }}>
            A credit score for developers' work history.
          </h1>
          <p style={{ fontSize: "18px" }}>
            Past employers verify facts and rate performance. That record travels with the
            developer to every job after — one score, built once.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "14px", alignItems: "center" }}>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
            <a href="/signup?role=company" style={primaryButtonStyle}>
              Try Vouch as a Company
            </a>
            <a href="/signup?role=employee" style={secondaryButtonStyle}>
              Try Vouch as a Developer
            </a>
          </div>
          <p style={{ fontSize: "14px" }}>
            Already have an account? <a href="/login">Log in</a>
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
            maxWidth: 860,
            width: "100%",
            marginTop: "24px",
            textAlign: "left",
          }}
        >
          <ValueProp
            title="Reviews from real employers"
            body="Ratings come only from companies that actually employed the developer — not self-reported claims."
          />
          <ValueProp
            title="One record, every application"
            body="A developer builds their history once and carries it to every future job, instead of starting over each time."
          />
          <ValueProp
            title="Free to write, paid to unlock"
            body="Employers leave reviews at no cost. Hiring companies pay only when they unlock a candidate's full record."
          />
        </div>
      </div>
    </main>
  );
}

function ValueProp({ title, body }: { title: string; body: string }) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        background: "var(--bg-elevated)",
        borderRadius: "10px",
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <h3 style={{ fontSize: "15px" }}>{title}</h3>
      <p style={{ fontSize: "14px", lineHeight: 1.5 }}>{body}</p>
    </div>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  padding: "12px 22px",
  borderRadius: "8px",
  border: "none",
  background: "var(--accent)",
  color: "#06120c",
  fontWeight: 600,
  fontSize: "15px",
  textDecoration: "none",
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "12px 22px",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  background: "var(--bg-elevated)",
  color: "var(--text)",
  fontWeight: 600,
  fontSize: "15px",
  textDecoration: "none",
};

export default Landing;
