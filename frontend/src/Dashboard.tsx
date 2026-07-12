import { useConvexAuth, useQuery } from "convex/react";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "../convex/_generated/api";
import PageLoader from "./PageLoader";
import TopBar from "./TopBar";

function Dashboard() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const reviewCount = useQuery(api.reviews.countByCompany, isAuthenticated ? {} : "skip");
  const requestsData = useQuery(api.shareRequests.listForCompany, isAuthenticated ? {} : "skip");
  const [lookupEmail, setLookupEmail] = useState("");

  useEffect(() => {
    if (me?.role === "company" && me.subscriptionStatus !== "active") {
      window.location.href = "/start-trial";
    }
  }, [me]);

  if (isLoading || (isAuthenticated && me === undefined)) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return (
      <>
        <TopBar />
        <CenteredMessage>
          Not signed in. <a href="/login">Sign in</a>
        </CenteredMessage>
      </>
    );
  }

  if (!me || me.role !== "company") {
    return (
      <>
        <TopBar />
        <CenteredMessage color="var(--danger)">This page is for company accounts.</CenteredMessage>
      </>
    );
  }

  if (me.subscriptionStatus !== "active") {
    return (
      <>
        <TopBar />
        <CenteredMessage>Redirecting to start your trial...</CenteredMessage>
      </>
    );
  }

  function handleLookup(e: FormEvent) {
    e.preventDefault();
    if (lookupEmail.trim()) {
      window.location.href = `/r/${encodeURIComponent(lookupEmail.trim())}`;
    }
  }

  const recent = requestsData?.requests.slice(0, 5) ?? [];

  return (
    <>
      <TopBar />
      <main style={{ padding: "40px 24px 80px", maxWidth: 760, margin: "0 auto" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 30 }}>{me.companyName}</h1>
        <p style={{ fontSize: 13, marginTop: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", display: "inline-block" }} />
          Subscription active
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
          marginBottom: 32,
        }}
      >
        <StatTile label="Reviews written" value={reviewCount ?? 0} />
        <StatTile label="Records unlocked" value={requestsData?.approvedCount ?? 0} />
        <StatTile label="Pending requests" value={requestsData?.pendingCount ?? 0} accent={requestsData?.pendingCount ? "var(--amber)" : undefined} />
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
        <a href="/review" style={cardLinkStyle} className="panel-hover">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <IconBadge icon="✎" />
            <div>
              <h2 style={{ fontSize: 17, color: "var(--text)" }}>Write a Review</h2>
              <p style={{ marginTop: 2 }}>Leave a verified performance review for a past employee.</p>
            </div>
          </div>
        </a>

        <div style={panelStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
            <IconBadge icon="🔍" />
            <div>
              <h2 style={{ fontSize: 17, color: "var(--text)" }}>Look up a Record</h2>
              <p style={{ marginTop: 2 }}>Search by email to view a candidate's Vouch Score.</p>
            </div>
          </div>
          <form onSubmit={handleLookup} style={{ display: "flex", gap: 10 }}>
            <input
              required
              type="email"
              placeholder="candidate@email.com"
              value={lookupEmail}
              onChange={(e) => setLookupEmail(e.target.value)}
              style={inputStyle}
            />
            <button type="submit" style={primaryButtonStyle}>
              View
            </button>
          </form>
        </div>
      </div>

      <section>
        <SectionHeader title="Recent activity" />
        {recent.length === 0 ? (
          <EmptyState icon="🗂️" text="No lookups yet. Search a candidate's email above to get started." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {recent.map((r) => (
              <a
                key={r._id}
                href={`/r/${encodeURIComponent(r.employeeEmail)}`}
                style={{ ...cardLinkStyle, padding: "14px 20px" }}
                className="panel-hover"
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                  <span style={{ color: "var(--text)", fontSize: 14 }}>{r.employeeEmail}</span>
                  <StatusPill status={r.status} />
                </div>
              </a>
            ))}
          </div>
        )}
      </section>
      </main>
    </>
  );
}

function CenteredMessage({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: color ?? "var(--text-dim)" }}>{children}</p>
    </main>
  );
}

function IconBadge({ icon }: { icon: string }) {
  return (
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: "rgba(110,231,183,0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 17,
        flexShrink: 0,
      }}
    >
      {icon}
    </div>
  );
}

function StatTile({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div style={panelStyle}>
      <p style={{ fontSize: 26, fontWeight: 700, fontFamily: "Syne, sans-serif", color: accent ?? "var(--text)" }}>
        {value}
      </p>
      <p style={{ fontSize: 12, marginTop: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</p>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div
      style={{
        marginBottom: 14,
        paddingBottom: 10,
        borderBottom: "1px solid var(--border)",
      }}
    >
      <h2 style={{ fontSize: 15, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--text-dim)" }}>
        {title}
      </h2>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div
      style={{
        border: "1px dashed var(--border)",
        borderRadius: 12,
        padding: "28px 20px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <p style={{ fontSize: 14 }}>{text}</p>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, { bg: string; color: string }> = {
    pending: { bg: "rgba(245,185,66,0.15)", color: "var(--amber)" },
    approved: { bg: "rgba(52,211,153,0.15)", color: "var(--accent-dim)" },
    denied: { bg: "rgba(243,108,108,0.15)", color: "var(--danger)" },
  };
  const { bg, color } = colors[status] ?? colors.pending;
  return (
    <span
      style={{
        fontSize: 12,
        padding: "4px 10px",
        borderRadius: 999,
        background: bg,
        color,
        textTransform: "capitalize",
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </span>
  );
}

const panelStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 14,
  padding: 22,
  textAlign: "left",
  background: "var(--bg-elevated)",
};

const cardLinkStyle: React.CSSProperties = {
  ...panelStyle,
  color: "var(--text)",
  textDecoration: "none",
  display: "block",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: 15,
  outline: "none",
};

const primaryButtonStyle: React.CSSProperties = {
  padding: "10px 20px",
  borderRadius: 8,
  border: "none",
  background: "var(--accent)",
  color: "#06120c",
  fontWeight: 600,
  fontSize: 15,
};

export default Dashboard;
