# Taskflow — Task Management System

A small, complete full-stack project for a college demonstration, beginner portfolio, or internship submission. Register an account, organize your tasks, and track your progress in a responsive blue-and-white dashboard.

## Features

- Registration, login, logout, bcrypt password hashes, and JWT authentication.
- Protected dashboard and API endpoints; every task query is scoped to its owner.
- Create, view, edit, delete with confirmation, and toggle pending/completed tasks.
- Required title; optional description and due date; Low/Medium/High priority.
- All/Pending/Completed filters, text search, task counts, and created dates.
- Responsive layout, keyboard-accessible dialogs, loading, empty, and error states.
- SQLite schema, automatic initialization, REST API integration tests, deployment configuration.

## Technology stack

| Layer           | Technology                                                        |
| --------------- | ----------------------------------------------------------------- |
| Frontend        | React 19, Vite 6, React Router                                    |
| Styling         | Tailwind CSS 4, Lucide icons                                      |
| Backend         | Node.js 24 LTS, Express 5                                         |
| Database        | SQLite through Node's built-in `node:sqlite` module               |
| Authentication  | bcrypt, jsonwebtoken (HS256; one-day tokens)                      |
| Hosting         | Vercel or Netlify frontend; Render backend with a persistent disk |
| Version control | Git and GitHub                                                    |

Node 24 is required: the backend uses Node's built-in SQLite driver, so no separate SQLite server or native database package installation is needed. Tailwind 4 is integrated using its Vite plugin; a Tailwind 3 configuration file is unnecessary.

## Folder structure

```text
task-management-system/
├── frontend/
│   ├── src/
│   │   ├── components/       # Brand, Modal, TaskForm
│   │   ├── pages/            # AuthPage, Dashboard
│   │   ├── services/api.js   # Shared fetch helper
│   │   ├── context/          # AuthContext
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── tests/integration.mjs # React + real API integration test
│   ├── .env.example
│   ├── index.html
│   ├── vite.config.js
│   ├── vercel.json
│   ├── package-lock.json
│   └── package.json
├── backend/
│   ├── routes/               # Auth and task endpoints
│   ├── controllers/          # Request handlers
│   ├── middleware/           # JWT authentication and validation
│   ├── database/             # schema.sql, db.js, init.js
│   ├── tests/api.test.js
│   ├── .env.example
│   ├── app.js
│   ├── server.js
│   ├── package-lock.json
│   └── package.json
├── docs/
├── .gitignore
├── .nvmrc
├── netlify.toml
├── render.yaml
└── README.md
```

## Prerequisites

Install [Node.js 24 LTS](https://nodejs.org/), npm (bundled with Node), and [Git](https://git-scm.com/). Use a modern browser. Check `node --version` and `npm --version` before starting. These commands assume you are in the extracted `task-management-system` folder.

## 1. Backend setup

```bash
cd backend
npm ci
cp .env.example .env
node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"
```

Copy the generated random value into `JWT_SECRET` in `backend/.env`. On Windows PowerShell use `Copy-Item .env.example .env` instead of `cp`. Never commit `.env`.

```bash
npm run db:init
npm run dev
```

The API runs at `http://localhost:5000`. Check `http://localhost:5000/api/health`; it should return `{"status":"ok"}`. `npm start` runs without the file watcher.

## 2. Frontend setup

Open a **second terminal** in the project root:

```bash
cd frontend
npm ci
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`. Register a new account; you will be signed in automatically. Add a task, edit it, toggle completion, try the filters, and delete it. Log out and log in again to confirm persistence.

If Vite reports an OS network-interface error in a restricted container, run `npm run dev -- --host 127.0.0.1`. Use `http://localhost:5173` in the browser, or add `http://127.0.0.1:5173` to `FRONTEND_URL` if using that address. If port 5173 is occupied, stop the old process or update the CORS configuration to match the new port.

## 3. Database initialization and relationships

`backend/database/schema.sql` defines:

- `users`: `id`, `name`, unique case-insensitive `email`, `password_hash`, `created_at`.
- `tasks`: `id`, `user_id`, `title`, `description`, `priority`, `status`, `due_date`, `created_at`, `updated_at`.

The foreign key is `tasks.user_id → users.id` with `ON DELETE CASCADE`. Foreign-key enforcement is enabled on each connection. An index on `user_id` supports per-user lists. SQL statements use bound parameters. Priority/status also have database constraints. Timestamps use UTC ISO strings; due dates are calendar dates (`YYYY-MM-DD`) without time zones.

The database and tables are created automatically when the backend starts. `npm run db:init` explicitly performs the same idempotent initialization and preserves existing data. The default file is `backend/database/tasks.sqlite` when commands run from `backend/`. Relative `DATABASE_PATH` values resolve from the backend process's working directory. There are no seeded accounts or tasks.

For local backups, stop the backend and copy the SQLite file. Do not copy only the main database file from an actively writing WAL database; use SQLite's backup facilities for live backups. Schema initialization creates missing tables but does not migrate existing columns.

## Environment variables

| File            | Variable        | Purpose                                                                 |
| --------------- | --------------- | ----------------------------------------------------------------------- |
| `backend/.env`  | `PORT`          | API port; local default 5000; Render supplies its port                  |
| `backend/.env`  | `JWT_SECRET`    | Required random secret, at least 32 characters                          |
| `backend/.env`  | `FRONTEND_URL`  | Comma-separated exact frontend origins; default `http://localhost:5173` |
| `backend/.env`  | `DATABASE_PATH` | Local SQLite path or `/var/data/tasks.sqlite` with a Render disk        |
| `frontend/.env` | `VITE_API_URL`  | API base URL including `/api`; default `http://localhost:5000/api`      |

Origins have no trailing slash or path. Example: `https://your-project.vercel.app,https://your-project.netlify.app`. Restart the API after backend environment changes. Vite variables are embedded at build time: restart Vite locally or rebuild/redeploy after changing `VITE_API_URL`. Never put secrets in `VITE_` variables.

## How the application works

1. Registration validates the account and hashes the password with bcrypt (12 rounds).
2. Login verifies the hash and returns `{ token, user }` without the password hash.
3. React keeps the token in `sessionStorage` for that browser tab and sends `Authorization: Bearer TOKEN` with protected requests.
4. On reload, `/api/auth/me` verifies the session. Unauthorized responses send the user to login.
5. JWT middleware resolves the current user. Task handlers always use both the task ID and authenticated user ID.
6. The React dashboard updates from the API response after successful writes. Reloading retrieves the saved SQLite data.

Logout removes the browser token. Tokens expire after one day; logout does not revoke an already copied token on the server. Session storage is accessible to JavaScript, so avoid injecting untrusted HTML. React renders task text as escaped content. This is an educational app; before wider production use, consider rate limiting, an HttpOnly-cookie authentication design, token revocation, email verification, password recovery, and monitoring.

## REST API documentation

All bodies and responses use JSON, except successful deletion (`204`, empty body). Include `Content-Type: application/json` for bodies. Protected endpoints require the bearer token. Collection URLs work with or without a trailing slash. Item endpoints use `/:id` (the missing IDs in the original brief are resolved here).

| Method | Endpoint             | Auth | Success | Description                                                 |
| ------ | -------------------- | ---- | ------- | ----------------------------------------------------------- |
| GET    | `/api/health`        | No   | 200     | Service health                                              |
| POST   | `/api/auth/register` | No   | 201     | `{name,email,password}` → `{token,user}`                    |
| POST   | `/api/auth/login`    | No   | 200     | `{email,password}` → `{token,user}`                         |
| GET    | `/api/auth/me`       | Yes  | 200     | `{user}`                                                    |
| GET    | `/api/tasks`         | Yes  | 200     | `{tasks: [...]}`; optional `?status=Pending` or `Completed` |
| GET    | `/api/tasks/:id`     | Yes  | 200     | `{task}`                                                    |
| POST   | `/api/tasks`         | Yes  | 201     | Create; returns `{task}`                                    |
| PUT    | `/api/tasks/:id`     | Yes  | 200     | Replace editable fields; returns `{task}`                   |
| DELETE | `/api/tasks/:id`     | Yes  | 204     | Delete owned task                                           |

Task request example:

```json
{
  "title": "Prepare project presentation",
  "description": "Review the demo flow and slides",
  "priority": "High",
  "status": "Pending",
  "due_date": "2026-12-15"
}
```

Title is trimmed and required (1–150 characters). Description is optional (max 2,000 characters). Priority defaults to `Medium`, status to `Pending`, and due date to `null`. Send `null` or `""` to clear a due date. `PUT` requires the title and replaces editable fields; omitted optional fields reset to defaults, so send all current fields when toggling status. `id`, `user_id`, and timestamps are controlled by the server.

Names contain 1–80 characters; emails are normalized to lowercase. Passwords require at least 8 characters and at most 72 UTF-8 bytes because bcrypt limits its input by bytes.

Errors return `{ "message": "Readable explanation" }`: `400` invalid input/JSON/ID/filter, `401` missing/invalid/expired credentials, `403` disallowed CORS origin, `404` missing endpoint or task (including another user's task), `409` duplicate email, `413` oversized body, `500` unexpected server error.

## Test every API manually

With the backend running, use these Bash commands (or the same methods, headers, and JSON in Postman). No jq is needed.

```bash
BASE=http://localhost:5000/api
curl -i "$BASE/health"

curl -i -X POST "$BASE/auth/register" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Alex Morgan","email":"alex@example.com","password":"StudyTask123!"}'

LOGIN=$(curl -fsS -X POST "$BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"alex@example.com","password":"StudyTask123!"}')
TOKEN=$(printf '%s' "$LOGIN" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>console.log(JSON.parse(s).token))")

curl -i "$BASE/auth/me" -H "Authorization: Bearer $TOKEN"

CREATED=$(curl -fsS -X POST "$BASE/tasks" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Prepare demo","description":"Read the README","priority":"High","status":"Pending","due_date":"2026-12-15"}')
TASK_ID=$(printf '%s' "$CREATED" | node -e "let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>console.log(JSON.parse(s).task.id))")

curl -i "$BASE/tasks" -H "Authorization: Bearer $TOKEN"
curl -i "$BASE/tasks/$TASK_ID" -H "Authorization: Bearer $TOKEN"
curl -i -X PUT "$BASE/tasks/$TASK_ID" \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Demo prepared","description":"Ready to present","priority":"Medium","status":"Completed","due_date":null}'
curl -i "$BASE/tasks?status=Completed" -H "Authorization: Bearer $TOKEN"
curl -i -X DELETE "$BASE/tasks/$TASK_ID" -H "Authorization: Bearer $TOKEN"
```

Also try a missing token (401), wrong password (401), duplicate registration (409), empty title (400), invalid priority (400), impossible due date (400), and a second account trying the first account's task ID (404). Use a fresh email if repeating registration.

## Automated tests and production build

From the project root:

```bash
npm test --prefix backend
npm test --prefix frontend
npm run build --prefix frontend
```

The backend suite uses Node's built-in test runner, real HTTP requests, bcrypt, JWTs, and a temporary SQLite database. It covers validation, registration/login, safe profile responses, password hashing, task CRUD/filtering, owner isolation, invalid/expired tokens, CORS, and disk persistence. Test data is independent of your normal database. The frontend test uses Happy DOM and an esbuild bundle to run the actual React interface against a real temporary HTTP API and SQLite database. It exercises registration, create/edit, completion, filters, delete cancellation/confirmation, logout, and login. It needs both frontend and backend dependencies installed and does not require running dev servers. Happy DOM simulates the DOM; this is not a real-browser layout or accessibility test.

Preview the built frontend using `cd frontend` then `npm run preview -- --host 127.0.0.1`. Add its exact origin (`http://127.0.0.1:4173`) to `FRONTEND_URL` and restart the backend before testing API calls from that preview.

Manual UI checklist:

1. Register; confirm your name and empty dashboard.
2. Add a task with all fields, then one with only a title.
3. Edit the title, date, description, priority, and status; reload to confirm persistence.
4. Toggle completion and verify counts plus all three filters.
5. Cancel deletion, then confirm deletion.
6. Log out; confirm the dashboard is protected. Log in again.
7. Create a second user; confirm the first user's tasks never appear.
8. Resize to mobile width; check forms, dialogs, filters, and actions.
9. Stop the API; confirm a readable network error appears, then restart and retry.

## Upload to GitHub

Create an empty GitHub repository first. In this project folder:

```bash
git init
git add .
git status
# Confirm no .env, database, or node_modules files are staged.
git commit -m "Build Taskflow task management system"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/task-management-system.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your username. Authenticate with GitHub's supported Git credential flow. Commit both package lockfiles. No account, remote repository, or hosted deployment has been created by this source package.

## Deploy backend on Render

**SQLite needs persistent storage.** Render's default filesystem is ephemeral, so an ordinary free web service would lose the database on redeploy/restart. Use a paid web service with an attached persistent disk and keep the app to one instance. Only files under the disk mount survive. Disks are available at runtime, so initialization runs on startup rather than during the build.

1. Push this repository to GitHub.
2. In Render choose a new Blueprint and select the repository. The root `render.yaml` configures the Node service, build/start commands, disk, health check, and generated JWT secret. Review the paid plan before creating it.
3. Set `FRONTEND_URL` to your frontend's final HTTPS origin. You can update it after the frontend is deployed.
4. Verify `DATABASE_PATH=/var/data/tasks.sqlite`, with the disk mounted at `/var/data`.
5. Deploy and visit `https://YOUR_BACKEND.onrender.com/api/health`.

For manual service setup: root directory `backend`, runtime Node 24, build `npm ci`, start `npm start`, health `/api/health`, paid disk-capable plan; attach a 1 GB disk at `/var/data`. Set `JWT_SECRET` to a strong random value, `DATABASE_PATH` as above, and `FRONTEND_URL` exactly. Let Render supply `PORT`.

A disk prevents horizontal scaling and can cause brief deploy downtime. Arrange database-aware backups. For a free/ephemeral host or multiple backend instances, migrate to managed PostgreSQL; that requires replacing this SQLite driver and adapting schema/queries rather than merely changing `DATABASE_PATH`.

Official reference: [Render persistent disks](https://render.com/docs/disks), [Blueprint specification](https://render.com/docs/blueprint-spec).

## Deploy frontend on Vercel

1. Import the GitHub repository in Vercel.
2. Set **Root Directory** to `frontend` and select the Vite framework preset.
3. Use Node 24, install `npm ci`, build `npm run build`, output `dist`.
4. Set `VITE_API_URL=https://YOUR_BACKEND.onrender.com/api` for production (and preview, if needed).
5. Deploy. The included `frontend/vercel.json` provides the SPA fallback for direct `/login` and `/register` visits.
6. Set Render's `FRONTEND_URL` to the deployed frontend origin and redeploy/restart the backend.
7. Register, add a task, reload, edit, complete, delete, and log out on the hosted app. Open `/register` directly to test the rewrite.

Preview deployments have different origins. Explicitly allow each origin you intend to use; the backend does not accept arbitrary preview domains.

Official reference: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite).

## Deploy frontend on Netlify (alternative)

Import the repository. The root `netlify.toml` sets base `frontend`, build `npm run build`, output `dist`, Node 24, and a SPA redirect. Set `VITE_API_URL` to the Render API URL including `/api`, deploy, then add the Netlify HTTPS origin to Render's `FRONTEND_URL`. Rebuild when the API URL changes.

Official reference: [Vite on Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/vite/).

## Screenshots

No screenshots are bundled: this environment had no browser executable, and its browser download failed. Capture the login, dashboard, mobile view, and task form locally and save them under `docs/` for your submission. Use sample accounts and tasks only.

## Future improvements

- Pagination and optional sorting for larger task lists.
- Password reset, email verification, rate limits, and stronger session management.
- PostgreSQL migration with versioned migrations for a larger hosted deployment.
- Automated real-browser tests and component tests in CI.
- Accessibility review and additional keyboard shortcuts.

## Troubleshooting

- **Node SQLite import fails:** install Node 24, then reinstall dependencies with `npm ci`.
- **API cannot start:** check `JWT_SECRET` length, port availability, and write permissions for the database directory.
- **Login or tasks show a network error:** check backend health, `VITE_API_URL` (including `/api`), HTTPS on hosted URLs, and `FRONTEND_URL` CORS configuration.
- **Frontend route 404 after refresh:** confirm the platform's SPA rewrite file was picked up from the configured root.
- **Hosted tasks disappear:** verify that the SQLite file is inside the actual persistent disk mount.
- **JWT no longer works after a redeploy:** keep `JWT_SECRET` stable; changing it invalidates existing sessions. Sign in again.
