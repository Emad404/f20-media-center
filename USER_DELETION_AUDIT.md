# User Deletion / Soft-Delete / Snapshot — Read-Only Audit

**Date:** 2026-09-20/21
**Scope:** Read-only diagnostic only. No code was changed and no SQL that modifies data or schema was run. All database access used `SELECT`-only queries or read-only REST `GET` calls with the service-role key.
**Goal:** Establish the full, evidence-based picture of how employee deletion currently works — code paths, database constraints, and auth-sync behavior — before deciding between soft-delete, a snapshot approach, or something else.

---

## 1. Delete-user flow (frontend + backend)

There is **exactly one** delete path in the codebase. No scripts, no server actions, no other route delete users.

### Backend: `app/api/employees/delete/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const AUTHORIZED_ROLES = ['developer', 'ceo', 'project_manager']

export async function POST(request: NextRequest) {
  const { id } = await request.json()

  if (!id) {
    return NextResponse.json({ error: 'Missing employee id' }, { status: 400 })
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  if (user.id === id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!callerProfile || !AUTHORIZED_ROLES.includes(callerProfile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // SECURITY: service_role client — must never leave this file. Do not export, do not import into any 'use client' component or any other route.
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Delete the profile row first: if this fails, nothing irreversible has happened yet
  // (the auth account is untouched). Deleting the auth account first would risk an
  // unrecoverable state if the profile delete failed afterward.
  const { error: profileError } = await serviceClient.from('profiles').delete().eq('id', id)
  if (profileError) {
    console.error('Employee profile deletion failed:', { userId: id, success: false })
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  const { error: authError } = await serviceClient.auth.admin.deleteUser(id)
  if (authError) {
    console.error('Employee auth deletion failed:', { userId: id, success: false })
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  console.log('Employee deleted:', { userId: id, success: true })
  return NextResponse.json({ success: true })
}
```

**Guards, in order:**
- `id` required (line 10)
- caller must be authenticated (line 17)
- **self-delete blocked** (line 21 — `user.id === id`)
- caller's `profiles.role` must be one of `['developer', 'ceo', 'project_manager']` (line 5, line 31)

**Delete sequence:** `profiles` row deleted first (line 44), then `auth.admin.deleteUser(id)` (line 50) — deliberately ordered so a failed `profiles` delete leaves the auth account untouched (per the code comment).

**Two important consequences of this ordering, confirmed later in the audit:**
1. If the `profiles` delete fails (see §3 — four tables currently make this fail for any employee with real activity), the auth account survives untouched. Clean abort, no orphan.
2. If the `profiles` delete succeeds but the subsequent `auth.admin.deleteUser` call fails, you'd be left with an auth account with no profile row. At the time of this audit, **zero such orphans exist** (see §4 empirical check).

### Frontend caller: `app/[locale]/(dashboard)/employees/page.tsx:276-295`

```ts
const handleDelete = async (emp: EmployeeProfile) => {
  if (!window.confirm(t('deleteConfirm', { name: displayName(emp) }))) return
  try {
    const res = await fetch('/api/employees/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: emp.id }),
    })
    const json = await res.json()
    if (!res.ok) {
      window.alert(json.error || t('saveError'))
      return
    }
    if (selectedEmployee?.id === emp.id) setSelectedEmployee(null)
    await fetchEmployees()
    flashSuccess(t('deleteSuccess'))
  } catch {
    window.alert(t('saveError'))
  }
}
```

A `window.confirm`, then `POST /api/employees/delete` with `{ id: emp.id }`. On failure, the raw error string from the backend (which can be a raw Postgres error message — see §3) is shown via `window.alert`.

### Repo-wide search confirmation

An unscoped `grep -rn "deleteUser|auth.admin|service_role|SERVICE_ROLE"` across the whole repo (including `node_modules` and `.next` build output) was also run in the background as a second check. Excluding `node_modules`/`.next` noise (minified Supabase realtime client code, unrelated), it surfaced nothing beyond the two files above. **Confirmed: `app/api/employees/delete/route.ts` is the only delete-user path in the codebase.**

---

## 2. Re-add / signup flow

### Backend: `app/api/employees/invite/route.ts`

```ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'

const AUTHORIZED_ROLES = ['developer', 'ceo', 'project_manager']

export async function POST(request: NextRequest) {
  const body = await request.json()
  const {
    email,
    full_name_ar,
    full_name_en,
    role,
    job_title_ar,
    job_title_en,
    department_ar,
    department_en,
    phone,
    birthday,
  } = body

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data: callerProfile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!callerProfile || !AUTHORIZED_ROLES.includes(callerProfile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!email || !full_name_ar || !role) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // SECURITY: service_role client — must never leave this file. Do not export, do not import into any 'use client' component or any other route.
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: inviteData, error: inviteError } = await serviceClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin}/set-password`,
    data: { password_set: false },
  })

  if (inviteError || !inviteData?.user) {
    console.error('Employee invite failed:', { success: false })
    return NextResponse.json({ error: inviteError?.message || 'Failed to invite user' }, { status: 500 })
  }

  const { error: profileError } = await serviceClient.from('profiles').insert({
    id: inviteData.user.id,
    email,
    full_name_ar,
    full_name_en: full_name_en || null,
    role,
    job_title_ar: job_title_ar || null,
    job_title_en: job_title_en || null,
    department_ar: department_ar || null,
    department_en: department_en || null,
    phone: phone || null,
    birthday: birthday || null,
  })

  if (profileError) {
    console.error('Employee profile insert failed:', { userId: inviteData.user.id, success: false })
    // Roll back the orphaned auth user so a failed invite doesn't leave a dangling account.
    await serviceClient.auth.admin.deleteUser(inviteData.user.id)
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  console.log('Employee invited:', { userId: inviteData.user.id, success: true })
  return NextResponse.json({ success: true, id: inviteData.user.id })
}
```

**No pre-check for an existing/orphaned profile or auth user by email.** There is no `listUsers`, no `getUserByEmail`, no `SELECT ... FROM profiles WHERE email = ...` anywhere in this route. It calls `inviteUserByEmail` unconditionally every time and relies on Supabase Auth to reject a duplicate email (and separately, `profiles.email` has a `UNIQUE` constraint — see §3 Q2 — which would reject a duplicate profile insert too). The rollback at line 76 (`await serviceClient.auth.admin.deleteUser(inviteData.user.id)`) only fires on a **profile-insert** failure; an `inviteError` itself (e.g. "email already registered") just returns the raw Supabase message to the UI unchanged.

### Frontend caller: `app/[locale]/(dashboard)/employees/page.tsx:245-270`

Same modal handles both add and edit, but **editing** takes a completely different path — a direct client-side `supabase.from('profiles').update(...)` call (anon client, RLS-governed, around line 210-223), never touching `auth.admin`. Only the "new employee" branch calls `/api/employees/invite`.

---

## 3. Full schema audit — every foreign key referencing `profiles(id)`

**Note on methodology:** No `psql`, Supabase CLI, or DB connection string/password exists anywhere in the project (`.env.local` holds only `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`). There is also no SQL committed anywhere in the repo — no `supabase/` directory, no migrations, and `git log --all -S"CREATE TRIGGER"` across full history returns nothing. The schema is dashboard-managed only.

The user's original `information_schema`-based query was rewritten by Claude against `pg_catalog` instead, because the original joins `constraint_column_usage` on `constraint_name` alone, which can mis-pair columns on composite foreign keys and doesn't filter by schema:

```sql
SELECT
  con.conrelid::regclass::text  AS table_name,
  a.attname                     AS column_name,
  con.confrelid::regclass::text AS references_table,
  af.attname                    AS references_column,
  CASE con.confdeltype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
       WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END AS delete_rule,
  CASE con.confupdtype WHEN 'a' THEN 'NO ACTION' WHEN 'r' THEN 'RESTRICT'
       WHEN 'c' THEN 'CASCADE' WHEN 'n' THEN 'SET NULL' WHEN 'd' THEN 'SET DEFAULT' END AS update_rule,
  con.conname                   AS constraint_name,
  pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN LATERAL unnest(con.conkey)  WITH ORDINALITY AS ck(attnum, ord) ON TRUE
JOIN LATERAL unnest(con.confkey) WITH ORDINALITY AS fk(attnum, ord) ON fk.ord = ck.ord
JOIN pg_attribute a  ON a.attrelid  = con.conrelid  AND a.attnum  = ck.attnum
JOIN pg_attribute af ON af.attrelid = con.confrelid AND af.attnum = fk.attnum
WHERE con.contype = 'f'
  AND con.confrelid = 'public.profiles'::regclass
ORDER BY 1, 2;
```

The user ran this (and the four other queries below) in the Supabase SQL Editor and pasted back the raw output.

### Result — 12 foreign keys across 11 tables (the user's original ask specifically named `weekly_reports`, `attendance_records`, and `match_predictions`; all three are covered, plus 8 more)

| table.column | references | delete_rule | update_rule | constraint |
|---|---|---|---|---|
| `attendance_records.employee_id` | `profiles.id` | **CASCADE** | NO ACTION | `attendance_records_employee_id_fkey` |
| `attendance_records.marked_by` | `profiles.id` | SET NULL | NO ACTION | `attendance_records_marked_by_fkey` |
| `calendar_task_assignees.profile_id` | `profiles.id` | **CASCADE** | NO ACTION | `calendar_task_assignees_profile_id_fkey` |
| `calendar_tasks.created_by` | `profiles.id` | SET NULL | NO ACTION | `calendar_tasks_created_by_fkey` |
| `contacts.added_by` | `profiles.id` | SET NULL | NO ACTION | `contacts_added_by_fkey` |
| `employee_requests.employee_id` | `profiles.id` | **NO ACTION** | NO ACTION | `employee_requests_employee_id_fkey` |
| `employee_requests.reviewed_by` | `profiles.id` | SET NULL | NO ACTION | `employee_requests_reviewed_by_fkey` |
| `event_team.profile_id` | `profiles.id` | **CASCADE** | NO ACTION | `event_team_profile_id_fkey` |
| `files.added_by` | `profiles.id` | **NO ACTION** | NO ACTION | `files_added_by_fkey` |
| `match_predictions.employee_id` | `profiles.id` | **NO ACTION** | NO ACTION | `match_predictions_employee_id_fkey` |
| `reports.submitted_by` | `profiles.id` | SET NULL | NO ACTION | `reports_submitted_by_fkey` |
| `weekly_reports.employee_id` | `profiles.id` | **NO ACTION** | NO ACTION | `weekly_reports_employee_id_fkey` |

(`leaderboard.employee_id → profiles.id` also appeared in an earlier read-only introspection pass via the PostgREST OpenAPI spec, but `leaderboard` is a **view** with only a `GET` method exposed — not a real table with a constraint, so it's excluded from the count above and from this SQL result, which correctly queried `pg_constraint`.)

`NO ACTION` with no `ON DELETE` clause is Postgres's default and behaves like `RESTRICT` here: it raises a `23503 foreign key violation` at statement time if any referencing row still exists.

### 🔴 Critical finding: deletion is currently blocked for any employee with real activity

Four tables use `NO ACTION`: **`employee_requests.employee_id`, `files.added_by`, `match_predictions.employee_id`, `weekly_reports.employee_id`.**

This means that **today**, `serviceClient.from('profiles').delete().eq('id', id)` at `route.ts:44` will **throw and the entire delete request will fail** for any employee who has ever:
- submitted a weekly report,
- uploaded a file,
- made a match prediction, or
- submitted an employee request (invoice/subscription/other).

Those are core features most active employees would have touched, so in practice, deleting a real employee through the admin panel likely already fails today — with a raw Postgres error message like `update or delete on table "profiles" violates foreign key constraint "weekly_reports_employee_id_fkey"` surfaced directly to whoever clicked delete (via `profileError.message` → `window.alert`).

**The silver lining:** because `route.ts` deletes `profiles` *before* calling `auth.admin.deleteUser`, this failure is clean. Nothing touches the auth account, and no orphan is created — it simply doesn't delete, with a confusing raw DB error shown to the admin instead of a clear one.

### The other 8 FKs, categorized by real-world effect

- **CASCADE (3 tables) — silently deletes historical data:** `attendance_records.employee_id`, `calendar_task_assignees.profile_id`, `event_team.profile_id`. Deleting a profile silently deletes that employee's entire attendance history, calendar task assignments, and event-team memberships. (The two "assignee/membership" join tables — `calendar_task_assignees`, `event_team` — are probably fine to cascade since they're pure join rows. `attendance_records` cascading away someone's whole attendance history is a bigger deal.)
- **SET NULL (5 tables) — orphans records, loses attribution:** `attendance_records.marked_by`, `calendar_tasks.created_by`, `contacts.added_by`, `employee_requests.reviewed_by`, `reports.submitted_by`. The record survives, but "who did this" becomes `NULL` and unrecoverable.

### Attempted quantification — blocked by a separate, pre-existing permissions issue

To find out exactly how many of the current employees are affected by the four `NO ACTION` blocks, a read-only count was attempted against `weekly_reports`, `files`, `match_predictions`, and `employee_requests` via the PostgREST API using the service-role key:

```
weekly_reports HTTP 403
files HTTP 403
match_predictions HTTP 403
employee_requests HTTP 403
```

Full error body:
```json
{"code":"42501","details":null,"hint":"Grant the required privileges to the current role with: GRANT SELECT ON public.weekly_reports TO service_role;","message":"permission denied for table weekly_reports"}
```

This is a **missing default grants** issue — the same class of problem already tracked in project memory (`F20 storage gotchas`). It's separate from the deletion question and wasn't chased further here, since granting privileges is itself a schema change and was out of scope for this read-only audit. It does mean, however, that **exact per-employee impact counts are still unknown** and would need to be pulled from the Supabase dashboard directly (or after the grants issue is fixed).

---

## 4. Auth-level check

### Does any trigger/function sync deletes between `auth.users` and `public.profiles`?

Two more queries, run by the user in the SQL editor:

**Triggers on either table:**
```sql
SELECT tg.tgrelid::regclass::text AS on_table,
       tg.tgname                  AS trigger_name,
       p.proname                  AS function_name,
       n.nspname                  AS function_schema,
       tg.tgenabled               AS enabled,
       pg_get_triggerdef(tg.oid)  AS definition
FROM pg_trigger tg
JOIN pg_proc p      ON p.oid = tg.tgfoid
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE NOT tg.tgisinternal
  AND tg.tgrelid IN ('auth.users'::regclass, 'public.profiles'::regclass)
ORDER BY 1, 2;
```

Result — **exactly one trigger, and it's unrelated to deletion:**
```json
[
  {
    "on_table": "profiles",
    "trigger_name": "enforce_profile_field_restrictions",
    "function_name": "prevent_self_privilege_escalation",
    "function_schema": "public",
    "enabled": "O",
    "definition": "CREATE TRIGGER enforce_profile_field_restrictions BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION prevent_self_privilege_escalation()"
  }
]
```

This is a `BEFORE UPDATE` guard (from commit `5128db8`, "add profile self-edit trigger") that prevents a user from escalating their own role via a self-edit. It fires only on `UPDATE`, never on `DELETE`, and has nothing to do with auth/profile sync.

**Any function whose body mentions both `auth.users` and `profiles`:**
```sql
SELECT n.nspname AS schema, p.proname AS function_name, pg_get_functiondef(p.oid) AS definition
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname NOT IN ('pg_catalog','information_schema')
  AND p.prosrc ILIKE '%auth.users%'
  AND p.prosrc ILIKE '%profiles%';
```

Result: **`Success. No rows returned`** — confirms nothing bridges the two tables except the FK constraint itself (below).

Repo-side confirmation: `grep -rniE "trigger|webhook|edge function|on_auth_user|handle_new_user"` across `app`, `lib`, `components`, `hooks`, `proxy.ts` returned **zero hits**, and there is no `supabase/functions/` directory in the repo — no Edge Function or webhook of any kind exists in the codebase.

### ✅ Key finding: `profiles.id` IS a real, enforced foreign key to `auth.users.id` — with `ON DELETE CASCADE`

```sql
SELECT conname, contype, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
ORDER BY contype, conname;
```

```json
[
  {
    "conname": "profiles_id_fkey",
    "contype": "f",
    "definition": "FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE"
  },
  {
    "conname": "profiles_pkey",
    "contype": "p",
    "definition": "PRIMARY KEY (id)"
  },
  {
    "conname": "profiles_email_key",
    "contype": "u",
    "definition": "UNIQUE (email)"
  }
]
```

This settles the question definitively: `profiles.id` is not merely conventionally equal to `auth.users.id` — it is DB-enforced. Also confirmed: `profiles.email` has a `UNIQUE` constraint (relevant to §2 — a duplicate invite would fail at the profile-insert step even without an app-level pre-check).

**Implication for the delete flow:** deleting an `auth.users` row will **always** cascade-delete the matching `profiles` row automatically, independent of any application code. This means the app's manual `profiles` delete at `route.ts:44` is technically redundant *if it succeeds* — but it exists specifically so that the four `NO ACTION` blocks in §3 are hit as a clean Postgres error **before** touching the auth account, rather than as an opaque GoTrue API error during a cascading auth delete. If the code's ordering were ever reversed (auth delete first), the same `NO ACTION` violation would still occur — just discovered mid-cascade and reported back through the Supabase Auth admin API instead.

### `profiles` column definitions (for completeness)

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'profiles'
ORDER BY ordinal_position;
```

| column | type | nullable | default |
|---|---|---|---|
| `id` | uuid | NO | *(none)* |
| `email` | text | NO | *(none)* |
| `full_name_ar` | text | YES | *(none)* |
| `full_name_en` | text | YES | *(none)* |
| `role` | text | YES | `'employee'::text` |
| `job_title_ar` | text | YES | *(none)* |
| `job_title_en` | text | YES | *(none)* |
| `department_ar` | text | YES | *(none)* |
| `department_en` | text | YES | *(none)* |
| `phone` | text | YES | *(none)* |
| `profile_image_url` | text | YES | *(none)* |
| `created_at` | timestamptz | YES | `now()` |
| `birthday` | date | YES | *(none)* |

`id` has no default and is `NOT NULL` — it must always be supplied explicitly, which matches the invite route explicitly setting `id: inviteData.user.id`.

### The two RPCs exposed on this project — both unrelated to deletion

```sql
SELECT n.nspname AS schema, p.proname, pg_get_functiondef(p.oid) AS definition
FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE p.proname IN ('rls_auto_enable','is_attendance_manager');
```

- **`is_attendance_manager(uid uuid DEFAULT auth.uid())`** — a `SECURITY DEFINER` role-check helper:
  ```sql
  CREATE OR REPLACE FUNCTION public.is_attendance_manager(uid uuid DEFAULT auth.uid())
   RETURNS boolean
   LANGUAGE sql
   STABLE SECURITY DEFINER
   SET search_path TO 'public'
  AS $function$
    select exists (
      select 1 from public.profiles
      where id = uid and role in ('developer', 'ceo', 'project_manager')
    );
  $function$
  ```
- **`rls_auto_enable()`** — an event trigger function that auto-enables RLS on any newly created table in `public`:
  ```sql
  CREATE OR REPLACE FUNCTION public.rls_auto_enable()
   RETURNS event_trigger
   LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path TO 'pg_catalog'
  AS $function$
  DECLARE
    cmd record;
  BEGIN
    FOR cmd IN
      SELECT *
      FROM pg_event_trigger_ddl_commands()
      WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
        AND object_type IN ('table','partitioned table')
    LOOP
       IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
        BEGIN
          EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
          RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
        EXCEPTION
          WHEN OTHERS THEN
            RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
        END;
       ELSE
          RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
       END IF;
    END LOOP;
  END;
  $function$
  ```

### Empirical orphan check (read-only, via service-role REST calls)

Before the SQL results came back, an empirical cross-check was run by fetching `GET /auth/v1/admin/users` and `GET /rest/v1/profiles?select=id,email` and diffing them in-memory:

```
auth.users count   : 7
profiles count     : 7

ORPHANED auth.users (auth row, NO profiles row): 0
ORPHANED profiles (profiles row, NO auth.users row): 0

ID match check: every profiles.id also present as an auth.users.id? -> true
```

At the time of this audit, **there are no orphans in either direction** — all 7 auth accounts have a matching profile and vice versa. This is now additionally explained by the `ON DELETE CASCADE` FK found in §4: orphans in the `auth.users`-has-no-`profiles` direction are structurally prevented by the database itself, not just by application discipline.

---

## Summary — what this means for the soft-delete / snapshot decision

1. **Auth ↔ profiles sync is solid.** `profiles.id → auth.users.id ON DELETE CASCADE` is a real, DB-enforced constraint — there is no drift risk between the two tables regardless of which order code deletes them in.
2. **Deletion is currently broken in practice for active employees.** 4 of 12 downstream FKs (`employee_requests`, `files`, `match_predictions`, `weekly_reports`) use `NO ACTION`, which will reject the `profiles` delete outright if the employee has any row in those tables — likely true for most real employees today. The failure is at least clean (no orphan), but it means the "delete employee" button probably already doesn't work for anyone with real usage history, surfacing a raw Postgres error to the admin.
3. **3 tables cascade-delete history silently** (`attendance_records`, `calendar_task_assignees`, `event_team`) — most concerning for `attendance_records`, since that erases an employee's entire attendance record with no trace.
4. **5 tables `SET NULL` on delete** (`attendance_records.marked_by`, `calendar_tasks.created_by`, `contacts.added_by`, `employee_requests.reviewed_by`, `reports.submitted_by`) — records survive, but lose attribution permanently.
5. **No hidden trigger, webhook, or Edge Function does anything else with deletes** — the FK constraint is the entire story at the DB level; nothing in the codebase adds to or overrides it.
6. **Exact per-employee blast radius is still unknown** — the attempt to count how many current employees are already un-deletable due to the `NO ACTION` FKs hit a `42501 permission denied` (missing `GRANT SELECT ... TO service_role`), a separate pre-existing issue. Worth pulling those counts from the Supabase dashboard directly before finalizing an approach.

Both soft-delete and a snapshot approach sidestep the `NO ACTION` blocking problem (neither requires actually deleting the `profiles` row), but they trade off differently: soft-delete keeps the row and its role/permission surface around, needing an "is active" filter added everywhere the app queries `profiles`; a snapshot approach could fully remove the live profile while preserving a point-in-time copy, avoiding the filter-everywhere problem but requiring a deliberate archival step and decisions about what happens to the CASCADE-linked tables (`attendance_records` in particular) at that moment.
