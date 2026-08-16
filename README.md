# 📋 Task API

A CRUD API for managing a to-do list, built with Node.js and Express as part of the FlyRank Backend Internship (Weeks 2–3, Assignments A1–A3).

Full Create, Read, Update, Delete on tasks, interactive Swagger docs, and three storage backends built side by side to prove the same API works unchanged across them: **in-memory (A1) → SQLite (A2) → containerized Postgres (A3)**.

---

## 🧱 Tech stack

- **Node.js** + **Express** — server and routing
- **better-sqlite3** — synchronous SQLite driver (`tasks.db`)
- **pg** — PostgreSQL driver for the containerized version
- **swagger-ui-express** — interactive docs from a hand-written OpenAPI 3.0 spec (`openai.json`)
- **cors** — allows browser-based tools (e.g. Hoppscotch) to call the API from a different origin
- **Docker + Docker Compose** — containerized Postgres stack

---

## 🗂️ Project structure
├── server.js # SQLite app (port 3001)  
├── server.postgres.js # Postgres app (port 3000, containerized)     
├── db.js # SQLite connection, table creation, seeding    
├── db.postgres.js # Postgres connection, table creation, seeding    
├── repositories/    
│ ├── taskRepository.js # SQLite queries    
│ └── taskRepository.postgres.js # Postgres queries — same function signatures    
├── Dockerfile # Builds the Postgres app image    
├── compose.yaml # api + db services, one-command startup    
├── tasks.db # SQLite file (gitignored)    
├── .env / .env.example # DATABASE_URL, PORT, Postgres credentials    
├── openai.json # OpenAPI spec powering /docs    
├── package.json    
└── README.md     
---

## 🚀 Quick start — SQLite version

**Requires:** [Node.js 18+](https://nodejs.org) installed on your machine (npm comes bundled).

```bash
git clone https://github.com/davidyassa/CRUD_API.git
cd CRUD_API
npm install
node server.js
```
Runs on **http://localhost:3001** · Swagger docs at **http://localhost:3001/docs**. `tasks.db` is created and seeded automatically on first run — no database setup needed.

---

## 🐋 Quick start — Postgres version (Docker)

**Requires:** [Docker Desktop](https://www.docker.com/products/docker-desktop) running. No local Node.js install needed — the app runs entirely inside the container.

```bash
git clone https://github.com/davidyassa/CRUD_API.git
cd CRUD_API
cp .env.example .env
docker compose up
```
Compose builds the app image, starts Postgres, creates the `tasks` table, seeds it, and starts the API — all in one command.

Runs on **http://localhost:3000** · Swagger docs at **http://localhost:3000/docs**

**Confirm persistence:** create a task, then `docker compose down` followed by `docker compose up` again — the task is still there, because the named volume (`taskdata`) kept the data.

**(optional) Browsing the database directly:** connect a free Postgres GUI ([TablePlus](https://tableplus.com), [DBeaver](https://dbeaver.io), pgAdmin) with:
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
Open **http://localhost:3001/docs** (SQLite) or **http://localhost:3000/docs** (Postgres) in your browser. Click any endpoint to expand it, hit **"Try it out"**, fill in the fields, click **"Execute"**.

### Option 2 — Hoppscotch (a free API-testing tool)
1. Go to **[hoppscotch.io](https://hoppscotch.io)** — no install, no account needed.
   > If requests fail with a network/CORS error, install the [Hoppscotch browser extension](https://chromewebstore.google.com/detail/hoppscotch-browser-extension/amknoiejhlmhancpahfcfcfhllgkpbld) — this app already sends CORS headers, but some browser setups still need it for `localhost`.
2. Set the method dropdown (top-left) to match the endpoint.
3. Paste the full URL, e.g. `http://localhost:3000/tasks`.
4. For `POST`/`PUT` requests: click the **Body** tab, select **JSON**:
```json
   { "title": "Buy milk" }
```
5. Click **Send**. The response, status code, and timing appear below.

**Quick things to try:**
| Try this       | Method + URL                               | Body                          |
| -------------- | ------------------------------------------ | ----------------------------- |
| List all tasks | `GET` → `http://localhost:3000/tasks`      | —                             |
| Get one task   | `GET` → `http://localhost:3000/tasks/1`    | —                             |
| Create a task  | `POST` → `http://localhost:3000/tasks`     | `{ "title": "Walk the dog" }` |
| Mark it done   | `PUT` → `http://localhost:3000/tasks/4`    | `{ "done": true }`            |
| Delete it      | `DELETE` → `http://localhost:3000/tasks/4` | —                             |

(Swap port `3000` for `3001` to test the SQLite version instead.)

---

## 📡 Endpoints

| Method | Path         | Description                                                      |
| ------ | ------------ | ---------------------------------------------------------------- |
| GET    | `/`          | API description                                                  |
| GET    | `/health`    | Liveness check                                                   |
| GET    | `/tasks`     | List all tasks — supports `?done=true\|false` and `?search=term` |
| GET    | `/tasks/:id` | Get a single task by id                                          |
| POST   | `/tasks`     | Create a task (`{ "title": "..." }`)                             |
| PUT    | `/tasks/:id` | Update a task's `title` and/or `done`                            |
| DELETE | `/tasks/:id` | Delete a task                                                    |

> **Version differences:** `POST /reset` exists only on the SQLite version (`server.js`) — it wasn't ported to Postgres by design (see Known limitations). `GET /stats` is implemented on both versions.  

### Status codes

| Code | Meaning                                               |
| ---- | ----------------------------------------------------- |
| 200  | Successful read/update                                |
| 201  | Task created                                          |
| 204  | Task deleted (empty body)                             |
| 400  | Invalid or missing input                              |
| 404  | Task with that id doesn't exist                       |
| 409  | A task with that title already exists (create/update) |

### Example request
```powershell
>> curl.exe -i -X POST http://localhost:3000/tasks -H "Content-Type: application/json" --% -d "{\"title\":\"Buy milk\"}"
HTTP/1.1 201 Created
Content-Type: application/json; charset=utf-8

{"id":4,"title":"Buy milk","done":false}
```

---

## 🗄️ Why three storage backends

- **In-memory (A1)** — fastest to build, gone on every restart.
- **SQLite (A2)** — a single-file database (`tasks.db`), no server to install, synchronous driver (`better-sqlite3`), simple to reason about. Not built for concurrent multi-writer workloads.
- **Postgres in Docker (A3)** — a real database server, the kind that powers production backends. `docker compose up` starts app + database together with one command; data persists in a named volume across restarts.

Both live apps share the same repository pattern: `taskRepository.js` and `taskRepository.postgres.js` expose identical function names and signatures, so **only the repository changes — routes never do**. That's the architecture proving itself.

**Postgres version note:** pinned to `postgres:16`, not the default `postgres` (18+) tag — the 18+ image changed its data-directory layout in a way that's incompatible with a simple single-mount volume, which caused a startup error on the newer default.

**Lean container image:** the Dockerfile only installs the packages `server.postgres.js` actually needs (`express`, `pg`, `swagger-ui-express`, `dotenv`, `cors`) instead of the full `package.json` — this deliberately skips `better-sqlite3`, which needs native compilation tools not present in the lightweight `node:22-alpine` base image, and isn't needed for the Postgres path anyway.

**Secrets:** `DATABASE_URL` is never hardcoded — in Compose it's assembled from `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, and `PORT` env vars (`.env`, gitignored; placeholder values committed to `.env.example`).

---

## 🖥️ Swagger UI

![Swagger UI screenshot](./docs/SwaggerUI.avif)

## 🔍 Database viewers

SQLite, via DB Browser for SQLite:

![Database viewer screenshot](./docs/DBBrowser.avif)

Postgres, via TablePlus:

![TablePlus screenshot](./docs/TablePlusGUI.avif)

## 🧪 Example SQL query

Run manually against the SQLite database in DB Browser (Stage 4, A2):
```sql
DELETE FROM tasks WHERE done = 1;
```
Clears completed tasks — a direct, visible confirmation that manual database changes take effect immediately and are reflected the next time the API reads from it, with no code change required.

---

## ✨ Extras built beyond the core spec

- Query filtering — `GET /tasks?done=true` and `GET /tasks?search=milk` (combinable)
- Duplicate-title check (`409`) on both `POST /tasks` and `PUT /tasks/:id`
- Postgres version fully containerized with Docker Compose, configurable port via `.env`
- CORS enabled so the API can be tested directly from browser-based tools like Hoppscotch

## ⚠️ Worth Noting

- No authentication — local development APIs, not production-hardened.
- `POST /reset` exists only on the SQLite version; not implemented for Postgres by choice — the Postgres version is meant to demonstrate persistence, and a reset endpoint cuts against that.
- SQLite is single-writer — fine at this scale, exactly why the Postgres version exists.
