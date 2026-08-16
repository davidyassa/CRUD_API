const dbjs = require("../db"),
    db = dbjs.db;

/** Converts a raw SQLite row (done as 0/1) into API-shape JSON (done as boolean). */
function toApiShape(row) {
    return { ...row, done: Boolean(row.done) };
}

// ---------- GET ----------

function getTasks({ done, search, sorted } = {}) {
    let query = "SELECT * FROM tasks WHERE 1=1"; // `WHERE 1=1` to help later build dynamic query
    const params = [];

    if (done !== undefined) {
        params.push(done ? 1 : 0);
        query += " AND done = ?";
    }

    if (typeof search === "string" && search.trim() !== "") {
        params.push(`%${search.toLowerCase()}%`);
        query += " AND LOWER(title) LIKE ?";
    }

    if (sorted !== undefined && Boolean(sorted.toLowerCase()) === true) {
        query += " ORDER BY title";
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
        .run(title.toLowerCase(), done ? 1 : 0);
    return getTaskById(result.lastInsertRowid);
}

function resetTasks() {
    db.prepare("DELETE FROM tasks").run();
    dbjs.fillTasks();
}

// ---------- PUT ----------


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

// ---------- DELETE ----------

function deleteTask(id) {
    const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
    return result.changes > 0; // true if something changed in the table
}


// ---------- FUNCTIONS ----------
function countTasks(done = undefined) {
    return dbjs.countTasks(done); // avoid accessing db from server
}



module.exports = {
    getTasks,
    getTaskByTitle,
    getTaskById,
    createTask,
    updateTask,
    deleteTask,
    resetTasks,
    countTasks,
};