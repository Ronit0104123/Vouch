import { useQuery, useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { api } from "../convex/_generated/api";

function Admin() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const overview = useQuery(api.admin.overview, isAuthenticated ? {} : "skip");

  if (isLoading) return <p style={{ padding: 24 }}>Loading...</p>;

  if (!isAuthenticated) {
    return (
      <main style={{ padding: 24, textAlign: "center" }}>
        <p>
          Not signed in. <a href="/login">Sign in</a>
        </p>
      </main>
    );
  }

  if (overview === undefined) return <p style={{ padding: 24 }}>Loading data...</p>;

  if (overview === null) {
    return (
      <main style={{ padding: 24, textAlign: "center" }}>
        <p style={{ color: "var(--danger)" }}>Not authorized as admin.</p>
      </main>
    );
  }

  const sections: [string, unknown[]][] = [
    ["waitlist", overview.waitlist],
    ["employees", overview.employees],
    ["reviews", overview.reviews],
    ["shareRequests", overview.shareRequests],
  ];

  return (
    <main style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: "28px" }}>Admin overview</h1>
        <button
          onClick={() => signOut()}
          style={{
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--bg-elevated)",
            color: "var(--text)",
          }}
        >
          Sign out
        </button>
      </div>
      {sections.map(([name, rows]) => (
        <section key={name} style={{ marginBottom: 28, textAlign: "left" }}>
          <h2 style={{ fontSize: "18px", marginBottom: 8 }}>
            {name} ({rows.length})
          </h2>
          <pre
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              padding: 16,
              overflowX: "auto",
              fontSize: 13,
              color: "var(--text-dim)",
            }}
          >
            {JSON.stringify(rows, null, 2)}
          </pre>
        </section>
      ))}
    </main>
  );
}

export default Admin;
