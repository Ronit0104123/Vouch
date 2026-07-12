import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { useState, type FormEvent } from "react";
import { api } from "../convex/_generated/api";
import PageLoader from "./PageLoader";
import TopBar from "./TopBar";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL as string;

const RATING_LABELS: { key: keyof Ratings; label: string; hint: string }[] = [
  { key: "technical", label: "Technical Ability", hint: "Code quality, problem-solving, system/design depth" },
  { key: "ownership", label: "Ownership & Reliability", hint: "Delivers on commitments, owns outcomes, dependable" },
  { key: "collaboration", label: "Collaboration", hint: "Code reviews, mentoring, cross-team work" },
  { key: "delivery", label: "Delivery & Impact", hint: "Shipped real business value, not just activity" },
  { key: "communication", label: "Communication", hint: "Clarity, async writing, raises blockers early" },
  { key: "growth", label: "Growth Trajectory", hint: "Improved over tenure, learns fast" },
];

type Ratings = {
  technical: number;
  ownership: number;
  collaboration: number;
  delivery: number;
  communication: number;
  growth: number;
};

const DEFAULT_RATINGS: Ratings = {
  technical: 3,
  ownership: 3,
  collaboration: 3,
  delivery: 3,
  communication: 3,
  growth: 3,
};

function Review() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const createReview = useMutation(api.reviews.create);

  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [rehireable, setRehireable] = useState(true);
  const [goodStanding, setGoodStanding] = useState(true);
  const [comment, setComment] = useState("");
  const [ratings, setRatings] = useState<Ratings>(DEFAULT_RATINGS);
  const [useAI, setUseAI] = useState(true);

  const [status, setStatus] = useState<"idle" | "structuring" | "saving" | "done" | "error">("idle");
  const [error, setError] = useState("");
  const [resultLink, setResultLink] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    let finalRatings = ratings;
    let summary = "";
    let integrityFlag = false;

    try {
      if (useAI && comment.trim()) {
        setStatus("structuring");
        const res = await fetch(`${BACKEND_URL}/structure-review`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rawComment: comment }),
        });
        if (!res.ok) throw new Error("Hermes structuring failed");
        const structured = await res.json();
        finalRatings = structured.ratings;
        summary = structured.summary;
        integrityFlag = structured.integrityConcern;
        setRatings(finalRatings);
      } else {
        summary = comment.trim() || "No summary provided.";
      }

      setStatus("saving");
      await createReview({
        employeeEmail: employeeEmail.trim(),
        employeeName: employeeName.trim(),
        companyName: companyName.trim(),
        reviewerName: reviewerName.trim(),
        reviewerEmail: reviewerEmail.trim(),
        title: title.trim(),
        startDate,
        endDate: endDate || undefined,
        rehireable,
        goodStanding,
        ratings: finalRatings,
        rawComment: comment,
        structuredSummary: summary,
        integrityFlag,
        integrityNote: integrityFlag ? "Flagged by Hermes from free-text comment." : undefined,
      });

      setResultLink(`/r/${employeeEmail.trim()}`);
      setStatus("done");
    } catch {
      setError("Something went wrong. Try again.");
      setStatus("error");
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
            <a href="/login">Log in</a> with a company account to write a review.
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
            <a href="/start-trial">Start your subscription</a> to write reviews.
          </p>
        </main>
      </>
    );
  }

  if (status === "done") {
    return (
      <>
        <TopBar />
        <main style={{ padding: 24, textAlign: "center", display: "flex", flexDirection: "column", gap: 16, alignItems: "center", justifyContent: "center", minHeight: "calc(100% - 55px)" }}>
          <h1 style={{ fontSize: "28px" }}>Review saved.</h1>
          <p>The candidate's record has been updated.</p>
          <a href={resultLink} style={{ fontSize: "16px" }}>
            View record →
          </a>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <main style={{ padding: 24, maxWidth: 640, margin: "0 auto" }}>
      <h1 style={{ fontSize: "28px", marginBottom: 24 }}>Write a review</h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, textAlign: "left" }}>
        <Field label="Developer's email">
          <input required type="email" value={employeeEmail} onChange={(e) => setEmployeeEmail(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Developer's name">
          <input required value={employeeName} onChange={(e) => setEmployeeName(e.target.value)} style={inputStyle} />
        </Field>
        <Field label="Your company">
          <input required value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={inputStyle} />
        </Field>
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Your name">
            <input required value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="Your email">
            <input required type="email" value={reviewerEmail} onChange={(e) => setReviewerEmail(e.target.value)} style={inputStyle} />
          </Field>
        </div>
        <Field label="Developer's title">
          <input required value={title} onChange={(e) => setTitle(e.target.value)} style={inputStyle} />
        </Field>
        <div style={{ display: "flex", gap: 12 }}>
          <Field label="Start date">
            <input required type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle} />
          </Field>
          <Field label="End date (blank if current)">
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle} />
          </Field>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          <label style={checkboxLabel}>
            <input type="checkbox" checked={rehireable} onChange={(e) => setRehireable(e.target.checked)} /> Rehireable
          </label>
          <label style={checkboxLabel}>
            <input type="checkbox" checked={goodStanding} onChange={(e) => setGoodStanding(e.target.checked)} /> Left in good standing
          </label>
        </div>

        <label style={checkboxLabel}>
          <input type="checkbox" checked={useAI} onChange={(e) => setUseAI(e.target.checked)} /> Use Hermes to structure my comment into ratings
        </label>

        <Field label="Your comment about this developer">
          <textarea
            required
            rows={5}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            style={{ ...inputStyle, resize: "vertical" }}
            placeholder="Write freely — Hermes will turn this into structured ratings."
          />
        </Field>

        {!useAI && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {RATING_LABELS.map(({ key, label, hint }) => (
              <div key={key}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                  <span>{label}</span>
                  <span style={{ color: "var(--accent)" }}>{ratings[key]}</span>
                </div>
                <p style={{ fontSize: 12, marginBottom: 4 }}>{hint}</p>
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={ratings[key]}
                  onChange={(e) => setRatings((r) => ({ ...r, [key]: Number(e.target.value) }))}
                  style={{ width: "100%" }}
                />
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "structuring" || status === "saving"}
          style={{
            padding: "14px",
            borderRadius: 8,
            border: "none",
            background: "var(--accent)",
            color: "#06120c",
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          {status === "structuring" ? "Structuring with Hermes..." : status === "saving" ? "Saving..." : "Submit review"}
        </button>

        {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
      </form>
      </main>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1, fontSize: 14 }}>
      {label}
      {children}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "10px 14px",
  borderRadius: 8,
  border: "1px solid var(--border)",
  background: "var(--bg-elevated)",
  color: "var(--text)",
  fontSize: 15,
  outline: "none",
  fontFamily: "inherit",
};

const checkboxLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 14,
};

export default Review;
