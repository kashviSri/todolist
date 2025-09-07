const express = require('express');
const bodyParser = require('body-parser');
const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

const mongoose = require("mongoose");
mongoose.connect('mongodb://localhost:27017/todoDB', { useNewUrlParser: true, useUnifiedTopology: true });

const todoSchema = new mongoose.Schema({
  task: String,
  priority: { type: String, default: "Normal" },
  done: { type: Boolean, default: false }
});

const Todo = mongoose.model("Todo", todoSchema);

app.get('/', async (req, res) => {
  const filter = req.query.priority || '';
  const query = filter ? { priority: filter } : {};
  const todos = await Todo.find(query).lean();
  res.render("list", {
    todos,
    allTodos: todos,
    error: null,
    editingIndex: null,
    selectedPriority: filter
  });
});

app.post('/', async (req, res) => {
  const { task, priority } = req.body;
  if (!task || task.trim() === "") {
    const todos = await Todo.find({}).lean();
    return res.render("list", {
      todos,
      allTodos: todos,
      error: "Task cannot be empty!",
      editingIndex: null,
      selectedPriority: ''
    });
  }
  await Todo.create({ task: task.trim(), priority, done: false });
  res.redirect('/');
});

app.post('/toggle', async (req, res) => {
  const index = parseInt(req.body.index);
  const todos = await Todo.find({}).lean();
  if (!isNaN(index) && todos[index]) {
    const todo = todos[index];
    await Todo.findByIdAndUpdate(todo._id, { done: !todo.done });
  }
  res.redirect('/');
});

app.post('/edit-mode', async (req, res) => {
  const index = parseInt(req.body.index);
  const priorityFilter = req.body.filter || '';
  const query = priorityFilter ? { priority: priorityFilter } : {};
  const todos = await Todo.find(query).lean();
  res.render("list", {
    todos,
    allTodos: todos,
    error: null,
    editingIndex: index,
    selectedPriority: priorityFilter
  });
});

app.post('/edit', async (req, res) => {
  const { index, updatedTask } = req.body;
  const i = parseInt(index);
  const todos = await Todo.find({}).lean();
  if (!isNaN(i) && updatedTask.trim() && todos[i]) {
    await Todo.findByIdAndUpdate(todos[i]._id, { task: updatedTask.trim() });
  }
  res.redirect('/');
});


app.post('/delete', async (req, res) => {
  const index = parseInt(req.body.index);
  const todos = await Todo.find({}).lean();
  if (!isNaN(index) && todos[index]) {
    await Todo.findByIdAndDelete(todos[index]._id);
  }
  res.redirect('/');
});

app.put("/todos/:id", async (req, res) => {
  const id = req.params.id;
  const { task } = req.body;   // take task from JSON body
  try {
    const updatedTodo = await Todo.findByIdAndUpdate(
      id,
      { task: task },
      { new: true }  // return the updated todo, not the old one
    );
    if (!updatedTodo) {
      return res.status(404).send("Todo not found");
    }
    res.json(updatedTodo);
  } catch (err) {
    res.status(400).send("Error updating todo");
  }
});


app.delete("/todos/:id", async (req, res) => {
  const id = req.params.id;
  await Todo.findByIdAndDelete(id);
  res.send("todo deleted");
});

app.get("/todos", async (req, res) => {
  const todos = await Todo.find({});
  res.json(todos);
});

const port = process.env.PORT || 8000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});


