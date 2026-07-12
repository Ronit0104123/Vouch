# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Vouch — a credit score for developers' work history. Past employers verify facts and rate a developer's performance; that record travels with the developer to their next job. Built for a hackathon (Hermes Buildathon, Revenue track).

**Business model:** writing a review is free (it's the data supply). Viewing a candidate's basic facts is free (teaser). Unlocking full ratings + summary is paid by the hiring company (per-unlock via Dodo Payments). Vision: per-unlock today, company subscription later.

## Repo layout

Two independent apps, no shared package/monorepo tooling:
- `backend/` — FastAPI (Python), meant to own the Hermes integration (structuring free-text reviews into JSON) and any Dodo webhook handling.
- `frontend/` — React + Vite + TypeScript. Owns Convex (database, schema, auth) directly from the client/Convex functions — the backend does not currently talk to Convex.

There is no root-level package.json — always `cd` into `backend/` or `frontend/` before running commands.

## Commands

### Frontend (`frontend/`)
- `npm run dev` — Vite dev server at http://localhost:5173
- `npm run build` — `tsc -b && vite build`
- `npm run lint` — oxlint (config: `.oxlintrc.json`, plugins: react/typescript/oxc)
- `npm run preview` — preview a production build
- `npx convex dev` — starts the Convex dev watcher (local backend, no cloud login required — see Convex section below). Must be running for any Convex function changes to take effect and for the app to work at all.
- `npx convex run <module>:<function> '<json-args>'` — invoke a Convex query/mutation/action directly from the CLI. Add `--identity '{"email":"..."}'` to simulate an authenticated user (useful for testing auth-gated functions without a browser).
- `npx convex data <table>` — dump a table's rows from the CLI.
- `npx convex dashboard` — opens the local Convex dashboard UI.

### Backend (`backend/`)
- `python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt` — first-time setup
- `source venv/bin/activate && uvicorn main:app --reload --port 8000` — run dev server at http://localhost:8000
- No test suite or linter configured yet.

## Architecture

### Convex is the database and auth provider; FastAPI is currently unused by the frontend

The frontend talks to Convex directly via `convex/react` hooks (`useQuery`/`useMutation`) — there is no REST call from frontend to backend yet. The FastAPI backend (`backend/main.py`) currently only exposes `/health` and exists to host the Hermes call (free-text review → structured JSON) and Dodo integration per the original plan; neither is wired up yet. When building those, the backend will need its own way to write results into Convex (e.g. via `CONVEX_URL` + an HTTP action, or the frontend calls Convex directly after getting structured JSON back from the backend — not yet decided).

### Convex deployment is local/anonymous, not cloud

`npx convex dev` was run without `npx convex login`, so this project uses Convex's **local deployment** mode (a local binary on port 3210, HTTP actions on 3211) rather than a cloud project. Config lives in `frontend/.env.local` (gitignored) as `CONVEX_DEPLOYMENT=anonymous:anonymous-frontend`, `VITE_CONVEX_URL`, `VITE_CONVEX_SITE_URL`. Convex Auth secrets (`SITE_URL`, `JWT_PRIVATE_KEY`, `JWKS`) are stored as Convex env vars (via `npx convex env set`), not in any `.env` file. Before the actual demo/deploy, this needs `npx convex login` + linking a real cloud project — the plan requires screenshotting the Convex dashboard as judge evidence, which the anonymous local deployment can't provide remotely.

### Schema (`frontend/convex/schema.ts`)

Four app tables, plus `...authTables` spread in from `@convex-dev/auth/server`:
- `employees` — `{ name, email, role, createdAt }`, indexed `by_email`
- `reviews` — one row per employer review of an employee: objective facts (`companyName`, `title`, `startDate`/`endDate`, `rehireable`, `goodStanding`), the 6 subjective `ratings` (`technical`, `ownership`, `collaboration`, `delivery`, `communication`, `growth` — each 1-5), `rawComment` (employer's free text) + `structuredSummary` (Hermes output), `integrityFlag`/`integrityNote`, computed `vouchScore`, `verified`. Indexed `by_employeeEmail`.
- `shareRequests` — a hiring company's request to unlock a candidate's full record: `{ employeeEmail, requestingCompany, status: "pending"|"approved"|"denied", paid, createdAt }`. Indexed `by_employeeEmail`.
- `waitlist` — `{ email, createdAt }`, indexed `by_email`. Currently the only table with a working write path (`convex/waitlist.ts` → `join` mutation, called from the landing page).

None of `employees`, `reviews`, or `shareRequests` have mutations yet — schema only, no write path built.

### Vouch Score formula (not yet implemented in code)

```python
WEIGHTS = {"technical":0.20,"ownership":0.20,"collaboration":0.15,
           "delivery":0.15,"communication":0.12,"growth":0.08}
def vouch_score(r):               # r = {param: 1-5}
    tw = sum(WEIGHTS.values())    # 0.90
    return round(sum(r[k]*WEIGHTS[k] for k in WEIGHTS)/tw*20)  # 0-100
```
Multiple reviews for the same employee → displayed score is the average of each review's `vouchScore`. This belongs wherever a review is saved (planned: after Hermes structures the free-text comment into ratings).

### Auth: Convex Auth, Password provider

`frontend/convex/auth.ts` wires `convexAuth({ providers: [Password] })` — note the import is a **named** export (`import { Password } from "@convex-dev/auth/providers/Password"`), not default, despite what that package's own docstring examples show (checked against the installed version, 0.0.94). Password provider enforces an 8-character minimum by default.

`frontend/src/main.tsx` wraps the app in `ConvexAuthProvider`. Routing is a hand-rolled path check in `App.tsx` (`window.location.pathname`) — no router library is installed; there are only three views (`Landing`, `Login`, `Admin`).

### Admin access model

`frontend/convex/lib/admin.ts` defines `ADMIN_EMAILS` (currently just `admin@gmail.com`) and two helpers:
- `isAdmin(ctx)` — non-throwing, returns boolean. Used in queries that should degrade gracefully (return `null`) for non-admins so the client can render an "unauthorized" state instead of crashing on a thrown error.
- `requireAdmin(ctx)` — throws if not admin. Intended for future mutations where a hard failure is correct.

`frontend/convex/admin.ts` (`overview` query) is the only consumer so far: returns unfiltered rows from all four tables, or `null` if the caller isn't in `ADMIN_EMAILS`. Seeded admin account: `admin@gmail.com` / `admin1234` (created via `npx convex run auth:signIn '{"provider":"password","params":{"email":"admin@gmail.com","password":"admin1234","flow":"signUp"}}'`, not through the UI — there's no self-serve signup flow built yet, only sign-in in `Login.tsx`).

### Theming

Dark theme only, CSS custom properties in `frontend/src/index.css` (`--bg`, `--bg-elevated`, `--border`, `--text`, `--text-dim`, `--accent`, `--amber`, `--danger`). Headings use Syne, body text uses Inter — both loaded via Google Fonts `<link>` tags in `index.html` (no local font files, no `next/font`-style bundling). Styling elsewhere is inline `style={}` objects, not CSS modules or a utility framework — no Tailwind/styled-components installed.

## Planned but not built (see conversation/plan history, not in-repo)

- `/review` — employer review form; free-text comment gets sent to Hermes (local `hermes gateway`) with a fixed prompt to extract `{ratings, summary, integrityConcern}` JSON, which the backend parses, scores, and saves to Convex. Fallback if Hermes integration is troublesome: take slider values directly, use Hermes only for the summary sentence.
- `/r/{email}` — candidate record page: facts + Vouch Score + rehireable badge always visible; ratings/summary blurred until unlocked.
- Dodo Payments checkout for the unlock flow (`shareRequests.paid = true` on success).
- Cloudflare Pages hosting for the frontend, Railway/Render for the FastAPI backend.
