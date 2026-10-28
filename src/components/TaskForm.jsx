import { useState } from "react";
import { Save } from "lucide-react";
import Modal from "./Modal";
export default function TaskForm({ task, onSave, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event) {
    event.preventDefault();
    const body = Object.fromEntries(new FormData(event.currentTarget));
    if (!body.title.trim()) {
      setError("Give your task a title.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSave(body);
      onClose();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }
  return (
    <Modal
      title={task ? "Edit task" : "Create a task"}
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={submit} className="p-6 space-y-5">
        <fieldset disabled={busy} className="space-y-5">
          <label className="field">
            Task title{" "}
            <input
              autoFocus
              name="title"
              required
              maxLength={150}
              defaultValue={task?.title || ""}
              placeholder="What would you like to get done?"
            />
          </label>
          <label className="field">
            Description{" "}
            <span className="font-normal text-slate-400">(optional)</span>
            <textarea
              name="description"
              rows={3}
              maxLength={2000}
              defaultValue={task?.description || ""}
              placeholder="Add a little more detail…"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="field">
              Priority
              <select name="priority" defaultValue={task?.priority || "Medium"}>
                <option>Low</option>
                <option>Medium</option>
                <option>High</option>
              </select>
            </label>
            <label className="field">
              Status
              <select name="status" defaultValue={task?.status || "Pending"}>
                <option>Pending</option>
                <option>Completed</option>
              </select>
            </label>
          </div>
          <label className="field">
            Due date{" "}
            <span className="font-normal text-slate-400">(optional)</span>
            <input
              type="date"
              name="due_date"
              min="0001-01-01"
              max="9999-12-31"
              defaultValue={task?.due_date || ""}
            />
          </label>
        </fieldset>
        {error && (
          <p role="alert" className="error">
            {error}
          </p>
        )}
        <div className="flex justify-end gap-3 pt-3">
          <button
            type="button"
            className="btn-secondary"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="btn-primary" disabled={busy}>
            <Save size={16} />
            {busy ? "Saving…" : "Save task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
