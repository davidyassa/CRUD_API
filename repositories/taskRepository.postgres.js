const { pool, initDb } = require("../db.postgres");

// ---------- GET ----------

async function getTasks({ done, search, sorted } = {}) {
    let query = "SELECT * FROM tasks WHERE 1=1"; // `WHERE 1=1` to help later build dynamic query
    const params = [];

    if (done !== undefined) {
        params.push(done);
        query += ` AND done = $${params.length}`;   // postgres placeholders: `$1, $2, etc.`
    }

    if (typeof search === "string" && search.trim() !== "") {
        params.push(`%${search.toLowerCase()}%`);
        query += ` AND LOWER(title) LIKE $${params.length}`;
    }

    if (sorted !== undefined && Boolean(sorted.toLowerCase()) === true) {
        query += " ORDER BY title";
    }

    const { rows } = await pool.query(query, params);
    return rows; // Postgres BOOLEAN returns real true/false — no toApiShape() conversion needed
}

async function getTaskByTitle(title) {
    const { rows } = await pool.query("SELECT * FROM tasks WHERE title = $1", [title]);
    return rows[0];
}

async function getTaskById(id) {
    const { rows } = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
    return rows[0]; // returns undefined if not found
}

// ---------- POST ----------

async function createTask(title, done = false) {
    const result = await pool.query("INSERT INTO tasks (title, done) VALUES ($1, $2) RETURNING *", [title, done]);
    return result.rows[0];
}

// ---------- PUT ----------

async function updateTask(id, { title, done } = {}) {
    const { rows } = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
    const existing = rows[0];
    if (!existing) return undefined;

    const newTitle = title ?? existing.title; // `??` default value if null
    const duplicate = await getTaskByTitle(newTitle);
    if (duplicate && duplicate.id !== id) return undefined;

    const newDone = done !== undefined ? done : existing.done; // keep `done` as booleanl; same as Postgres column

    await pool.query("UPDATE tasks SET title = $1, done = $2 WHERE id = $3", [newTitle, newDone, id]);
    return await getTaskById(id);
}

// ---------- DELETE ----------

async function deleteTask(id) {
    const result = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
    return result.rowCount > 0; // returns deleted rowCount
}


module.exports = {
    getTasks,
    getTaskByTitle,
    getTaskById,
    initDb,
    createTask,
    updateTask,
    deleteTask,
};