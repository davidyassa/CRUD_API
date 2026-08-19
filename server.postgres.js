const { connectRedis, pingRedis } = require("./db.redis"),
  { errorHandler } = require("./src/middleware/error-handler");

const express = require("express"),
  cors = require('cors'),
  taskRepo = require("./src/repositories/taskRepository.postgres"),
  services = require("./src/services/tasks.service").TaskServices(taskRepo),
  app = express(),
  swaggerUi = require("swagger-ui-express"),
  openApiDocument = require("./openai.json");
app.use(cors());
app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

// ---------- GET ----------

app.get("/", (req, res) => {
  res.json({
    name: "Task API",
    version: "3.0",
    endpoints: ["/tasks"],
  });
});

app.get("/health", async (req, res) => {
  const dbOk = await taskRepo.checkHealth();
  const redisOk = await pingRedis();
  const allOk = dbOk && redisOk;
  res.status(allOk ? 200 : 503).json({
    status: allOk ? "ok" : "degraded",
    db: dbOk ? "ok" : "down",
    redis: redisOk ? "ok" : "down",
  });
});

app.get("/tasks", async (req, res) => {
  const d = req.query.done !== undefined ? (req.query.done.toLowerCase() === "true") : undefined;
  res.json(await services.getAllTasks({ done: d, search: req.query.search, sorted: req.query.sorted }));

});

app.get("/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  res.json(await services.getTask({ id }));
});

app.get("/stats", async (req, res) => {
  const stats = await services.getStats();
  res.json(stats);
});

// ---------- POST ----------

app.post("/tasks", async (req, res) => {
  const title = req.body.title;
  return res.status(201).json(await services.createTask(title));
});

// ---------- PUT ----------

app.put("/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { title, done } = req.body;

  return res.status(200).json(await services.updateTask(id, { title, done }));
});

// ---------- DELETE ----------

app.delete("/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  const deleted = await services.deleteTask(id);

  return res.status(204).send(); // `.send()` to actually send the empty body
});

// ---------- ERROR HANDLING ----------

app.use(errorHandler);  // this catches all errors

// ---------- SERVER START ----------

async function start() {
  await taskRepo.initDb();
  await connectRedis();

  const redisOk = await pingRedis();  // extended health check to include redis
  console.log(`Redis connection: ${redisOk ? 'OK' : 'FAILED'}`);

  const port = process.env.PORT ?? 3000;
  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

start();

