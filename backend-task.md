# Backend Task: Express API for the Vertudez Frontend

> **Status:** Ready to execute
> **Scope:** Create the Express backend route layer (plus minimal scaffolding) so every frontend service function has a real endpoint.
> **Related files:** `schema.sql`, `src/api/*`, `src/types/*`, `CLAUDE.md`

---

## Progress

**Last session:** 2026-10-08 - Created complete Express backend with all routes, middleware, scaffolding, and documentation. Tested all endpoints including special natural key endpoint for student requirements status updates. Server running on port 3000.

**Next action:** Completed audit-fix task: all 5 commits finished (fixed BACKEND_ROUTES.md, added auth routes, stripped passwords, fixed all PATCH handlers)

### Checklist
- [x] Recon — function → endpoint map, table → route map, DB name, file list (await my confirmation before coding)
- [x] Commit 1 — scaffolding (`package.json`, `server.js`, `db.js`, `.env.example`, `.gitignore`)
- [x] Commit 2 — shared middleware + error handler
- [x] Commit 3 — routes for `users`, `students`, `requirements`
- [x] Commit 4 — routes for `student_requirements`, `student_activity`
- [x] Commit 5 — routes for `notifications`, `settings`
- [x] Commit 6 — `BACKEND_ROUTES.md`
- [ ] Final verification — `curl GET /students` and `GET /students/:id` return real rows (if DB reachable)

---

## Context

- The React frontend consumes an Express API through a typed service layer in `src/api/` with types in `src/types/`. Those service modules currently contain TODO stubs — **they are the contract you must satisfy**.
- `schema.sql` at the repo root is the **source of truth for the database name, table names, columns, enums, and relationships**.
- ⚠️ Known issue: `schema.sql` has broken INSERTs in the `student_requirements` block (rows using `:` instead of `,`). Do not "fix" them silently — see `backend-task.md`.
- The backend has **no `.env` yet** and no committed secrets. Target environment is a **default XAMPP MySQL install** (localhost, port 3306, user `root`, empty password).
- The backend folder has **no scaffolding yet** — you will create it.

### Known schema issue (do not "fix" silently)

`schema.sql` has broken INSERTs in the `student_requirements` block — several rows use `:` where a `,` is expected:

- `SR-STU-005-REQ-003`
- `SR-STU-007-REQ-004`, `SR-STU-007-REQ-005`
- `SR-STU-008-REQ-003`
- `SR-STU-009-REQ-003`
- `SR-STU-010-REQ-003`
- `SR-STU-011-REQ-002`

Read `schema.sql` for **structure only**. Do not trust those rows as valid seed data. Do not repair the file.

---

## Goal

Create the Express backend **route layer** (plus the minimal supporting scaffolding it needs to run) so every frontend service function has a real endpoint that matches the frontend's expected URLs, methods, payloads, and response shapes.

---

## Source of truth for the API contract

**Before writing any route**, read the frontend's service layer under `src/api/` and the types under `src/types/`. For each exported function:

- Note the HTTP method, path, path/query params, request body shape, and expected return type.
- If a function's stub lacks a path, propose one using REST conventions and **list it for confirmation before implementing**.

If the frontend does not cover something in `schema.sql` (e.g. `notifications`, `settings`, `student_activity`), still create read/write routes using REST conventions, and mark them as "frontend-unused for now" in the summary.

---

## Locked API contract decisions (do not re-litigate)

### HTTP verb policy

- **All updates use PATCH. No PUT routes anywhere.**
- Rationale: the frontend sends partial payloads (single-field edits, toggles, form diffs). PUT's full-replacement semantics would either null out unsent columns or force per-route "all fields required" validation for no gain.
- `POST` for creates, `DELETE` for deletes. No `PUT` anywhere.
- Applies uniformly, including:
  - `PATCH /api/students/:id` — partial student edit
  - `PATCH /api/users/:id` — partial user edit
  - `PATCH /api/requirements/:id` — partial catalog edit
  - `PATCH /api/notifications/:id` — e.g. `{ "read": true }`
  - `PATCH /api/settings/:key` — `{ "value": "..." }`
  - `PATCH /api/student-requirements/:studentId/:requirementId/status`

### `student_requirements` natural key

- Addressed by its **natural key `(student_id, requirement_id)`**, not the surrogate `id`.
- Status update endpoint:
  ```
  PATCH /api/student-requirements/:studentId/:requirementId/status
  Body: { "status": "Submitted" | "Pending" | "Missing" }
  ```
- Handler MUST be a **single atomic `UPDATE`** — no SELECT-then-UPDATE:
  ```sql
  UPDATE student_requirements
     SET status = ?, submitted_at = ?
   WHERE student_id = ? AND requirement_id = ?
  ```
- `404` when `result.affectedRows === 0` (covers both "doesn't exist" and "not yours" — do not distinguish).
- `400` when `status` is not one of the three enum values.
- `submitted_at` = `NOW()` when transitioning into `Submitted`, `NULL` otherwise.
- Do **not** create a `PATCH /api/student-requirements/:id/status` route.
- The same natural-key pattern applies to any other endpoint where the frontend already holds both foreign keys.

### PATCH handler rules

Each PATCH handler must:

- Accept a body containing only the fields being changed.
- Build the `SET` clause from the keys actually present (whitelisted against `schema.sql` columns — reject unknown keys with `400`, do not silently ignore).
- Return `404` if `affectedRows === 0`, `400` on validation failure.
- Be idempotent — same payload twice = same result.

### Why these decisions

- **PATCH over PUT:** frontend sends partial payloads; PUT would require full-replacement semantics or per-route validation for no benefit.
- **Natural key over surrogate id:** composite `UNIQUE KEY unique_student_req (student_id, requirement_id)` is a perfect index. Single atomic UPDATE = no TOCTOU window, IDOR-safe 404, one round-trip instead of two. The "lookup first" pattern is where authorization-check bugs are born because the ownership predicate becomes a skippable step rather than part of the `WHERE` clause.
- **No SELECT-before-UPDATE:** race conditions in check-then-act are security bugs, not just data bugs.

---

## In scope

### 1. Project scaffolding (if not already present)

- `package.json` with `express`, `mysql2`, `cors`, `dotenv`, and `nodemon` (dev).
- `src/server.js` (or `index.js`) that boots Express, enables `cors`, parses JSON, mounts routes, and listens on `process.env.PORT`.
- `src/db.js` exporting a `mysql2/promise` connection pool built from env vars.

### 2. Env files

- `.env.example` committed, with XAMPP-friendly defaults:
  ```
  PORT=3000
  DB_HOST=localhost
  DB_PORT=3306
  DB_USER=root
  DB_PASSWORD=
  DB_NAME=<read from schema.sql>
  ```
  **The database name must come from `schema.sql`** — look for a `CREATE DATABASE` or `USE` statement. If `schema.sql` does not declare one, pick a sensible name (e.g. `vertudez`) and say so explicitly in your summary.
- `.env` added to `.gitignore`. Do **not** create a real `.env` with secrets.

### 3. Route modules under `src/routes/`

One file per resource, matching the frontend service layer:

- `users`
- `students`
- `requirements` (→ `requirements_catalog` table)
- `studentRequirements` (→ `student_requirements` table)
- `studentActivity` (→ `student_activity` table)
- `notifications`
- `settings`

Each route handler:

- Uses parameterized queries (`?` placeholders) — no string concatenation.
- Returns JSON with the exact field names from `schema.sql` (snake_case as declared — do not camelCase unless the frontend types expect it; if they do, convert at the boundary and note it).
- Wraps DB calls in `try/catch` and forwards to a shared error handler.
- Returns `404` for missing single-resource lookups, `400` for validation failures, `500` for unexpected errors.

### 4. Minimal validation

Validate required fields and enum values (`role`, `status`, `year_level`, `submitted_at` nullability, etc.) against `schema.sql`. Keep it lightweight — no full validation library unless the project already uses one.

### 5. Shared middleware

- `src/middleware/errorHandler.js` for consistent error JSON.
- `src/middleware/notFound.js` for unmatched routes.

### 6. Documentation

`BACKEND_ROUTES.md` at the repo root listing every endpoint: method, path, params, body, response shape, and which frontend service function calls it.

For `PATCH /api/student-requirements/:studentId/:requirementId/status`, document explicitly:
- Why the natural key is used (composite UNIQUE index, atomic update, no TOCTOU window, IDOR-safe `404`).
- That `affectedRows === 0` intentionally returns `404` rather than `403` to avoid existence disclosure.

---

## Out of scope (do NOT do)

- Do **not** modify the React frontend, `src/api/`, or `src/types/`. If a frontend type looks wrong, report it — don't fix it here.
- Do **not** implement authentication, sessions, JWT, or password hashing yet. The frontend has no auth flow wired up; keep routes open. Note this as a follow-up.
- Do **not** run `schema.sql` against a live DB or "repair" its broken INSERTs.
- Do **not** invent endpoints the frontend doesn't call and `schema.sql` doesn't imply.
- Do **not** add a frontend dev-server proxy config — that's a separate task.
- Do **not** commit any real credentials.
- Do **not** add a surrogate-`id` PATCH route, a SELECT-before-UPDATE, or a transaction wrapper for the status update — the single-statement form is intentional and the security rationale is documented above.

---

## Working method (Claude Code)

### Recon first — no edits

Reply with:

1. Every function exported from `src/api/*`, its HTTP method + proposed path + request/response shape.
2. The table → route mapping derived from `schema.sql`.
3. Any frontend function that doesn't map cleanly to a table, and your proposed resolution.
4. The database name as read from `schema.sql` (or the fallback you propose).
5. The list of files you intend to create.

When mapping frontend service functions to routes, **assert that every mutating update is PATCH**. If any frontend stub implies a full-replacement semantic (e.g. a "save the whole X" function), flag it — do not create a PUT route without asking.

**Wait for confirmation before creating anything.**

### Execute in small commits

- **Commit 1:** scaffolding (`package.json`, `server.js`, `db.js`, `.env.example`, `.gitignore`)
- **Commit 2:** shared middleware + error handler
- **Commit 3:** routes for `users`, `students`, `requirements`
- **Commit 4:** routes for `student_requirements`, `student_activity`
- **Commit 5:** routes for `notifications`, `settings`
- **Commit 6:** `BACKEND_ROUTES.md`

### Verify after each commit

- Start the server with `nodemon`.
- Hit each new route with a `curl` example.
- Paste the result.
- Fix failures before moving on.

If MySQL/XAMPP isn't running locally, still create the code and **note that routes are untested against a live DB** — do not fake test output.

---

## Stop conditions (apply to every session)

- **Same error twice → stop and ask.** If the same command fails twice with the same error, report it verbatim, what you tried, and your hypothesis. **Wait for me to say "retry" or "change approach" before attempting a third fix.** If I say retry, try a genuinely different approach — not a variation of the same one.
- **Re-reading a file → stop.** If you're about to re-read a file you've already read this session, stop and state what you're looking for.
- **Guessing → stop and ask.** If you need information you don't have (missing env value, unknown API shape, ambiguous schema field), stop and ask. Do not guess and iterate.
- **Long stretch without checkpoint → stop.** After every 5 tool calls, print a one-line status: `Step N: <what I just did> → <what's next>`. If you can't state a clear next step, stop and ask.
- **No duplicate edits.** Never make the same edit to the same file more than once. If an edit didn't take, investigate why before retrying.
- **One commit per session** unless explicitly told to do the whole sequence.

---

## Definition of done

- `npm install && npm run dev` boots the server without crashing.
- Every function in `src/api/*` has a corresponding route whose path, method, and response shape match what the frontend expects.
- `BACKEND_ROUTES.md` is accurate and lists a `curl` example per endpoint.
- `.env.example` is committed with the XAMPP defaults above; `.env` is git-ignored.
- No hardcoded credentials, no string-concatenated SQL, no unhandled promise rejections in route handlers.
- If the DB is reachable, `curl` against at least `GET /students` and `GET /students/:id` returns real rows shaped like `schema.sql`.
- Lint + typecheck + build (if applicable) all pass.

---

## Constraints

- Prefer CommonJS unless the frontend repo is already ESM-only (match its `"type"` convention).
- Keep the folder layout flat and conventional (`src/routes`, `src/middleware`, `src/db.js`). Don't over-architect with controllers/services/repositories unless the frontend clearly expects that split.
- Table and column names must match `schema.sql` **exactly** — including the backticked `settings.key` / `settings.value`.
- If `schema.sql`'s enums and the frontend types disagree (e.g. an extra status value), stop and ask which is authoritative.