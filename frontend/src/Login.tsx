import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "../convex/_generated/api";
import TopBar from "./TopBar";

function Login() {
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!me) return;
    if (me.role === "company") {
      window.location.href = me.subscriptionStatus === "active" ? "/dashboard" : "/start-trial";
    } else if (me.role === "employee") window.location.href = "/my-record";
    else window.location.href = "/admin";
  }, [me]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await signIn("password", { email, password, flow: "signIn" });
    } catch {
      setError("Invalid email or password.");
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
          padding: "24px",
          gap: "20px",
        }}
      >
      <h1 style={{ fontSize: "28px" }}>Sign in</h1>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: 320 }}
      >
        <input
          type="email"
          required
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            padding: "12px 16px",
            borderRadius: "8px",
            border: "1px solid var(--border)",
            background: "var(--bg-elevated)",
            color: "var(--text)",
            fontSize: "15px",
            outline: "none",
          }}
        />
        <div style={{ position: "relative" }}>
          <input
            type={showPassword ? "text" : "password"}
            required
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              padding: "12px 44px 12px 16px",
              borderRadius: "8px",
              border: "1px solid var(--border)",
              background: "var(--bg-elevated)",
              color: "var(--text)",
              fontSize: "15px",
              outline: "none",
              width: "100%",
            }}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            style={eyeButtonStyle}
          >
            <EyeIcon off={showPassword} />
          </button>
        </div>
        <button
          type="submit"
          style={{
            padding: "12px 22px",
            borderRadius: "8px",
            border: "none",
            background: "var(--accent)",
            color: "#06120c",
            fontWeight: 600,
            fontSize: "15px",
          }}
        >
          Sign in
        </button>
      </form>
        {error && <p style={{ color: "var(--danger)", fontSize: "14px" }}>{error}</p>}
        <p style={{ fontSize: "14px" }}>
          Don't have an account? <a href="/signup">Sign up</a>
        </p>
      </main>
    </>
  );
}

function EyeIcon({ off }: { off: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {off ? (
        <>
          <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-7 0-11-8-11-8a20.3 20.3 0 0 1 5.06-5.94M9.9 4.24A10.94 10.94 0 0 1 12 4c7 0 11 8 11 8a20.3 20.3 0 0 1-2.16 3.19M14.12 14.12a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      ) : (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
          <circle cx="12" cy="12" r="3" />
        </>
      )}
    </svg>
  );
}

const eyeButtonStyle: React.CSSProperties = {
  position: "absolute",
  right: 12,
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  padding: 0,
  color: "var(--text-dim)",
  display: "flex",
  alignItems: "center",
};

export default Login;
