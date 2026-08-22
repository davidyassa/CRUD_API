const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const openApiDocument = require("../openai.json");

const { TaskRoutes } = require("./routes/task.routes");
const { MetaRoutes } = require("./routes/meta.routes");
const { errorHandler } = require("./middleware/error-handler");

function createApp({ services, databaseType, taskRepo, pingRedis }) {
    const app = express();

    app.use(cors());
    app.use(express.json());

    app.use(
        "/docs",
        swaggerUi.serve,
        swaggerUi.setup(openApiDocument),
    );

    app.use(
        "/",
        TaskRoutes(services, { databaseType }),
    );

    app.use(
        "/",
        MetaRoutes({
            databaseType,
            taskRepo,
            pingRedis,
        }),
    );

    app.use(errorHandler);

    return app;
}

module.exports = { createApp };