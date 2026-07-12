import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import PageLoader from "./PageLoader";
import TopBar from "./TopBar";

function MyRecord() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const record = useQuery(api.reviews.myRecord, isAuthenticated ? {} : "skip");
  const requestsData = useQuery(api.shareRequests.listForEmployee, isAuthenticated ? {} : "skip");
  const approve = useMutation(api.shareRequests.approve);
  const deny = useMutation(api.shareRequests.deny);

  if (isLoading || (isAuthenticated && (me === undefined || record === undefined || requestsData === undefined))) {
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

  if (!me || me.role !== "employee") {
    return (
      <>
        <TopBar />
        <CenteredMessage color="var(--danger)">This page is for developer accounts.</CenteredMessage>
      </>
    );
  }

  const pending = requestsData?.requests.filter((r) => r.status === "pending") ?? [];
  const hasReviews = !!record && record.reviewCount > 0;

  return (
    <>
      <TopBar />
      <main style={{ padding: "40px 24px 80px", maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <Avatar name={me.name ?? "?"} />
        <div>
          <h1 style={{ fontSize: 26 }}>{me.name}</h1>
          <p style={{ fontSize: 13, textTransform: "uppercase", letterSpacing: 1, marginTop: 2 }}>
            Developer record
          </p>
        </div>
      </div>

      {hasReviews && (
        <div
          style={{
            ...panelStyle,
            display: "flex",
            alignItems: "center",
            gap: 24,
            marginBottom: 32,
          }}
        >
          <ScoreGauge score={record!.avgVouchScore!} />
          <div>
            <p style={{ fontSize: 13, color: "var(--text-dim)" }}>Vouch Score</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", fontFamily: "Syne, system-ui, sans-serif" }}>
              {record!.avgVouchScore}/100
            </p>
            <p style={{ fontSize: 13, marginTop: 2 }}>
              across {record!.reviewCount} review{record!.reviewCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      )}

      <section style={{ marginBottom: 32 }}>
        <SectionHeader title="Requests" count={pending.length} />
        {pending.length === 0 ? (
          <EmptyState icon="📭" text="No pending requests." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pending.map((r) => (
              <div key={r._id} style={panelStyle}>
                <p style={{ marginBottom: 14, color: "var(--text)" }}>
                  <strong>{r.requestingCompany}</strong> wants to view your record.
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => approveRequest(r._id)} style={primaryButtonStyle}>
                    Approve
                  </button>
                  <button onClick={() => denyRequest(r._id)} style={secondaryButtonStyle}>
                    Deny
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <SectionHeader title="Your record" />
        {!hasReviews ? (
          <EmptyState icon="📄" text="No reviews yet. Ask a past employer to write one about you." />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {record!.reviews.map((r) => (
              <div key={r._id} style={panelStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 12 }}>
                  <div>
                    <h3 style={{ fontSize: 16, color: "var(--text)" }}>{r.title}</h3>
                    <p style={{ fontSize: 13, marginTop: 4 }}>
                      {r.companyName} &middot; {r.startDate} – {r.endDate ?? "present"}
                    </p>
                  </div>
                  <span style={scoreBadgeStyle}>{r.vouchScore}/100</span>
                </div>
                <p style={{ marginTop: 14, color: "var(--text)", lineHeight: 1.5 }}>{r.structuredSummary}</p>
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  {r.rehireable && <Tag label="Rehireable" />}
                  {r.goodStanding && <Tag label="Good standing" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
      </main>
    </>
  );

  function approveRequest(id: Id<"shareRequests">) {
    approve({ id });
  }

  function denyRequest(id: Id<"shareRequests">) {
    deny({ id });
  }
}

function CenteredMessage({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <main style={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: color ?? "var(--text-dim)" }}>{children}</p>
    </main>
  );
}

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
  return (
    <div
      style={{
        width: 52,
        height: 52,
        borderRadius: "50%",
        background: "rgba(110,231,183,0.15)",
        color: "var(--accent)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "Syne, system-ui, sans-serif",
        fontWeight: 700,
        fontSize: 18,
        flexShrink: 0,
      }}
    >
      {initials || "?"}
    </div>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 34;
  const offset = circumference * (1 - score / 100);
  return (
    <svg width="84" height="84" viewBox="0 0 84 84" style={{ flexShrink: 0 }}>
      <circle cx="42" cy="42" r="34" stroke="var(--border)" strokeWidth="7" fill="none" />
      <circle
        cx="42"
        cy="42"
        r="34"
        stroke="var(--accent)"
        strokeWidth="7"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 42 42)"
      />
      <text x="42" y="48" textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--text)">
        {score}
      </text>
    </svg>
  );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 14,
        paddingBottom: 10,
        borderBottom: "1px solid var(--border)",
      }}
    >
      <h2 style={{ fontSize: 15, textTransform: "uppercase", letterSpacing: 0.5, color: "var(--text-dim)" }}>
        {title}
      </h2>
      {!!count && <span style={badgeStyle}>{count}</span>}
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

function Tag({ label }: { label: string }) {
  return (
    <span
      style={{
        fontSize: 12,
        padding: "4px 10px",
        borderRadius: 999,
        background: "rgba(52,211,153,0.15)",
        color: "var(--accent-dim)",
        whiteSpace: "nowrap",
      }}
    >
      ✓ {label}
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

const primaryButtonStyle: React.CSSProperties = {
  padding: "8px 18px",
  borderRadius: 8,
  border: "none",
  background: "var(--accent)",
  color: "#06120c",
  fontWeight: 600,
  fontSize: 14,
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  background: "var(--bg-elevated)",
  color: "var(--text)",
  fontSize: 14,
};

const badgeStyle: React.CSSProperties = {
  fontSize: 12,
  padding: "2px 8px",
  borderRadius: 999,
  background: "var(--accent)",
  color: "#06120c",
  fontWeight: 700,
};

const scoreBadgeStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  padding: "4px 12px",
  borderRadius: 999,
  background: "rgba(110,231,183,0.12)",
  color: "var(--accent)",
  whiteSpace: "nowrap",
};

export default MyRecord;
