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
    if (done) {
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

app.get("/", (req, res) => {
  res.json({
    name: "Task API",
    version: "1.0",
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

app.post("/tasks", (req, res) => {
  const title = req.body.title;
  if (!title) {
    return res.status(400).json({ error: `Title is empty` });
  }

  const task = new Task(title, tasks);
  tasks.push(task);
  return res.status(201).json(task);
})




function generateId(array) {
  if (!array.length) return 1;
  // `...` unpacks the list of IDs returned, like python's `*args`
  const maxId = Math.max(...array.map((t) => t.id));
  return maxId + 1;
}



app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});