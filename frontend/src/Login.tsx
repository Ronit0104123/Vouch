import { useAuthActions } from "@convex-dev/auth/react";
import { useState, type FormEvent } from "react";

function Login() {
  const { signIn } = useAuthActions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await signIn("password", { email, password, flow: "signIn" });
      window.location.href = "/admin";
    } catch {
      setError("Invalid email or password.");
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
        <input
          type="password"
          required
          placeholder="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
    </main>
  );
}

export default Login;
