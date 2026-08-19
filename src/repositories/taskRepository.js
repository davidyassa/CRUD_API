const { db, countTasks, fillTasks } = require("../../db");

// Converts a raw SQLite row (done as 0/1) into API-shape JSON (done as boolean).
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

    if (sorted?.toLowerCase() === "true") { // `sorted?.` "optional chaining" returns undefined instead of error if sorted === undefined
        query += " ORDER BY title";
    }
    else {
        query += " ORDER BY id";
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
    const newTitle = title.toLowerCase();
    const result = db
        .prepare("INSERT INTO tasks (title, done) VALUES (?, ?)")
        .run(newTitle, done ? 1 : 0);
    return getTaskByTitle(newTitle);
}

function resetTasks() {
    db.prepare("DELETE FROM tasks").run();
    fillTasks();
}

// ---------- PUT ----------

function updateTask(id, { newTitle, done } = {}) {
    const newDone = done ? 1 : 0;

    db.prepare("UPDATE tasks SET title = ?, done = ? WHERE id = ?").run(newTitle, newDone, id);
    return getTaskById(id);
}

// ---------- DELETE ----------

function deleteTask(id) {
    const result = db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
    return result.changes > 0; // true if something changed in the table
}

module.exports = {
    getTasks,
    getTaskByTitle,
    getTaskById,
    resetTasks,
    createTask,
    updateTask,
    deleteTask,
    countTasks,
};