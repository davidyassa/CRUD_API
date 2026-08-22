const express = require("express");

function MetaRoutes({ databaseType, taskRepo, pingRedis }) {
    const router = express.Router();

    router.get("/", (req, res) => {
        const endpoints = databaseType === "postgres" ?
            ["/tasks", "/stats"] :
            ["/tasks", "/stats", "/reset"];

        return res.json({
            name: "Task API",
            version: "4.0",
            database: databaseType,
            endpoints,
        });
    });

    router.get("/health", async (req, res) => {
        if (databaseType === "postgres") {
            const dbOk = await taskRepo.checkHealth();
            const redisOk = await pingRedis();
            const allOk = dbOk && redisOk;

            return res.status(allOk ? 200 : 503).json({
                status: allOk ? "ok" : "degraded",
                db: dbOk ? "ok" : "down",
                redis: redisOk ? "ok" : "down",
            });
        }

        return res.json({ status: "ok" });
    });

    return router;
}

module.exports = { MetaRoutes };