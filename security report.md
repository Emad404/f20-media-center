# Security Audit Findings

No fixes applied — this is the findings report only.

**Hard limitation up front:** there are no SQL migrations, `supabase/config.toml`, or generated database types checked into this repo, and there is no MCP/DB access to the live Supabase project. So **Section 2 (RLS coverage) cannot be directly verified** — policies can't be inspected from here. What can be done is show that the application code architecturally assumes RLS is doing all the enforcement, and point out exactly which policies need checking and why. Treat every "PASS (assuming RLS is correct)" below as conditional on that unverified layer.

---

## 1. Service-role key isolation — **PASS**

```
grep -rn "SUPABASE_SERVICE_ROLE_KEY" --include="*.tsx" --include="*.ts" .
```
Only 2 matches, both in server-only route handlers:
- `app/api/employees/invite/route.ts:46`
- `app/api/employees/delete/route.ts:38`

Both files are plain `route.ts` POST handlers (never `'use client'`), both instantiate the service-role client only after verifying `auth.getUser()` succeeded and the caller's `profiles.role` is in `['developer','ceo']`. Both carry an explicit `// SECURITY:` comment warning not to export it. No client component, no other route, and no bundled/browser code references the key. Not present anywhere in `git log` history search for `.env*` either (see §6).

---

## 2. RLS coverage — **UNVERIFIED (cannot inspect live policies)**

Tables referenced in code (from every `.from('...')` call in the app): `profiles`, `contacts`, `company_events`, `calendar_tasks`, `calendar_task_assignees`, `employee_requests`, `world_days`, `exhibitions`, `courses`, `weekly_reports`, `events`, `reports`, `hilal_matches`, `match_predictions`, `leaderboard` (view), plus the `avatars` storage bucket.

RLS-enabled/policy-present state cannot be confirmed for any of these from the repo. However, the **code pattern itself is a strong signal of risk** on the newer tables flagged for scrutiny:

- **`employee_requests`** (`app/[locale]/(dashboard)/employee-requests/page.tsx:109`) — every page load runs `supabase.from('employee_requests').select('*')` with **no filter at all**, for every logged-in user regardless of role. The split into "my requests" vs. "pending for review" happens entirely in JavaScript afterward (`page.tsx:149-156`). This table holds employee names, financial reimbursement amounts, and descriptions.
- **`weekly_reports`** (`weekly-reports/page.tsx:94`) — identical pattern: unfiltered `select('*')`, then client-side filtering by employee/week for display.
- Compare this to `predictions/page.tsx:168`, which correctly scopes the query server-side with `.eq('employee_id', profile.id)` — showing the team *does* know how to filter at the query level elsewhere, which makes the unfiltered `employee_requests`/`weekly_reports` fetches look like an oversight rather than a considered design.

**This is the single most important thing to verify before anything else.** If the SELECT policy on `employee_requests` or `weekly_reports` is `true` (or otherwise not scoped to `employee_id = auth.uid() OR role IN (reviewer roles)`), then every authenticated employee's browser is currently receiving every other employee's financial requests and weekly report text over the network — visible in browser dev tools regardless of what the UI renders. That would be a live data exposure, not a hypothetical.

Action needed: pull the actual RLS policies for these two tables (and ideally all of them) from the Supabase dashboard and confirm SELECT is scoped correctly.

---

## 3. Injection & raw query audit — **PASS**

- `grep -rn "\.rpc("` → zero matches anywhere in the codebase.
- No template-literal SQL, no string concatenation building queries anywhere.
- Checked every `.order(...)`, `.eq(...)`, `.filter(...)` call in `app/` — all column names are fixed string literals, never interpolated from user input.
- All search/filter UI (Employees, Contacts, Kingdom Events, Exhibitions, Weekly Reports, Reports) filters an already-fetched in-memory array using plain JS `.includes()`/`.filter()` — **it never reaches the database as a query at all**, so there is no server-side string-matching logic to be unsafe. (This has a data-exposure implication tied to §2 above, but zero injection risk.)
- All database writes use Supabase's builder methods with object payloads (`.insert({...})`, `.update({...})`) — never raw strings.

---

## 4. Auth & session handling — **PASS for the 2 API routes / FAIL-pattern (unverified) for everything else**

**The app has only two server API routes**: `app/api/employees/invite/route.ts` and `app/api/employees/delete/route.ts`. Both correctly verify session + role server-side before acting (`AUTHORIZED_ROLES = ['developer','ceo']`, checked against `profiles.role` after `auth.getUser()`). These are solid.

**Every other privileged action in the app — and there are many — bypasses server-side checking entirely and goes straight from the browser to Supabase.** This same pattern was confirmed across every dashboard page:

| Page | "Privileged" gate | Enforced by |
|---|---|---|
| `employee-requests` — approve/reject (`handleReview`, line 226) | `canReview` (UI-only) | RLS only |
| `weekly-reports` — add/edit/delete for any employee (`handleSave`, `handleDelete`) | `canManage` (UI-only) | RLS only |
| `employees` — edit **role** field (`handleSave`, line 210-223) | `canManage` (UI-only) | RLS only |
| `predictions` — create/edit/delete matches (`hilal_matches`) | `canManageMatches` (UI-only) | RLS only |
| `company-events`, `calendar`, `courses`, `exhibitions`, `events`, `world-days`, `reports`, `contacts` | `canManage`/`MANAGE_ROLES` (UI-only) | RLS only |

In every one of these, the role constant (e.g. `MANAGE_ROLES`, `REVIEW_ROLES`) only controls whether a button/modal renders. The actual `supabase.from(...).update()/.insert()/.delete()` call carries **no accompanying server-side or even client-side role re-check** — it's a bare mutation. Any authenticated user can call these same Supabase methods directly from the browser console (they already hold a valid session + anon key), so **this is precisely the "hiding a button client-side" pattern flagged for review** — except it's the norm here, not an isolated case.

**Highest-priority instance:** `employees/page.tsx:210-223` updates `profiles.role` directly from the client with no app-level check. If the `profiles` table's UPDATE RLS policy allows a user to modify their own row (plausible, since `profile/page.tsx` does legitimate self-service updates of `full_name`/`phone`) and that policy doesn't separately restrict the `role` column, **any employee could grant themselves `ceo` or `developer` via the browser console** — a full privilege escalation. This could not be verified from the repo. This needs to be checked first, before anything else in this report.

**Middleware (`proxy.ts`)** — **PASS** for its scope: unauthenticated requests to any path other than `/login`, `/set-password`, `/set-password/start` are redirected to `/login` (lines 25-29). The matcher (`config.matcher`, line 82-84) excludes only static assets/images, so it runs on all page and API routes, including the two `/api/employees/*` routes (which also do their own independent auth check, so no gap there). The `mustSetPassword` handling looks correctly reasoned (well-commented).

**Bottom line for §4:** the two API routes are solid. Everything else is a **"needs verification against live RLS" fail-pattern** — the app code provides zero defense in depth if RLS is misconfigured on any single table, and one specific path (self-editing `profiles.role`) is a plausible privilege-escalation vector that should be checked immediately.

---

## 5. Input validation & XSS — **PASS (rendering) / NEEDS VERIFICATION (uploads)**

- `grep -rn "dangerouslySetInnerHTML"` → **zero matches** anywhere in the codebase. All user text (report content, request descriptions, event fields, employee names, etc.) is rendered via normal JSX interpolation (`{value}`), which React escapes by default. No `eval`, no `innerHTML` assignment found either.
- **Profile photo upload** (`profile/page.tsx:77-120`):
  - Type check: `file.type.startsWith('image/')` (line 83) — this reads the browser-supplied MIME type, which is **client-controlled and spoofable** (rename a file, or craft a request directly to the Storage API bypassing the page entirely, since the anon key + session is enough to call `supabase.storage.from('avatars').upload()` directly).
  - Size check: `file.size > 2MB` (line 88) — same caveat, client-side only.
  - Filename: `${profile.id}/${Date.now()}-${file.name}` (line 95) — `file.name` is used unsanitized in the storage path. Supabase Storage generally normalizes keys, but what characters are permitted upstream could not be verified.
  - **Needs verification**: whether the `avatars` Storage bucket has server-side MIME-type/size restrictions configured (bucket policy or Supabase-side allowed MIME list). If not, a spoofed request could upload an arbitrary file type to a public bucket. This isn't "arbitrary execution" (Storage doesn't execute files), but it could allow uploading e.g. an HTML/SVG file that gets served with a browser-executable content type from the public bucket URL — worth confirming the bucket's configured `allowed_mime_types` and `file_size_limit`, since the app currently supplies neither at the API-call level (`upload(path, file)` — no options object at all).

---

## 6. Secrets & environment hygiene — **PASS**

- `.gitignore` ignores `.env*` (line 34) and redundantly `.env.local` (line 43).
- `git log --all --full-history -- .env.local` and the equivalent glob for any `.env*` file → **no output**, confirming no env file was ever committed, in any branch or history.
- Grepped for AWS/Google/generic private-key patterns (`sk_live`, `sk_test`, `AIza`, `AKIA`, `-----BEGIN`) → no matches.
- Grepped for JWT-shaped strings (`eyJ...`) in source → the only hit was inside `package-lock.json` (a dependency's own fixture/hash content, not a project secret).
- All Supabase credentials are read from `process.env` in `lib/supabase/{client,server,middleware}.ts` and the two API routes — never hardcoded.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` being embedded in the client bundle is expected/by-design (anon keys are meant to be public under RLS) — not a finding, just noting it's contingent on §2 being correct.

---

## 7. Rate limiting / abuse surface — **KNOWN GAP (flagged, not silently ignored)**

- No rate-limiting library or middleware exists anywhere in the project (`package.json` has no `@upstash/ratelimit`, no custom throttling; grep for `rate.?limit`/`ratelimit`/`upstash` returns nothing).
- Public-facing auth flows — login (`signInWithPassword`), forgot-password (`resetPasswordForEmail`), and the employee-invite endpoint (`/api/employees/invite`) — have **no application-level rate limiting or CAPTCHA**. They rely entirely on whatever throttling Supabase applies internally to `auth.*` calls.
- `employee_requests` submission (any authenticated user, via `handleSubmit` in `employee-requests/page.tsx`) similarly has no throttling beyond normal Supabase insert limits.
- This is a real gap for brute-force login attempts and email-enumeration/spam via forgot-password, bounded only by Supabase's own account-level limits (exact thresholds not controlled by this app). Flagging as a known gap rather than a pass.

---

## 8. Input field → database path audit — **PASS**, mechanism listed per field category

- **Login (highest priority):** `app/[locale]/login/page.tsx:29` — `supabase.auth.signInWithPassword({ email, password })`. Email/password state are plain React `useState` strings, passed as an object to Supabase's auth client. **Never concatenated, never touch a custom backend, no intermediate query logic.** Safe — parameterized by Supabase Auth's own client method.
- **Forgot password:** `page.tsx:50` — `supabase.auth.resetPasswordForEmail(resetEmail, {...})`. Same pattern. Safe.
- **Employee invite fields** (name, role, job title, department, phone, birthday): collected into a JSON body, POSTed to `/api/employees/invite`, then passed as an object to `serviceClient.from('profiles').insert({...})` (route.ts:59-71). Safe — Supabase parameterized `.insert()`.
- **Employee requests** (type, description, amount): `employee-requests/page.tsx:203-204` — `.update(payload)` / `.insert({...})` with a plain object. Safe — parameterized `.update()`/`.insert()`.
- **Weekly reports, reports, events, exhibitions, courses, world-days, company-events, calendar tasks, contacts, hilal_matches/predictions**: every write found across these pages follows the identical shape — build a plain object from form state, pass it to `.insert(payload)` or `.update(payload).eq('id', id)`. Safe — Supabase parameterized methods throughout. No exceptions found.
- **Search/filter inputs** (Employees `page.tsx:151-152`, Contacts `page.tsx:90-96`, Kingdom Events/company-events, exhibitions): all use `useState` + in-memory `Array.prototype.filter()`/`.includes()` against data already fetched to the client. **These never become a database query at all** — no `.ilike()`, `.like()`, `.textSearch()`, or `.rpc()` calls exist anywhere in the codebase (confirmed by grep). Safe from injection by construction, though see §2 for the separate concern about what gets fetched to the client in the first place.

No field anywhere in the app builds a raw query string, uses `.rpc()` with interpolated input, or passes data through custom backend query logic before reaching Supabase's client library.

---

## Summary

| # | Area | Verdict |
|---|---|---|
| 1 | Service-role key isolation | **PASS** |
| 2 | RLS coverage | **UNVERIFIED** — cannot inspect live policies; code pattern on `employee_requests`/`weekly_reports` suggests real risk |
| 3 | Injection / raw queries | **PASS** |
| 4 | Auth & session handling | **PASS** (2 API routes) / **UNVERIFIED, likely gap** (every other mutation relies solely on RLS; `profiles.role` self-edit is the highest-risk single path) |
| 5 | Input validation & XSS | **PASS** (rendering) / **NEEDS VERIFICATION** (storage bucket-level upload restrictions) |
| 6 | Secrets & env hygiene | **PASS** |
| 7 | Rate limiting | **GAP** — no app-level protection beyond Supabase defaults |
| 8 | Per-field SQL injection | **PASS** — mechanism confirmed for every field category, including login |

The two things to confirm before anything else: **(a)** the exact RLS policies on `profiles` (especially whether self-UPDATE can touch the `role` column) and **(b)** the SELECT policies on `employee_requests` and `weekly_reports`. Everything else in this report is either a clean pass or a scoped, known gap (rate limiting, upload MIME enforcement).
