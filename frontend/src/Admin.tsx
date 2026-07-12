import { useQuery, useConvexAuth } from "convex/react";
import { api } from "../convex/_generated/api";
import PageLoader from "./PageLoader";
import TopBar from "./TopBar";

function Admin() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const overview = useQuery(api.admin.overview, isAuthenticated ? {} : "skip");

  if (isLoading) return <PageLoader />;

  if (!isAuthenticated) {
    return (
      <>
        <TopBar />
        <main style={{ padding: 24, textAlign: "center" }}>
          <p>
            Not signed in. <a href="/login">Sign in</a>
          </p>
        </main>
      </>
    );
  }

  if (overview === undefined) return <PageLoader />;

  if (overview === null) {
    return (
      <>
        <TopBar />
        <main style={{ padding: 24, textAlign: "center" }}>
          <p style={{ color: "var(--danger)" }}>Not authorized as admin.</p>
        </main>
      </>
    );
  }

  const sections: [string, unknown[]][] = [
    ["users", overview.users],
    ["employees", overview.employees],
    ["reviews", overview.reviews],
    ["shareRequests", overview.shareRequests],
  ];

  return (
    <>
      <TopBar />
      <main style={{ padding: 24, maxWidth: 960, margin: "0 auto" }}>
      <h1 style={{ fontSize: "28px", marginBottom: 24 }}>Admin overview</h1>
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
    </>
  );
}

export default Admin;
