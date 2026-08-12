const db = require("../db");

/** Converts a raw SQLite row (done as 0/1) into API-shape JSON (done as boolean). */
function toApiShape(row) {
    return { ...row, done: Boolean(row.done) };
}

// ---------- GET ----------

function getAllTasks({ done, search } = {}) {
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

function fillTasks(db) {
    const insert = db.prepare("INSERT INTO tasks (title, done) VALUES (?, ?)");
    insert.run("first", 1);
    insert.run("second", 0);
    insert.run("third", 0);
}

module.exports = {
    getAllTasks,
    getTaskById,
    getTaskByTitle,
    createTask,
};