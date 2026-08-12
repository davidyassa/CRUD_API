# Task API

A CRUD API for managing a to-do list, built with Node.js and Express as part of the FlyRank Backend Internship (Week 2–3, Assignments A1 and A2).

Supports full Create, Read, Update, and Delete on tasks, interactive documentation via Swagger UI, and a couple of stretch extras (filtering, search). Data is now persisted in a SQLite database — tasks survive server restarts.

#### 🚀 Built as part of the FlyRank Backend Internship (Week 2–3, Assignments A1 & A2).

## Tech stack

- **Node.js** + **Express** — server and routing
- **better-sqlite3** — synchronous SQLite driver; tasks are stored in `tasks.db`
- **swagger-ui-express** — interactive API docs, served from a hand-written OpenAPI 3.0 spec (`openai.json`)

## Why SQLite

SQLite was the required lane for this assignment, and it's a natural fit for a small local project like this one: no separate database server to install or run, the entire database lives in a single file (`tasks.db`) that's created automatically on first run, and `better-sqlite3` provides a synchronous API that's simple to reason about for straightforward CRUD — no connection pooling or async query juggling needed at this scale. The trade-off is that SQLite isn't built for concurrent multi-writer workloads, which is fine here but is exactly why later weeks move to Postgres.

## Where the database lives

- File: `tasks.db`, created in the project root the first time the server runs.
- Table: `tasks` (`id` INTEGER PRIMARY KEY AUTOINCREMENT, `title` TEXT, `done` INTEGER).
- Connection setup, table creation, and first-run seeding all happen in `db.js`.
- `tasks.db` is **not** committed to git — see `.gitignore`. Deleting the file and restarting the server will recreate it empty and reseed the three example tasks.

## Prerequisites

You need **Node.js 18 or later** (npm comes bundled with it). Check if you already have it:

```bash
node --version
npm --version
```

If either command fails, install Node from [nodejs.org](https://nodejs.org) (choose the LTS version) — the installer includes npm automatically. No API keys or environment variables are needed for this project; the SQLite database file is created automatically.

## Install & run

```bash
# 1. Clone the repo and enter the folder
git clone https://github.com/davidyassa/CRUD_API.git
cd CRUD_API

# 2. Install dependencies (reads package.json + package-lock.json,
#    installs exact locked versions into node_modules/)
npm install

# 3. Start the server
node server.js
```

You should see:
```txt
Server running on http://localhost:3000
```
On first run, `tasks.db` is created automatically in the project root, with the `tasks` table and three seed tasks. On every subsequent run, your existing data loads as-is — nothing is reseeded unless the table is empty.

The server is now running on **http://localhost:3000**. Interactive docs are available at **http://localhost:3000/docs**.

> Leave this terminal running. Open a **second** terminal to send requests (curl examples below) or use the Swagger UI in your browser.

## Endpoints

| Method | Path         | Description                                                                    |
| ------ | ------------ | ------------------------------------------------------------------------------ |
| GET    | `/`          | API description                                                                |
| GET    | `/health`    | Liveness check                                                                 |
| GET    | `/tasks`     | List all tasks — supports `?done=true\|false` and `?search=term` query filters |
| GET    | `/tasks/:id` | Get a single task by id                                                        |
| POST   | `/tasks`     | Create a task (`{ "title": "..." }` in body)                                   |
| PUT    | `/tasks/:id` | Update a task's `title` and/or `done`                                          |
| DELETE | `/tasks/:id` | Delete a task                                                                  |

> **Temporarily disabled during the SQLite migration:** `GET /stats` and `POST /reset` are commented out in `server.js` pending re-implementation against the database (tracked for a later stage) — they are not currently live endpoints.

### Status codes

| Code | Meaning                                                     |
| ---- | ----------------------------------------------------------- |
| 200  | Successful read/update                                      |
| 201  | Task created                                                |
| 204  | Task deleted (empty body)                                   |
| 400  | Invalid or missing input (e.g. empty title, malformed JSON) |
| 404  | Task with that id doesn't exist                             |
| 409  | A task with that title already exists                       |

## Example request
```powershell
>> curl.exe -i -X POST http://localhost:3000/tasks -H "Content-Type: application/json" --% -d "{\"title\":\"Buy milk\"}"
HTTP/1.1 201 Created
X-Powered-By: Express                                                                            
Content-Type: application/json; charset=utf-8
Content-Length: 40
ETag: W/"28-PpSBYV7i68cXyGc7AhjVpkZkY5Q"
Date: Wed, 12 Aug 2026 14:03:41 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"id":4,"title":"Buy milk","done":false}
```

## Swagger UI

Full interactive documentation, including request/response schemas and a "Try it out" panel for every endpoint, is available at `/docs` once the server is running.

![Swagger UI screenshot](./docs/SwaggerUI.avif)

*(Screenshot: paste your `/docs` capture into a `docs/` folder in the repo and update the path above, or drag the image directly into this README on GitHub.)*

## Database viewer

Screenshot of `tasks.db` opened in DB Browser for SQLite, showing the `tasks` table:

![Database viewer screenshot](./docs/DBBrowser.avif)

*(Screenshot: paste your DB Browser capture into `docs/` and update the path above.)*

## Example SQL query

While exploring the database manually in DB Browser for SQLite (Stage 4), I ran:

```sql
DELETE FROM tasks WHERE done = 1;
```

This deletes every row where `done` is `1` (completed tasks). Running it against my seeded/test data cleared out the completed rows — a direct, visible confirmation that manual database changes take effect immediately and are reflected the next time the API reads from it (`GET /tasks` returned fewer rows afterward, with no code change required on the server).

This is the same query pattern the app itself could expose as a "clear completed" endpoint later — the SQL is trivial, only the wiring (a route calling this statement) would need to be added.

## Extras built beyond the core spec

- **Query filtering** — `GET /tasks?done=true` and `GET /tasks?search=milk` (combinable)
- **Duplicate-title check (409)** on `POST /tasks`

## Known limitations

- `GET /stats` and `POST /reset` are currently disabled — they still reference the old in-memory array and haven't been ported to SQLite yet.
- No authentication — this is a local development API, not production-hardened.
- Port `3000` is hardcoded rather than read from an environment variable.
- SQLite is a single-file, single-writer database — fine for this project's scale, not intended for concurrent production traffic. Postgres migration is planned for a later assignment (A3).

## Project structure
```
.
├── server.js # Express app — routes and request handling
├── db.js # SQLite connection, table creation, first-run seeding
├── repositories/
│ └── taskRepository.js # All SQL queries — the data-access layer
├── tasks.db # SQLite database file (gitignored)
├── openai.json # OpenAPI 3.0 spec powering Swagger UI at /docs
├── package.json
└── README.md
```