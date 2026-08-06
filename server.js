const express = require("express");
const app = express();
app.use(express.json());

class Task {
  id;
  title;
  done;

  constructor(title, array, done = false) {
    this.id = generateId(array);
    this.title = title;
    this.done = done;
  }

  isDone() {
    return this.done;
  }

  changeStatus(done = null) {
    if (done === undefined) {
      this.done = done;
    }
    else {
      this.done = !this.done;
    }
  }

  changeTitle(title) {
    this.title = title;
  }
}

let tasks = []
tasks.push(new Task("first", tasks, done = true));
tasks.push(new Task("second", tasks));
tasks.push(new Task("third", tasks));
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
  res.json(tasks);
});

app.get("/tasks/:id", (req, res) => {
  const id = Number(req.params.id);
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  res.json(task);
});

// ---------- POST ----------

app.post("/tasks", (req, res) => {
  const title = req.body.title;
  if (!title) {
    return res.status(400).json({ error: `Title is empty` });
  }

  const task = new Task(title, tasks);
  tasks.push(task);
  return res.status(201).json(task);
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
    task.done = req.body.done;
  }
  if (title) {
    task.title = req.body.title;
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
  // `...` unpacks the list of IDs returned, like python's `*args`
  const maxId = Math.max(...array.map((t) => t.id));
  return maxId + 1;
}
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});