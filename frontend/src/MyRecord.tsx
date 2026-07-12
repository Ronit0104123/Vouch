import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

function MyRecord() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const record = useQuery(api.reviews.myRecord, isAuthenticated ? {} : "skip");
  const requestsData = useQuery(api.shareRequests.listForEmployee, isAuthenticated ? {} : "skip");
  const approve = useMutation(api.shareRequests.approve);
  const deny = useMutation(api.shareRequests.deny);

  if (isLoading || (isAuthenticated && (me === undefined || record === undefined || requestsData === undefined))) {
    return <p style={{ padding: 24 }}>Loading...</p>;
  }

  if (!isAuthenticated) {
    return (
      <main style={{ padding: 24, textAlign: "center" }}>
        <p>
          Not signed in. <a href="/login">Sign in</a>
        </p>
      </main>
    );
  }

  if (!me || me.role !== "employee") {
    return (
      <main style={{ padding: 24, textAlign: "center" }}>
        <p style={{ color: "var(--danger)" }}>This page is for developer accounts.</p>
      </main>
    );
  }

  const pending = requestsData?.requests.filter((r) => r.status === "pending") ?? [];

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: "28px" }}>{me.name}</h1>
        <button onClick={() => signOut()} style={secondaryButtonStyle}>
          Sign out
        </button>
      </div>

      <section style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 18, display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          Requests
          {pending.length > 0 && <span style={badgeStyle}>{pending.length}</span>}
        </h2>
        {pending.length === 0 ? (
          <p style={{ fontSize: 14 }}>No pending requests.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pending.map((r) => (
              <div key={r._id} style={cardStyle}>
                <p style={{ marginBottom: 12 }}>
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
        <h2 style={{ fontSize: 18, marginBottom: 12 }}>Your record</h2>
        {!record || record.reviewCount === 0 ? (
          <p style={{ fontSize: 14 }}>No reviews yet. Ask a past employer to write one about you.</p>
        ) : (
          <>
            <p style={{ marginBottom: 16 }}>
              Vouch Score: <strong>{record.avgVouchScore}/100</strong> across {record.reviewCount} review
              {record.reviewCount === 1 ? "" : "s"}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {record.reviews.map((r) => (
                <div key={r._id} style={cardStyle}>
                  <h3 style={{ fontSize: 16 }}>
                    {r.title} &middot; {r.companyName}
                  </h3>
                  <p style={{ fontSize: 13, marginTop: 4 }}>
                    {r.startDate} – {r.endDate ?? "present"}
                  </p>
                  <p style={{ marginTop: 12 }}>{r.structuredSummary}</p>
                  <p style={{ marginTop: 12, fontWeight: 600 }}>Vouch Score: {r.vouchScore}/100</p>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );

  function approveRequest(id: Id<"shareRequests">) {
    approve({ id });
  }

  function denyRequest(id: Id<"shareRequests">) {
    deny({ id });
  }
}

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 20,
  textAlign: "left",
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

export default MyRecord;
