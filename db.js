const taskRepo = require("./repositories/taskRepository"),
    Database = require("better-sqlite3"),
    db = new Database("tasks.db");
db.pragma("journal_mode = WAL");
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0
  )
`);

const { count } = db.prepare("SELECT COUNT(*) AS count FROM tasks").get();
if (count === 0) taskRepo.fillTasks(db);

module.exports = db;

