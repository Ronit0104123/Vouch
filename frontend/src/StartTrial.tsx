import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../convex/_generated/api";
import PageLoader from "./PageLoader";
import TopBar from "./TopBar";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

// Temporary: skip the real Dodo checkout so company accounts aren't blocked
// by payment setup while we focus on the rest of the platform. The Dodo
// flow below (backend /subscribe + checkout redirect) is left intact —
// flip this back to false to re-enable it.
const BYPASS_PAYMENT = true;

function StartTrial() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const startFreeTrial = useMutation(api.users.startFreeTrial);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!me) return;
    if (me.role === "employee") window.location.href = "/my-record";
    else if (me.role === "company" && me.subscriptionStatus === "active") {
      window.location.href = "/dashboard";
    }
  }, [me]);

  if (isLoading || (isAuthenticated && me === undefined)) {
    return <PageLoader />;
  }

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

  if (!me || me.role !== "company") {
    return (
      <>
        <TopBar />
        <main style={{ padding: 24, textAlign: "center" }}>
          <p style={{ color: "var(--danger)" }}>This page is for company accounts.</p>
        </main>
      </>
    );
  }

  async function handleStartTrial() {
    setError("");
    setStarting(true);

    if (BYPASS_PAYMENT) {
      try {
        await startFreeTrial({});
        window.location.href = "/dashboard";
      } catch {
        setError("Couldn't start trial. Try again.");
        setStarting(false);
      }
      return;
    }

    try {
      const res = await fetch(`${BACKEND_URL}/subscribe`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: me!._id,
          email: me!.email,
          companyName: me!.companyName,
        }),
      });
      if (!res.ok) throw new Error("subscribe failed");
      const { checkoutUrl } = await res.json();
      window.location.href = checkoutUrl;
    } catch {
      setError("Couldn't start checkout. Try again.");
      setStarting(false);
    }
  }

  return (
    <>
      <TopBar />
      <main
        style={{
          minHeight: "calc(100% - 55px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          gap: 20,
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 28 }}>Start your 7-day free trial.</h1>
        <p style={{ fontSize: 16 }}>$49/month after. Cancel anytime.</p>
        <button onClick={handleStartTrial} disabled={starting} style={primaryButtonStyle}>
          {starting ? (BYPASS_PAYMENT ? "Starting trial..." : "Redirecting to checkout...") : "Start Trial"}
        </button>
        {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
      </main>
    </>
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
};

export default StartTrial;
