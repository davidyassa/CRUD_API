const taskRepo = require("./repositories/taskRepository"),
  pgTaskRepo = require("./repositories/taskRepository.postgres"),
  express = require("express"),
  app = express(),
  swaggerUi = require("swagger-ui-express"),
  openApiDocument = require("./openai.json");
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

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/tasks", (req, res) => {
  const d = req.query.done !== undefined ? (req.query.done.toLowerCase() === "true") : undefined;
  res.json(taskRepo.getTasks({ done: d, search: req.query.search, sorted: req.query.sorted }));
});

app.get("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const task = taskRepo.getTaskById(id);

  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }
  res.json(task);
});

app.get("/stats", (req, res) => {
  const l = taskRepo.countTasks();
  const done = taskRepo.countTasks(true);
  const undone = taskRepo.countTasks(false);
  res.json({ "total": l, "completed": done, "remaining": undone });
});

// ---------- POST ----------

app.post("/tasks", (req, res) => {
  const title = req.body.title;
  if (!title) {
    return res.status(400).json({ error: `Title is empty` });
  }
  const taskExists = taskRepo.getTaskByTitle(title);

  if (taskExists) {
    return res.status(409).json({ error: `Task \`${title}\` already exists` });
  }
  const task = taskRepo.createTask(title);
  return res.status(201).json(task);
})

app.post("/reset", (req, res) => {
  taskRepo.resetTasks();
  res.status(200).json(taskRepo.getTasks());
});

// ---------- PUT ----------

app.put("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const { title, done } = req.body;
  if (done === undefined && (title === undefined || title.trim() === ""))
    return res.status(400).json({ error: `Request body must include a valid title or done status` });

  const updated = taskRepo.updateTask(id, { title, done });

  if (!updated) return res.status(404).json({ error: `Task ${id} not found` });
  return res.status(200).json(updated);
})

// ---------- DELETE ----------

app.delete("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);

  const deleted = taskRepo.deleteTask(id);
  if (!deleted) return res.status(404).json({ error: `Task ${id} not found` });

  return res.status(204).send(); // `.send()` to actually send the empty body
})

// ---------- ERROR HANDLING ----------

app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Invalid JSON in request body" });
  }
  next(err);
});

// ---------- FUNCTIONS ----------

async function start() {
  await pgTaskRepo.initDb();  // for postgres async db

  app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
  });
}

// ---------- SERVER START ----------

start();
