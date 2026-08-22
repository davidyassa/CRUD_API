const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const CREATE_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS tasks (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    done BOOLEAN NOT NULL DEFAULT false
  );
`;

async function initDb() {
    await pool.query(CREATE_TABLE_SQL);

    const { rows } = await pool.query('SELECT COUNT(*) FROM tasks');
    const isEmpty = parseInt(rows[0].count) === 0;

    if (isEmpty) {
        await fillTasks();
        console.log("Seeded 3 example tasks");
    }
}

async function fillTasks() {
    const insert = "INSERT INTO tasks (title, done) VALUES ($1, $2)";
    await pool.query(insert, ["first", true]);
    await pool.query(insert, ["second", false]);
    await pool.query(insert, ["third", false]);
}

async function countTasks(done = undefined) {
    let query = "SELECT COUNT(*) AS count FROM tasks WHERE 1=1";
    const params = [];
    if (done !== undefined) {
        query += " AND done = $1";
        params.push(done);
    }
    const { rows } = await pool.query(query, params);
    return parseInt(rows[0].count);
}

module.exports = {
    pool,
    initDb,
    fillTasks,
    countTasks,
};