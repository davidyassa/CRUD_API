const db = require("../db");

/** Converts a raw SQLite row (done as 0/1) into API-shape JSON (done as boolean). */
function toApiShape(row) {
    return { ...row, done: Boolean(row.done) };
}

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

function getTaskById(id) {
    const row = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    return row ? toApiShape(row) : undefined;
}

module.exports = {
    getAllTasks,
    getTaskById,
};