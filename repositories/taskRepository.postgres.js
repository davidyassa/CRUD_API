const dbpg = require("../db.postgres"),
    { pool } = dbpg;

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


// ---------- PUT ----------


// ---------- DELETE ----------


// ---------- START ----------


async function initDb() {
    return dbpg.initDb();
}

module.exports = {
    getTasks,
    getTaskByTitle,
    getTaskById,
    initDb,
};