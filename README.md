# 📋 Task API

A CRUD API for managing a to-do list, built with Node.js and Express as part of the FlyRank Backend Internship.
Full Create, Read, Update, Delete on tasks, Supabase-backed authentication with protected routes, interactive Swagger docs, and two interchangeable storage backends — SQLite and containerized Postgres — running through a single, unified entry point. One `DATABASE_TYPE` setting decides which one runs; the routes, validation, and API behavior never change.

---

## 🧱 Tech stack

- **Node.js** + **Express 5** — server and routing (Express 5 auto-forwards async errors, no manual try/catch needed in routes)
- **@supabase/supabase-js** — Identity Provider: account storage, password hashing, JWT issuing and verification
- **better-sqlite3** — synchronous SQLite driver
- **pg** — PostgreSQL driver
- **redis** — Redis client, used for a real connectivity + health check (Postgres mode only)
- **swagger-ui-express** — interactive docs from a hand-written OpenAPI 3.0 spec (`openai.json`), including bearer-token auth
- **cors** — allows browser-based tools (e.g. Hoppscotch) to call the API from a different origin
- **Docker + Docker Compose** — containerized Postgres + Redis stack

---

## 🗂️ Project structure
```
├── index.js # single entry point — reads DATABASE_TYPE, wires the matching repo, builds the Supabase client, starts the app  
├── src/  
│ ├── app.js # Express app factory — mounts routes + middleware, backend-agnostic  
│ ├── errors.js # typed error classes (ValidationError, NotFoundError, ConflictError, UnauthorizedError)  
│ ├── clients/  
│ │ └── supabase.client.js # Supabase client, built from SUPABASE_URL / SUPABASE_KEY  
│ ├── middleware/  
│ │ ├── error-handler.js # central error → status code mapping  
│ │ └── auth-guard.js # reusable bearer-token guard — verifies via Supabase, attaches req.user  
│ ├── routes/  
│ │ ├── auth.routes.js # /auth/signup, /auth/login, /auth/logout, /public/info, /protected/profile  
│ │ ├── task.routes.js # /tasks routes — thin, delegate to services  
│ │ └── meta.routes.js # /, /health  
│ ├── services/  
│ │ ├── auth.service.js # signup, login, token verification, logout — wraps the Supabase SDK  
│ │ └── tasks.service.js # business logic — validation, duplicate checks, stats — shared by both backends  
│ ├── repositories/  
│ │ ├── taskRepository.js # SQLite data access  
│ │ └── taskRepository.postgres.js # Postgres data access — same function signatures  
│ └── db/  
│ ├── db.sqlite.js # SQLite connection, table creation, seeding  
│ ├── db.postgres.js # Postgres connection, table creation, seeding  
│ └── db.redis.js # Redis client, connection, ping  
├── Dockerfile # builds the Postgres app image  
├── compose.yaml # api + db + redis services, one-command startup  
├── tasks.db # SQLite file (gitignored)  
├── .env / .env.example # DATABASE_TYPE, PORT, Postgres credentials, Supabase URL + anon key  
├── openai.json # OpenAPI spec powering /docs, including the bearerAuth security scheme  
├── package.json  
└── README.md  
```

---

## 🚀 Quick start


```bash
git clone https://github.com/davidyassa/CRUD_API.git
cd CRUD_API
cp .env.example .env
```

### Set up Supabase (required — both backends use it for auth)

1. Create a free project at [supabase.com](https://supabase.com) — no card required.
2. In the Supabase Dashboard, go to **Project Settings → API** and copy your **Project URL** and **anon (public) key**. Never use the `service_role` key here — it bypasses all security.
3. Paste both into `.env`:
```
   SUPABASE_URL=your_project_url
   SUPABASE_KEY=your_anon_key
```
4. Go to **Authentication → Providers → Email** and turn **"Confirm email" off**. This is a local-development convenience so a fresh signup can log in immediately — in production this stays on.

### SQLite (no Docker needed)
**Requires:** [Node.js 18+](https://nodejs.org)
```bash
# in .env: DATABASE_TYPE=sqlite
npm install
npm start
```
`tasks.db` is created and seeded automatically on first run — no database setup needed. On startup the server logs `Supabase client initialized` once the auth client connects successfully.

### Postgres (Docker)
**Requires:** [Docker Desktop](https://www.docker.com/products/docker-desktop) running. No local Node.js install needed — the app runs entirely inside the container.
```bash
# in .env: DATABASE_TYPE=postgres
docker compose up
```
Compose builds the app image, starts Postgres + Redis, creates the `tasks` table, seeds it, and starts the API — all in one command.

Either way, the API runs on **http://localhost:3000** (set by `PORT` in `.env`) · Swagger docs at **http://localhost:3000/docs**.

**Switching backends:** change `DATABASE_TYPE` in `.env`, then restart with `npm start` (SQLite) or `docker compose up` (Postgres). Only one runs at a time — both use the same port. Auth works identically on both — Supabase is external to whichever storage backend is active.

**Confirm Postgres persistence:** create a task, then `docker compose down` followed by `docker compose up` again — the task is still there, because the named volume (`taskdata`) kept the data.

**(optional) Browsing the Postgres database directly:** connect a free GUI ([TablePlus](https://tableplus.com), [DBeaver](https://dbeaver.io), pgAdmin) with:
| Field    | Value                                      |
| -------- | ------------------------------------------ |
| Host     | `localhost`                                |
| Port     | `5432`                                     |
| User     | `postgres`                                 |
| Password | matches `POSTGRES_PASSWORD` in your `.env` |
| Database | matches `POSTGRES_DB` in your `.env`       |

---

## 🧪 Testing the API (no coding required)

### Option 1 — Swagger UI (built in, zero setup)
Open **http://localhost:3000/docs**. Routes are grouped under **Auth**, **Tasks**, and **Meta**. Endpoints with a padlock icon require a token:

1. `POST /auth/signup` → **Try it out**, register with any email/password → `201`.
2. `POST /auth/login` with the same credentials → `200`, copy the `access_token` from the response.
3. Click **Authorize** (top right), paste the raw token (no `Bearer ` prefix — Swagger adds that), click **Authorize**, close the dialog.
4. Any padlocked route (`GET /protected/profile`, `POST /auth/logout`) now works via **Try it out** without any manual header entry.

### Option 2 — Hoppscotch (a free API-testing tool)
1. Go to **[hoppscotch.io](https://hoppscotch.io)** — no install, no account needed.
   > If requests fail with a network/CORS error, install the [Hoppscotch browser extension](https://chromewebstore.google.com/detail/hoppscotch-browser-extension/amknoiejhlmhancpahfcfcfhllgkpbld) — this app already sends CORS headers, but some browser setups still need it for `localhost`.
2. Set the method dropdown to match the endpoint, paste the URL, e.g. `http://localhost:3000/tasks`.
3. For `POST`/`PUT`: click **Body** → **JSON**:
```json
   { "title": "Buy milk" }
```
4. For protected routes, click the **Authorization** tab, set type to **Bearer**, paste the `access_token` from `/auth/login`.
5. Click **Send**.

**Quick things to try:**
| Try this       | Method + URL                                      | Body / Auth                                         |
| -------------- | ------------------------------------------------- | --------------------------------------------------- |
| Sign up        | `POST` → `http://localhost:3000/auth/signup`      | `{ "email": "a@b.com", "password": "password123" }` |
| Log in         | `POST` → `http://localhost:3000/auth/login`       | `{ "email": "a@b.com", "password": "password123" }` |
| View profile   | `GET` → `http://localhost:3000/protected/profile` | Bearer token from login                             |
| List all tasks | `GET` → `http://localhost:3000/tasks`             | —                                                   |
| Get one task   | `GET` → `http://localhost:3000/tasks/1`           | —                                                   |
| Create a task  | `POST` → `http://localhost:3000/tasks`            | `{ "title": "Walk the dog" }`                       |
| Mark it done   | `PUT` → `http://localhost:3000/tasks/4`           | `{ "done": true }`                                  |
| Delete it      | `DELETE` → `http://localhost:3000/tasks/4`        | —                                                   |

---

## 📡 Endpoints

| Method | Path                 | Auth required | Description                                                                                                                                  |
| ------ | -------------------- | :-----------: | -------------------------------------------------------------------------------------------------------------------------------------------- |
| POST   | `/auth/signup`       |       —       | Create a new account via Supabase (`{ "email": "...", "password": "..." }`)                                                                  |
| POST   | `/auth/login`        |       —       | Authenticate and receive `access_token` + `refresh_token`                                                                                    |
| POST   | `/auth/logout`       |   ✅ Bearer    | End the current session                                                                                                                      |
| GET    | `/public/info`       |       —       | Open, unauthenticated info message                                                                                                           |
| GET    | `/protected/profile` |   ✅ Bearer    | Verified user profile (id, email, account created, last sign-in) — token checked against Supabase, not just presence                         |
| GET    | `/`                  |       —       | API description — name, active `database` type, available endpoints                                                                          |
| GET    | `/health`            |       —       | Reports API status; on Postgres also checks `db` (`SELECT 1`) and `redis` (`PING`) — `200`/`503`                                             |
| GET    | `/tasks`             |       —       | List all tasks — supports `?done=true\|false` and `?search=term`                                                                             |
| GET    | `/tasks/:id`         |       —       | Get a single task by id                                                                                                                      |
| GET    | `/stats`             |       —       | Task counts: `total`, `completed`, `remaining`                                                                                               |
| POST   | `/tasks`             |       —       | Create a task (`{ "title": "..." }`)                                                                                                         |
| POST   | `/reset`             |       —       | **SQLite only** — clears and reseeds the table                                                                                               |
| PUT    | `/tasks/:id`         |       —       | Update a task's `title` and/or `done`; if nothing actually changed, returns the task with an added `message: "no change"` field, still `200` |
| DELETE | `/tasks/:id`         |       —       | Delete a task                                                                                                                                |

Task routes are intentionally left open in this build — auth is scoped to the `/auth` and `/protected` routes as a standalone demonstration of the guard pattern, not yet applied project-wide.

### Status codes

| Code | Meaning                                                                     |
| ---- | --------------------------------------------------------------------------- |
| 200  | Successful read/update/login                                                |
| 201  | Task created / account created                                              |
| 204  | Task deleted or logout successful (empty body)                              |
| 400  | Invalid or missing input                                                    |
| 401  | Missing, malformed, invalid, or expired bearer token; bad login credentials |
| 404  | Task with that id doesn't exist                                             |
| 409  | A task with that title already exists (create/update)                       |
| 503  | `/health` reports a degraded dependency (Postgres mode)                     |

---

## 🏗️ Architecture

A layered structure keeps storage swappable without touching routes or business rules:

**`routes` → `services` → `repositories` / external providers**

- **Routes** (`src/routes/`) are thin — they parse the request and call a service, nothing more.
- **Services** own logic for their domain:
  - `tasks.service.js` — validation, duplicate-title checks, not-found handling, stats aggregation. Written **once**, shared by both backends via `TaskServices(repo)`, a factory that takes whichever repository `index.js` injects.
  - `auth.service.js` — wraps the Supabase SDK: `signUp`, `login`, `validateUser` (token verification via `supabase.auth.getUser`), `logout`. `AuthServices(supabase)` follows the same factory pattern as `TaskServices(repo)`.
- **Repositories** (`src/repositories/`) are pure data access — no validation, no rules — just run a query and return the result. `taskRepository.js` and `taskRepository.postgres.js` expose identical function signatures, so this is the *only* layer that changes between backends.
- **Auth guard** (`src/middleware/auth-guard.js`) — `requireAuth(authServices)` is a middleware factory: it extracts and verifies the `Authorization` header once, attaches the resolved user to `req.user`, and calls `next()`. Applied to `/protected/profile` and `/auth/logout` — adding auth to a new route is one extra argument (`router.get(path, guard, handler)`), no duplicated header-parsing logic.
- **Errors** (`src/errors.js` + `src/middleware/error-handler.js`) — typed error classes (`ValidationError`, `NotFoundError`, `ConflictError`, `UnauthorizedError`) thrown from any service, caught in one central place and mapped to status codes. Express 5 auto-forwards thrown/rejected errors from async route handlers, so no per-route try/catch is needed.

`index.js` is the only file that knows both storage backends exist: it reads `DATABASE_TYPE`, requires the matching repository and db connection, builds the Supabase client and `authServices`, and hands everything else to the same app factory.

**Auth trust model:** the server never sees or stores a password. `POST /auth/signup` and `POST /auth/login` forward credentials straight to Supabase; Supabase returns a signed JWT. Every later request presents that JWT in the `Authorization: Bearer <token>` header, and the guard asks Supabase to confirm it's genuine (`getUser`) rather than trusting it blindly — an expired or tampered token is rejected with `401` before the route handler ever runs.

**Postgres version note:** pinned to `postgres:16`, not the default `postgres` (18+) tag — the 18+ image changed its data-directory layout in a way that's incompatible with a simple single-mount volume, which caused a startup error on the newer default.

**Lean container image:** the Dockerfile only installs the packages the app actually needs (`express`, `pg`, `swagger-ui-express`, `dotenv`, `cors`, `redis`, `@supabase/supabase-js`) instead of the full `package.json` — this deliberately skips `better-sqlite3`, which needs native compilation tools not present in the lightweight `node:22-alpine` base image, and isn't needed in the Postgres container anyway.

**Secrets:** `DATABASE_URL` is never hardcoded — in Compose it's assembled from `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, and `PORT` env vars. `SUPABASE_URL` / `SUPABASE_KEY` follow the same rule. All of it lives in `.env` (gitignored; placeholder values committed to `.env.example`), and only the `anon` key is used — the `service_role` key, which bypasses security, never touches this codebase.

---

## 🖥️ Swagger UI

Routes grouped by tag (**Auth**, **Tasks**, **Meta**), padlock icons on `/protected/profile` and `/auth/logout`, Authorize dialog for pasting a bearer token once and reusing it across every locked route:

![Swagger UI screenshot](./docs/SwaggerUI.avif)

## 🔍 Database viewers

SQLite, via [DB Browser for SQLite](https://sqlitebrowser.org/dl/):

![Database viewer screenshot](./docs/DBBrowser.avif)

Postgres, via [TablePlus](https://tableplus.com/download/):

![TablePlus screenshot](./docs/TablePlusGUI.avif)

## 🩺 Health check in action

Healthy state (Postgres mode):
```json
{ "status": "ok", "db": "ok", "redis": "ok" }
```

Degraded state — Redis stopped (`docker compose stop redis`), API stays up but reports it:

![Health check with Redis down](./docs/disableRedis.avif)

## 🧪 Example SQL query

Run manually against the SQLite database in [DB Browser](https://sqlitebrowser.org/dl/):
```sql
DELETE FROM tasks WHERE done = 1;
```
Clears completed tasks — a direct, visible confirmation that manual database changes take effect immediately and are reflected the next time the API reads from it, with no code change required.

---

## ✨ Extras built beyond the core spec

- Query filtering — `GET /tasks?done=true` and `GET /tasks?search=milk` (combinable with `&`)
- Duplicate-title check (`409`) on both `POST /tasks` and `PUT /tasks/:id`
- No-op update detection on `PUT /tasks/:id` — flags when a request changes nothing
- Layered architecture (routes/services/repositories/errors) — one service and one set of routes shared by both backends
- Real `/health` check on Postgres — pings the database (`SELECT 1`) and Redis (`PING`) rather than returning a static `"ok"`; returns `503` if either dependency is down
- Redis added to the Docker Compose stack, connected on startup, included in the health check
- Single unified entry point (`index.js`) and shared `PORT` — switch backends via one `.env` value, no separate scripts or ports to remember
- Reusable auth guard middleware (`requireAuth`) — locking a new route down is a one-line change, not copy-pasted header parsing
- Swagger UI fully wired for bearer auth — tagged route groups, padlock icons, one-time Authorize flow, `persistAuthorization` so the token survives a page refresh

## ⚠️ Worth noting

- Auth currently covers only `/auth/*` and `/protected/*` as a standalone demonstration — the `/tasks` routes remain intentionally open in this build, not yet gated behind login.
- `POST /reset` is SQLite-only by design — the Postgres version exists specifically to demonstrate persistence, and a reset endpoint cuts against that story.
- SQLite is single-writer — fine at this scale, exactly why the Postgres version exists.
- Only one backend runs at a time; switching requires changing `DATABASE_TYPE` and restarting.
- "Confirm email" is turned off on the Supabase project for local-dev convenience — a production setup would leave it on.