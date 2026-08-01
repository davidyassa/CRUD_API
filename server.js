const express = require("express");
const app = express();

let tasks = [
  {
    id: 1,
    title: "first",
    done: true,
  },
  {
    id: 67,
    title: "second",
    done: false,
  },
  {
    id:69,
    title: "third",
    done: false,
  },
]

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

app.get("/tasks/:id", (req,res) => {
  // res.json(tasks[id])
  const id = Number(req.params.id);
  const task = tasks.find((t) => t.id === id);

  if (!task) {
    return res.status(404).json({ error: `Task ${id} not found` });
  }

  res.json(task);
});










app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});