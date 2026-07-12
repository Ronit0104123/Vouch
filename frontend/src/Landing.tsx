import { useMutation } from "convex/react";
import { useState, type FormEvent } from "react";
import { api } from "../convex/_generated/api";

function Landing() {
  const joinWaitlist = useMutation(api.waitlist.join);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("submitting");
    try {
      await joinWaitlist({ email: email.trim() });
      setStatus("done");
    } catch {
      setStatus("error");
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
        textAlign: "center",
        gap: "28px",
      }}
    >
      <div style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: "16px" }}>
        <h1 style={{ fontSize: "44px", lineHeight: 1.1 }}>
          A credit score for developers' work history.
        </h1>
        <p style={{ fontSize: "18px" }}>
          Past employers verify facts and rate performance. That record travels with the
          developer to their next job.
        </p>
      </div>

      {status === "done" ? (
        <p style={{ color: "var(--accent)", fontSize: "16px" }}>
          You're on the list. We'll be in touch.
        </p>
      ) : (
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", gap: "10px", width: "100%", maxWidth: 420 }}
        >
          <input
            type="email"
            required
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              flex: 1,
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
            disabled={status === "submitting"}
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
            {status === "submitting" ? "Joining..." : "Join waitlist"}
          </button>
        </form>
      )}

      {status === "error" && (
        <p style={{ color: "var(--danger)", fontSize: "14px" }}>
          Something went wrong. Try again.
        </p>
      )}
    </main>
  );
}

export default Landing;
