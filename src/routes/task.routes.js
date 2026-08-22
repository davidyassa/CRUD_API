const express = require("express");

function TaskRoutes(services, { databaseType }) {
    const router = express.Router();

    // ---------- GET ----------

    router.get("/tasks", async (req, res) => {
        const done = req.query.done !== undefined ? req.query.done.toLowerCase() === "true" : undefined;

        const tasks = await services.getAllTasks({
            done,
            search: req.query.search,
            sorted: req.query.sorted,
        });

        return res.json(tasks);
    });

    router.get("/tasks/:id", async (req, res) => {
        const id = Number(req.params.id);
        return res.json(await services.getTask({ id }));
    });

    router.get("/stats", async (req, res) => {
        return res.json(await services.getStats());
    });

    // ---------- POST ----------

    router.post("/tasks", async (req, res) => {
        const task = await services.createTask(req.body.title);
        return res.status(201).json(task);
    });

    if (databaseType === "sqlite") {
        router.post("/reset", async (req, res) => {
            return res.status(200).json(await services.resetTasks());
        });
    }

    // ---------- PUT ----------

    router.put("/tasks/:id", async (req, res) => {
        const id = Number(req.params.id);
        const { title, done } = req.body;

        const task = await services.updateTask(id, { title, done });
        return res.status(200).json(task);
    });

    // ---------- DELETE ----------

    router.delete("/tasks/:id", async (req, res) => {
        const id = Number(req.params.id);
        await services.deleteTask(id);

        return res.status(204).send();
    });


    return router;
}

module.exports = { TaskRoutes };