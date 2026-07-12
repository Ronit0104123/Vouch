import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import PageLoader from "./PageLoader";
import TopBar from "./TopBar";

function getEmailFromPath(): string {
  const parts = window.location.pathname.split("/").filter(Boolean); // ["r", "<email>"]
  return decodeURIComponent(parts[1] ?? "");
}

function getShareRequestIdFromQuery(): Id<"shareRequests"> | undefined {
  const params = new URLSearchParams(window.location.search);
  return (params.get("unlock") as Id<"shareRequests"> | null) ?? undefined;
}

function Record() {
  const employeeEmail = getEmailFromPath();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");

  const [shareRequestId, setShareRequestId] = useState(getShareRequestIdFromQuery());
  const data = useQuery(api.reviews.listByEmployee, { employeeEmail, shareRequestId });
  const shareRequest = useQuery(
    api.shareRequests.get,
    shareRequestId ? { id: shareRequestId } : "skip",
  );
  const requestUnlock = useMutation(api.shareRequests.request);

  const [requesting, setRequesting] = useState(false);
  const [actionError, setActionError] = useState("");

  async function handleRequestAccess() {
    setActionError("");
    setRequesting(true);
    try {
      const id = await requestUnlock({ employeeEmail });
      setShareRequestId(id);
      const url = new URL(window.location.href);
      url.searchParams.set("unlock", id);
      window.history.replaceState(null, "", url.toString());
    } catch {
      setActionError("Couldn't send request. Try again.");
    } finally {
      setRequesting(false);
    }
  }

  if (isLoading || (isAuthenticated && me === undefined)) {
    return <PageLoader />;
  }

  if (!isAuthenticated || me?.role !== "company") {
    return (
      <>
        <TopBar />
        <main style={{ padding: 24, textAlign: "center" }}>
          <p>
            <a href="/login">Log in</a> with a company account to view records.
          </p>
        </main>
      </>
    );
  }

  if (me.subscriptionStatus !== "active") {
    return (
      <>
        <TopBar />
        <main style={{ padding: 24, textAlign: "center" }}>
          <p>
            <a href="/start-trial">Start your subscription</a> to view records.
          </p>
        </main>
      </>
    );
  }

  if (data === undefined) return <PageLoader />;

  if (data === null) {
    return (
      <>
        <TopBar />
        <main style={{ padding: 24, textAlign: "center" }}>
          <p>No record found for {employeeEmail}.</p>
        </main>
      </>
    );
  }

  const { employee, avgVouchScore, reviewCount, unlocked, reviews } = data;

  return (
    <>
      <TopBar />
      <main style={{ padding: 24, maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginBottom: 32 }}>
        <ScoreGauge score={avgVouchScore} />
        <div style={{ textAlign: "left" }}>
          <h1 style={{ fontSize: "28px" }}>{employee.name}</h1>
          <p>{employee.email}</p>
          <p style={{ fontSize: 13, marginTop: 4 }}>
            {reviewCount} verified review{reviewCount === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {reviews.map((r) => (
          <div
            key={r._id}
            style={{
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 20,
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
              <div>
                <h2 style={{ fontSize: 18 }}>{r.title}</h2>
                <p>
                  {r.companyName} &middot; {r.startDate} – {r.endDate ?? "present"}
                </p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <Badge ok={r.rehireable} label="Rehireable" />
                <Badge ok={r.goodStanding} label="Good standing" />
                {r.integrityFlag && <AmberBadge label="Integrity flag" />}
              </div>
            </div>

            <div style={{ marginTop: 12 }}>
              <span style={{ fontSize: 13, color: "var(--text-dim)" }}>Vouch Score: </span>
              <span style={{ fontWeight: 600 }}>{r.vouchScore}/100</span>
            </div>

            <div style={{ marginTop: 12, filter: unlocked ? "none" : "blur(6px)", userSelect: unlocked ? "auto" : "none" }}>
              {unlocked ? (
                <>
                  <p style={{ marginBottom: 8 }}>{r.structuredSummary}</p>
                  <RatingsGrid ratings={r.ratings!} />
                </>
              ) : (
                <>
                  <p style={{ marginBottom: 8 }}>
                    This is a placeholder summary that reads like real content so the blur effect looks
                    convincing to a viewer who has not unlocked this record yet.
                  </p>
                  <RatingsGrid ratings={{ technical: 4, ownership: 4, collaboration: 4, delivery: 4, communication: 4, growth: 4 }} />
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {!unlocked && (
        <div
          style={{
            marginTop: 32,
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: 24,
            textAlign: "left",
          }}
        >
          <h2 style={{ fontSize: 18, marginBottom: 4 }}>Unlock full record</h2>
          <p style={{ marginBottom: 16 }}>See detailed ratings and Hermes-structured summaries for every review.</p>

          {!shareRequestId ? (
            <button onClick={handleRequestAccess} disabled={requesting} style={unlockButtonStyle}>
              {requesting ? "Sending request..." : "Request Access"}
            </button>
          ) : !shareRequest ? (
            <p style={{ fontSize: 14 }}>Loading...</p>
          ) : shareRequest.status === "denied" ? (
            <p style={{ fontSize: 14, color: "var(--danger)" }}>{employee.name} denied this request.</p>
          ) : (
            <p style={{ fontSize: 14 }}>Request sent. Waiting for {employee.name} to approve.</p>
          )}

          {actionError && <p style={{ color: "var(--danger)", marginTop: 8 }}>{actionError}</p>}
        </div>
      )}
      </main>
    </>
  );
}

function ScoreGauge({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 42;
  const offset = circumference * (1 - score / 100);
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="42" stroke="var(--border)" strokeWidth="8" fill="none" />
      <circle
        cx="50"
        cy="50"
        r="42"
        stroke="var(--accent)"
        strokeWidth="8"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 50 50)"
      />
      <text x="50" y="56" textAnchor="middle" fontSize="24" fontWeight="700" fill="var(--text)">
        {score}
      </text>
    </svg>
  );
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      style={{
        fontSize: 12,
        padding: "4px 10px",
        borderRadius: 999,
        background: ok ? "rgba(52,211,153,0.15)" : "rgba(243,108,108,0.15)",
        color: ok ? "var(--accent-dim)" : "var(--danger)",
        whiteSpace: "nowrap",
      }}
    >
      {ok ? "✓" : "✕"} {label}
    </span>
  );
}

function AmberBadge({ label }: { label: string }) {
  return (
    <span
      style={{
        fontSize: 12,
        padding: "4px 10px",
        borderRadius: 999,
        background: "rgba(245,185,66,0.15)",
        color: "var(--amber)",
        whiteSpace: "nowrap",
      }}
    >
      ⚠ {label}
    </span>
  );
}

function RatingsGrid({ ratings }: { ratings: Record<string, number> }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
      {Object.entries(ratings).map(([key, value]) => (
        <div key={key} style={{ display: "flex", justifyContent: "space-between" }}>
          <span style={{ textTransform: "capitalize" }}>{key}</span>
          <span>{value}/5</span>
        </div>
      ))}
    </div>
  );
}

const unlockButtonStyle: React.CSSProperties = {
  padding: "12px 22px",
  borderRadius: 8,
  border: "none",
  background: "var(--accent)",
  color: "#06120c",
  fontWeight: 600,
  fontSize: 15,
};

export default Record;
