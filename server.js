const taskRepo = require("./repositories/taskRepository"),
  express = require("express"),
  app = express(),
  swaggerUi = require("swagger-ui-express"),
  openApiDocument = require("./openai.json");
app.use(express.json());
app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDocument));

class Task {
  id;
  title;
  done;

  constructor(title, array, done = false) {
    this.id = generateId(array);
    this.title = title;
    this.done = done;
  }

  changeStatus(done = undefined) {
    if (done === undefined) {
      this.done = !this.done;
    }
    else {
      this.done = done;
    }
  }

  changeTitle(title) {
    this.title = title;
  }
}

let tasks = []
fillTasks(tasks);

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
  const d = req.query.done !== undefined ? req.query.done.toLowerCase() === "true" : undefined;

  res.json(taskRepo.getAllTasks({ d, search: req.query.search }));
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
  const taskExists = tasks.find((t) => t.title === title);

  if (taskExists) {
    return res.status(409).json({ error: `Task \`${title}\` already exists` });
  }
  const task = new Task(title, tasks);
  tasks.push(task);
  return res.status(201).json(task);
})

app.post("/reset", (req, res) => {
  tasks.length = 0; //clear array in-place
  fillTasks(tasks);
  res.status(200).json(tasks);
})

// ---------- PUT ----------

app.put("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find((t) => t.id === id);
  if (!task) return res.status(404).json({ error: `Task ${id} not found` });
  const { title, done } = req.body;

  if (done === undefined && (title === undefined || title.trim() === ""))
    return res.status(400).json({ error: `Request body must include a valid title or done status` });

  if (done !== undefined) {
    task.changeStatus(req.body.done);
  }
  if (title) {
    task.changeTitle(req.body.title);
  }
  return res.status(200).json(task);
})

// ---------- DELETE ----------

app.delete("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return res.status(404).json({ error: `Task ${id} not found` });
  tasks.splice(index, 1); //delete 1 element starting from that index

  return res.status(204).send(); // `.send()` to actually send the empty body
})



// ---------- FUNCTIONS ----------

function generateId(array) {
  if (!array.length) return 1;
  // `...` unpacks the array of IDs returned, like python's `*args`
  const maxId = Math.max(...array.map((t) => t.id));
  return maxId + 1;
}
function fillTasks(array) {
  array.push(new Task("first", array, true));
  array.push(new Task("second", array));
  array.push(new Task("third", array));
}

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