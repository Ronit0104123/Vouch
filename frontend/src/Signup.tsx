import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth, useQuery } from "convex/react";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "../convex/_generated/api";

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
    );
  }

  return (
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
        <input
          required
          type="password"
          placeholder="password (min 8 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={inputStyle}
        />
        <button type="submit" disabled={submitting} style={submitButtonStyle}>
          {submitting ? "Creating account..." : "Sign up"}
        </button>
        {error && <p style={{ color: "var(--danger)", fontSize: "14px" }}>{error}</p>}
      </form>
      <p style={{ fontSize: "14px" }}>
        Already have an account? <a href="/login">Log in</a>
      </p>
    </main>
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

export default Signup;
