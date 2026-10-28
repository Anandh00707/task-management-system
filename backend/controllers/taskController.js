import { validateTask } from "../middleware/validation.js";
const getTask = (req) =>
  req.app.locals.db
    .prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?")
    .get(req.params.id, req.user.id);

export function listTasks(req, res) {
  const { status } = req.query;
  if (status && !["Pending", "Completed"].includes(status))
    return res
      .status(400)
      .json({ message: "Filter status must be Pending or Completed." });
  const db = req.app.locals.db;
  const tasks = status
    ? db
        .prepare(
          "SELECT * FROM tasks WHERE user_id = ? AND status = ? ORDER BY created_at DESC, id DESC",
        )
        .all(req.user.id, status)
    : db
        .prepare(
          "SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC, id DESC",
        )
        .all(req.user.id);
  res.json({ tasks });
}
export function readTask(req, res) {
  const task = getTask(req);
  if (!task) return res.status(404).json({ message: "Task not found." });
  res.json({ task });
}
function values(body) {
  return [
    body.title.trim(),
    body.description ?? "",
    body.priority ?? "Medium",
    body.status ?? "Pending",
    body.due_date || null,
  ];
}
export function createTask(req, res) {
  const error = validateTask(req.body);
  if (error) return res.status(400).json({ message: error });
  const result = req.app.locals.db
    .prepare(
      "INSERT INTO tasks (title, description, priority, status, due_date, user_id) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .run(...values(req.body), req.user.id);
  const task = req.app.locals.db
    .prepare("SELECT * FROM tasks WHERE id = ? AND user_id = ?")
    .get(result.lastInsertRowid, req.user.id);
  res.status(201).json({ task });
}
export function updateTask(req, res) {
  if (!getTask(req))
    return res.status(404).json({ message: "Task not found." });
  const error = validateTask(req.body);
  if (error) return res.status(400).json({ message: error });
  req.app.locals.db
    .prepare(
      "UPDATE tasks SET title = ?, description = ?, priority = ?, status = ?, due_date = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ? AND user_id = ?",
    )
    .run(...values(req.body), req.params.id, req.user.id);
  res.json({ task: getTask(req) });
}
export function deleteTask(req, res) {
  const result = req.app.locals.db
    .prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?")
    .run(req.params.id, req.user.id);
  if (!result.changes)
    return res.status(404).json({ message: "Task not found." });
  res.status(204).end();
}
