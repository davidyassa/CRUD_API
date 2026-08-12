const Database = require("better-sqlite3"),
  db = new Database("tasks.db");
db.pragma("journal_mode = WAL"); // for better concurrency and safer writes
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0
  )
`);

const { count } = db.prepare("SELECT COUNT(*) AS count FROM tasks").get();
if (count === 0) fillTasks();

function fillTasks() {
  const insert = db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)");
  insert.run("first", 1);
  insert.run("second", 0);
  insert.run("third", 0);
}

module.exports = {
  db,
}

