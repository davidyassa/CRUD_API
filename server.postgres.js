const { connectRedis, pingRedis } = require("./db.redis"),
  { errorHandler } = require("./src/middleware/error-handler");
const { ValidationError, ConflictError, NotFoundError } = require("./src/errors");

const taskRepo = require("./repositories/taskRepository.postgres"),
  express = require("express"),
  cors = require('cors'),
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

  const tasks = await taskRepo.getTasks({ done: d, search: req.query.search, sorted: req.query.sorted });
  res.json(tasks);

});

app.get("/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);

  const task = await taskRepo.getTaskById(id);
  if (!task) {
    throw new NotFoundError(`Task ${id} not found`);
  }
  res.json(task);

});

app.get("/stats", async (req, res) => {

  const total = await taskRepo.countTasks();
  const done = await taskRepo.countTasks(true);
  const remaining = await taskRepo.countTasks(false);
  res.json({ total, completed: done, remaining });

});

// ---------- POST ----------

app.post("/tasks", async (req, res) => {
  const title = req.body.title;
  if (!title) {
    throw new ValidationError(`Title is empty`);
  }
  const taskExists = await taskRepo.getTaskByTitle(title);

  if (taskExists) {
    throw new ConflictError(`Task \`${title}\` already exists`);
  }
  const task = await taskRepo.createTask(title);
  return res.status(201).json(task);
});

// ---------- PUT ----------

app.put("/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);
  const { title, done } = req.body;
  if (done === undefined && (title === undefined || title.trim() === ""))
    throw new ValidationError(`Request body must include a valid title or done status`);

  const updated = await taskRepo.updateTask(id, { title, done });

  if (!updated) throw new NotFoundError(`Task ${id} not found`);
  return res.status(200).json(updated);
});

// ---------- DELETE ----------

app.delete("/tasks/:id", async (req, res) => {
  const id = Number(req.params.id);

  const deleted = await taskRepo.deleteTask(id);
  if (!deleted) throw new NotFoundError(`Task ${id} not found`);

  return res.status(204).send(); // `.send()` to actually send the empty body
});

// ---------- ERROR HANDLING ----------

app.use(errorHandler);  // this catches all unexpected errors

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

