import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";

function TopBar() {
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 24px",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
        <VouchMark />
        <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: 15, color: "var(--text)" }}>
          Vouch
        </span>
      </a>
      {isAuthenticated && (
        <button
          onClick={() => signOut().then(() => (window.location.href = "/"))}
          style={secondaryButtonStyle}
        >
          Sign out
        </button>
      )}
    </div>
  );
}

function VouchMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none" aria-hidden="true">
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

const secondaryButtonStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  background: "var(--bg-elevated)",
  color: "var(--text)",
  fontSize: 14,
};

export default TopBar;
