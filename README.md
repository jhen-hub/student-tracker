# Student Requirements and Document Tracking System

A frontend-only prototype built with React + Vite for an IPT/Capstone final project. It simulates a school registrar's system for tracking student document requirements — no backend, database, or authentication server required. All data lives in mock JavaScript files and is persisted to `localStorage` so it survives page refreshes.

## Tech stack

- React 18 + Vite
- React Router DOM (routing + role-based route guards)
- Tailwind CSS (styling)
- Lucide React (icons)
- Recharts (dashboard & report charts)
- React Context + Hooks (state management — no Redux needed)

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`). Vite hot-reloads on save.

To build a production bundle:

```bash
npm run build
npm run preview
```

## Demo accounts

Use the demo login selector on `/login`, or sign in manually with:

| Role    | Email                  | Password    |
|---------|-------------------------|-------------|
| Admin   | admin@registrar.edu     | admin123    |
| Staff   | staff@registrar.edu     | staff123    |
| Student | student@registrar.edu   | student123  |

You can also register a new demo account from `/register` — it's stored only in your browser.

## Project structure

```
public/                Static assets copied as-is to the build root (favicon.svg, robots.txt)
src/
├── assets/             Bundled images/icons imported by components (e.g. logo.svg)
├── components/         Reusable UI (Layout, Sidebar, Navbar, Modal, StatusBadge, etc.)
├── pages/               One file per route — see "Pages by role" below
├── data/                Mock data: students, requirements, users, notifications
├── context/             AppContext — global state + CRUD actions, persisted to localStorage
├── App.jsx              Route definitions + role-based guards
└── main.jsx             App entry point
```

## Pages by role

Admin and Staff share the registrar tool pages, but each page enforces the narrower
Staff permissions from the system proposal; Student gets its own dedicated tab set
instead of a single combined profile page.

| Route                     | Admin | Staff | Student | Notes |
|---------------------------|:-----:|:-----:|:-------:|-------|
| `/dashboard`               | ✅ | ✅ | – | System-wide stats & charts |
| `/students`, `/students/:id` | ✅ full (incl. delete) | ✅ add/edit only | – | Staff can't delete student records |
| `/requirements`            | ✅ full CRUD | 👁 view only | – | Only Admin manages the requirements catalog |
| `/reports`                 | ✅ | ✅ | – | Filters, chart, CSV export, print |
| `/notifications`           | ✅ create/manage | ✅ create/manage | 👁 view/mark read only | Only staff can send reminders |
| `/users`                   | ✅ | – | – | Admin-only account management |
| `/settings`                | ✅ | – | – | Admin-only system settings |
| `/student/dashboard`       | – | – | ✅ | Student's personal overview (own stats + chart) |
| `/student/requirements`    | – | – | ✅ | Student's own checklist, read-only |
| `/profile`                 | ✅ | ✅ | ✅ | Shared "edit profile" tab (info + password) |

## What's implemented

- Role-based demo login (Admin / Staff / Student) with a route guard — no real authentication
- Student CRUD: add, edit, delete (with confirmation), view profile, search, filter, sort, pagination
- Per-student requirements checklist with Submitted / Pending / Missing status updates
- Requirements catalog: add, edit, delete, toggle active/inactive
- Dashboard with live stat cards and Recharts visualizations that update as data changes
- Reports page with filters, a compliance chart, CSV export, and print support
- Notifications: create reminders, mark read/unread, delete, filter unread
- Profile page: edit info, change mock password
- Admin-only User Management and System Settings pages
- Toast confirmations on every important action, empty states, and responsive layout (sidebar collapses to a drawer on mobile)

## Connecting a real backend later

This prototype is deliberately backend-agnostic so the same UI can be wired up to a real API later:

1. **Replace `src/data/*.js` with API calls.** Each mock array (`students`, `requirements`, `users`, `notifications`) maps to a REST resource, e.g. `GET /api/students`, `POST /api/students`, `PATCH /api/students/:id`, `DELETE /api/students/:id`.
2. **Swap `AppContext`'s local state for data fetched from the API.** The CRUD functions (`addStudent`, `updateStudent`, `deleteStudent`, etc.) already isolate all state mutations in one place — change their bodies to call `fetch`/`axios` against an Express API instead of calling `setStudents` directly, then update state from the response.
3. **Move authentication server-side.** Replace the mock `login`/`register` functions with calls to a Node.js + Express auth endpoint (e.g. JWT-based), and store the token instead of the full user object.
4. **Add a MySQL database** with tables mirroring the mock shapes (`students`, `requirements`, `student_requirements` join table, `users`, `notifications`, `settings`).
5. **Keep the component layer unchanged.** Because pages only ever call context functions (never touch mock data directly), migrating to a real backend should not require rewriting any page or component — only `AppContext.jsx` and the `data/` layer change.
6. **Environment config.** Introduce a `.env` with `VITE_API_BASE_URL` and point all requests there once the Express server is deployed (e.g. on Render) alongside the MySQL database.

## Scope limitations (by design)

This build intentionally excludes: real authentication, a database, payment/tuition processing, government document verification, external system integration, file uploads, and a mobile app — matching the system proposal's "Out of Scope" section.
