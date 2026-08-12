const taskRepo = require("./repositories/taskRepository"),
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

  res.json(taskRepo.getTasks({ done: d, search: req.query.search }));
});

app.get("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const task = taskRepo.getTaskById(id);

  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  res.json(task);
});

// `/stats` won't return the actual stats, will update in a later stage
// app.get("/stats", (req, res) => {
//   const l = tasks.length;
//   // const adminCount = users.filter(user => user.role === 'admin').length;
//   const d = tasks.filter(t => t.done).length;
//   res.json({ "total": l, "completed": d });
// });

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

// will update in a later stage
// app.post("/reset", (req, res) => {
//   tasks.length = 0; //clear array in-place
//   fillTasks(tasks);
//   res.status(200).json(tasks);
// })

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

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});