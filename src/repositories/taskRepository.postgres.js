const { pool, initDb, countTasks } = require("../db/db.postgres");

// ---------- GET ----------

async function checkHealth() {
    try {
        await pool.query("SELECT 1");
        return true;
    } catch (err) {
        console.error("DB health check failed:", err);
        return false;
    }
}

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

    if (sorted?.toLowerCase() === "true") { // `sorted?.` "optional chaining" returns undefined instead of error if sorted === undefined
        query += " ORDER BY title";
    }
    else {
        query += " ORDER BY id";
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

async function updateTask(id, { newTitle, done } = {}) {

    await pool.query("UPDATE tasks SET title = $1, done = $2 WHERE id = $3", [newTitle, done, id]);
    return await getTaskById(id);
}

// ---------- DELETE ----------

async function deleteTask(id) {
    const result = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
    return result.rowCount > 0; // returns deleted rowCount
}


module.exports = {
    checkHealth,
    getTasks,
    getTaskByTitle,
    getTaskById,
    initDb,
    createTask,
    updateTask,
    deleteTask,
    countTasks,
};