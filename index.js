require("dotenv").config();
const { supabase } = require("./src/clients/supabase.client");
const { createApp } = require("./src/app");
const { TaskServices } = require("./src/services/tasks.service");
const { AuthServices } = require("./src/services/auth.service");

const databaseType = (
    process.env.DATABASE_TYPE ?? "postgres"
).toLowerCase();

async function start() {
    let taskRepo;
    let pingRedis;

    if (databaseType === "postgres") {
        taskRepo = require("./src/repositories/taskRepository.postgres");

        const redis = require("./src/db/db.redis");

        await taskRepo.initDb();
        await redis.connectRedis();

        pingRedis = redis.pingRedis;

        const redisOk = await pingRedis();
        console.log(`Redis connection: ${redisOk ? "OK" : "FAILED"}`);
    } else if (databaseType === "sqlite") {
        taskRepo = require("./src/repositories/taskRepository");
    } else {
        throw new Error(
            `Invalid DATABASE_TYPE: ${databaseType}`,
        );
    }

    const services = TaskServices(taskRepo);
    const authServices = AuthServices(supabase);

    const app = createApp({
        services,
        authServices,
        databaseType,
        taskRepo,
        pingRedis,
    });

    const port = process.env.PORT ?? 3000;

    app.listen(port, () => {
        console.log(
            `Server running with ${databaseType} on http://localhost:${port}`,
        );
        if (supabase) console.log("Supabase client initialized");
    });
}

start().catch((error) => {
    console.error("Server startup failed:", error);
    process.exit(1);
});