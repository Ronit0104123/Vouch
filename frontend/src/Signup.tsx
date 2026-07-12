import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "../convex/_generated/api";
import TopBar from "./TopBar";

type Role = "company" | "employee";

function getRoleFromQuery(): Role | null {
  const role = new URLSearchParams(window.location.search).get("role");
  return role === "company" || role === "employee" ? role : null;
}

function Signup() {
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");

  const [role, setRole] = useState<Role | null>(getRoleFromQuery());
  const [companyName, setCompanyName] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (me?.role === "company") window.location.href = "/start-trial";
    else if (me?.role === "employee") window.location.href = "/my-record";
  }, [me]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signIn("password", {
        email,
        password,
        flow: "signUp",
        role: role as string,
        companyName,
        name,
      });
    } catch {
      setError("Couldn't create account. Try a different email or a longer password.");
      setSubmitting(false);
    }
  }

  if (!role) {
    return (
      <>
        <TopBar />
        <main style={mainStyle}>
          <h1 style={{ fontSize: "28px" }}>Sign up as...</h1>
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={() => setRole("company")} style={choiceButtonStyle}>
              Company
            </button>
            <button onClick={() => setRole("employee")} style={choiceButtonStyle}>
              Developer
            </button>
          </div>
          <p style={{ fontSize: "14px" }}>
            Already have an account? <a href="/login">Log in</a>
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <main style={mainStyle}>
      <h1 style={{ fontSize: "28px" }}>{role === "company" ? "Company sign up" : "Developer sign up"}</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "10px", width: "100%", maxWidth: 320 }}>
        {role === "company" ? (
          <input
            required
            placeholder="Company name"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            style={inputStyle}
          />
        ) : (
          <input
            required
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
        )}
        <input
          required
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={inputStyle}
        />
        <div style={{ position: "relative" }}>
          <input
            required
            type={showPassword ? "text" : "password"}
            placeholder="password (min 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ ...inputStyle, paddingRight: 44, width: "100%" }}
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
        <button type="submit" disabled={submitting} style={submitButtonStyle}>
          {submitting ? "Creating account..." : "Sign up"}
        </button>
        {error && <p style={{ color: "var(--danger)", fontSize: "14px" }}>{error}</p>}
      </form>
      <p style={{ fontSize: "14px" }}>
        Already have an account? <a href="/login">Log in</a>
      </p>
      </main>
    </>
  );
}

const mainStyle: React.CSSProperties = {
  minHeight: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "24px",
  gap: "20px",
};

const inputStyle: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  background: "var(--bg-elevated)",
  color: "var(--text)",
  fontSize: "15px",
  outline: "none",
};

const submitButtonStyle: React.CSSProperties = {
  padding: "12px 22px",
  borderRadius: "8px",
  border: "none",
  background: "var(--accent)",
  color: "#06120c",
  fontWeight: 600,
  fontSize: "15px",
};

const choiceButtonStyle: React.CSSProperties = {
  padding: "14px 26px",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  background: "var(--bg-elevated)",
  color: "var(--text)",
  fontWeight: 600,
  fontSize: "15px",
  cursor: "pointer",
};

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

export default Signup;
