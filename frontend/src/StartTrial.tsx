import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../convex/_generated/api";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

function StartTrial() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
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

  async function handleStartTrial() {
    setError("");
    setStarting(true);
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
    <main
      style={{
        minHeight: "100%",
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
        {starting ? "Redirecting to checkout..." : "Start Trial"}
      </button>
      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
      <button onClick={() => signOut()} style={secondaryButtonStyle}>
        Sign out
      </button>
    </main>
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

const secondaryButtonStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  background: "var(--bg-elevated)",
  color: "var(--text)",
  fontSize: "14px",
};

export default StartTrial;
