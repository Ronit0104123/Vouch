import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "../convex/_generated/api";

function Dashboard() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const [lookupEmail, setLookupEmail] = useState("");

  useEffect(() => {
    if (me?.role === "company" && me.subscriptionStatus !== "active") {
      window.location.href = "/start-trial";
    }
  }, [me]);

  if (isLoading || (isAuthenticated && me === undefined)) {
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

  if (!me || me.role !== "company") {
    return (
      <main style={{ padding: 24, textAlign: "center" }}>
        <p style={{ color: "var(--danger)" }}>This page is for company accounts.</p>
      </main>
    );
  }

  if (me.subscriptionStatus !== "active") {
    return <p style={{ padding: 24 }}>Redirecting to start your trial...</p>;
  }

  function handleLookup(e: FormEvent) {
    e.preventDefault();
    if (lookupEmail.trim()) {
      window.location.href = `/r/${encodeURIComponent(lookupEmail.trim())}`;
    }
  }

  return (
    <main style={{ padding: 24, maxWidth: 640, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: "28px" }}>{me.companyName}</h1>
          <p style={{ fontSize: 13, marginTop: 4, color: "var(--accent)" }}>Subscription: active</p>
        </div>
        <button onClick={() => signOut()} style={secondaryButtonStyle}>
          Sign out
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <a href="/review" style={cardLinkStyle}>
          <h2 style={{ fontSize: 18, marginBottom: 4 }}>Write a Review</h2>
          <p>Leave a verified performance review for a past employee.</p>
        </a>

        <div style={cardStyle}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>Look up a Record</h2>
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
    </main>
  );
}

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: 12,
  padding: 24,
  textAlign: "left",
};

const cardLinkStyle: React.CSSProperties = {
  ...cardStyle,
  color: "var(--text)",
  textDecoration: "none",
  display: "block",
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--bg-elevated)",
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

const secondaryButtonStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  background: "var(--bg-elevated)",
  color: "var(--text)",
};

export default Dashboard;
