# Auth & Audit Task: Fix BACKEND_ROUTES.md, Add Missing Auth Routes, Harden PATCH Handlers

> **Status:** Ready to execute
> **Scope:** (1) Audit the entire backend against `BACKEND_ROUTES.md`. (2) Add the missing `login` and `register` routes. (3) Strip `password` from all user responses. (4) Fix the PATCH whitelist bug in every router.
> **Related files:** `BACKEND_ROUTES.md`, `backend/src/server.js` (or wherever `app.js` lives), `backend/src/routes/*.js`, `backend/src/middleware/*`, `schema.sql`

---

## Progress

**Last session:** 2026-10-08 - Completed recon audit: found missing auth routes, password leakage in user endpoints, and SQL injection vulnerability in all PATCH handlers due to raw field interpolation.
**Next action:** Commit 1 — correct BACKEND_ROUTES.md so it matches reality

### Checklist
- [x] Recon — full backend audit: routes present vs documented, PATCH whitelist status, password leaks, auth gaps (await my confirmation before coding)
- [ ] Commit 1 — correct `BACKEND_ROUTES.md` so it matches reality
- [ ] Commit 2 — add `POST /api/users/login` and `POST /api/users/register`; strip `password` from all user responses
- [ ] Commit 3 — PATCH whitelist fix in `routes/users.js`
- [ ] Commit 4 — PATCH whitelist fix in remaining routers (`students`, `requirements`, `studentRequirements`, `studentActivity`, `notifications`, `settings`)
- [ ] Commit 5 — final verification (`curl` each fixed endpoint, confirm 400 on unknown fields, confirm no password in any user response)

### How to use this section
- **Starting a session:** read "Last session" and "Next action," then continue from the first unchecked box.
- **Ending a session:** check the box(es) you finished, update "Last session" with a one-line summary, set "Next action" to the next unchecked item.
- **Blocked:** do NOT check the box. Write the exact error under "Last session" and set "Next action" to the question you need answered.

---

## Context

- The backend follows `backend-task.md`'s structure: Express + mysql2 pool, routes mounted in `server.js` under `/api/*`, shared `errorHandler` and `notFound` middleware.
- `BACKEND_ROUTES.md` documents `POST /api/login` and `POST /api/register`, but **neither endpoint exists**. `server.js` only mounts the 7 resource routers (`users`, `students`, `requirements`, `student-requirements`, `student-activity`, `notifications`, `settings`), and `routes/users.js` has no login/register handlers.
- `routes/users.js`'s `PATCH /:id` builds the `SET` clause by interpolating **raw key names** from `req.body`. Values are parameterized, but field names are not — this is a SQL injection vector and violates `backend-task.md`'s "PATCH handler rules" (whitelist against `schema.sql` columns, reject unknown keys with `400`).
- User-related endpoints (`GET /api/users`, `GET /api/users/:id`, `GET /api/users/email/:email`) return `SELECT * FROM users`, which includes the plaintext `password` column. This leaks credentials to any caller.
- The auth model is intentionally minimal: **no JWT, no sessions, no hashing yet** (matches `backend-task.md`'s "Out of scope" list). Passwords remain plaintext to match `schema.sql` seed data. This task does not introduce token-based auth — just the two missing endpoints.

---

## Goal

1. Make `BACKEND_ROUTES.md` an accurate reflection of the running server.
2. Add `POST /api/users/login` and `POST /api/users/register` so the frontend's `usersService.login()` and `usersService.register()` have real endpoints.
3. Stop returning the `password` field from any user endpoint.
4. Fix the PATCH key-injection vulnerability across **every** router, not just `users.js`.

---

## Locked decisions (do not re-litigate)

### Auth routes live under `/api/users/*` (Option A)

- **Do NOT** create a separate `/api/auth` mount or top-level `/api/login` / `/api/register`.
- Add handlers directly to `routes/users.js`:
  - `POST /api/users/login`
  - `POST /api/users/register`
- Rationale: auth is conceptually part of the users resource; a separate mount for two endpoints is over-engineering for this app.
- Update `BACKEND_ROUTES.md` to reflect the nested paths.

### `login` contract

- Request: `{ email, password }`
- Behavior: `SELECT * FROM users WHERE email = ?`. If no row **or** password mismatch → `401 { error: 'Invalid credentials' }` (do not distinguish which failed — same reason as the student-requirements 404 rule).
- Success → `200` with the user object, **`password` field removed**.
- Use a constant-time-ish comparison? Not yet — plaintext compare is fine given no hashing exists. But note it as a follow-up in the commit message.

### `register` contract

- Request: `{ name, email, password, student_id? }`
- Behavior: creates a user with `role = 'Student'` **always**. Any other role must go through `POST /api/users` (the admin path).
- `status` defaults to `'Active'`.
- If `email` already exists → `400 { error: 'Email already exists' }` (matches existing `POST /api/users` behavior).
- Success → `201` with the user object, **`password` field removed**.
- Rationale: allowing self-signup as `Admin` or `Staff` is a privilege-escalation hole. Locking `register` to `Student` is the safe default. Admin/staff creation stays behind `POST /api/users`.

### `password` is never returned

- Every endpoint that returns a user row must strip `password` before responding:
  - `GET /api/users`, `GET /api/users/:id`, `GET /api/users/email/:email`
  - `POST /api/users`, `PATCH /api/users/:id`
  - `POST /api/users/login`, `POST /api/users/register`
- Implement as a small helper in `routes/users.js` — e.g. `const stripPassword = ({ password, ...rest }) => rest;` — and apply it to every response. Do not rely on the DB query to omit it (a future schema change could add it back).
- Note: this changes the response shape for the frontend. The `User` typedef in `frontend/src/types/users.js` should drop the `password` field (or mark it as `never`). **Flag this as a follow-up** — do not edit the frontend in this task.

### PATCH whitelist pattern (fix in every router)

Every `PATCH` handler must:

1. Define an `ALLOWED` array of column names, taken from `schema.sql`.
2. Reject unknown keys with `400 { error: 'Unknown fields: ...' }`.
3. Reject empty update bodies with `400 { error: 'No valid fields to update' }`.
4. Never interpolate raw body keys into SQL.

Reference implementation (adapt the `ALLOWED` array per resource):

```js
const ALLOWED = ['name', 'email', 'password', 'role', 'status', 'student_id'];

const unknown = Object.keys(req.body).filter(k => !ALLOWED.includes(k));
if (unknown.length > 0) {
  return res.status(400).json({ error: `Unknown fields: ${unknown.join(', ')}` });
}

const fields = Object.keys(req.body);
if (fields.length === 0) {
  return res.status(400).json({ error: 'No valid fields to update' });
}

const setClause = fields.map(f => `\`${f}\` = ?`).join(', ');
// values still parameterized as before