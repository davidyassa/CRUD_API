const db = require("../db");

/** Converts a raw SQLite row (done as 0/1) into API-shape JSON (done as boolean). */
function toApiShape(row) {
    return { ...row, done: Boolean(row.done) };
}

// ---------- GET ----------

function getTasks({ done, search } = {}) {
    let query = "SELECT * FROM tasks WHERE 1=1"; // `WHERE 1=1` to help later build dynamic query
    const params = [];

    if (done !== undefined) {
        query += " AND done = ?";
        params.push(done ? 1 : 0);
    }
    if (search !== undefined && search.trim() !== "") {
        query += " AND LOWER(title) LIKE ?";
        params.push(`%${search.toLowerCase()}%`);
    }

    return db.prepare(query).all(...params).map(toApiShape);
}

function getTaskByTitle(title) {
    const row = db.prepare("SELECT * FROM tasks WHERE title = ?").get(title);
    return row ? toApiShape(row) : undefined;
}

function getTaskById(id) {
    const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    return row ? toApiShape(row) : undefined;
}

// ---------- POST ----------

function createTask(title, done = false) {
    const result = db
        .prepare("INSERT INTO tasks (title, done) VALUES (?, ?)")
        .run(title, done ? 1 : 0);
    return getTaskById(result.lastInsertRowid);
}

function updateTask(id, { title, done } = {}) {
    const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    if (!existing) return undefined;

    const newTitle = title ?? existing.title; // `??` default value if null
    const newDone = done !== undefined ? (done ? 1 : 0) : existing.done;

    db.prepare("UPDATE tasks SET title = ?, done = ? WHERE id = ?").run(
        newTitle,
        newDone,
        id
    );
    return getTaskById(id);
}

function deleteTask(id) {
    const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
    return result.changes > 0; // true if something changed in the table
}
function fillTasks(db) {
    const insert = db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)");
    insert.run("first", 1);
    insert.run("second", 0);
    insert.run("third", 0);
}

module.exports = {
    getTasks,
    getTaskById,
    getTaskByTitle,
    createTask,
    updateTask,
    deleteTask,
};