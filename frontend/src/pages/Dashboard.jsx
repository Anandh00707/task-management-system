import { useCallback, useEffect, useState } from "react";
import {
  CalendarDays,
  Check,
  CheckCheck,
  ChevronRight,
  Circle,
  CircleCheck,
  ClipboardList,
  Clock3,
  LayoutDashboard,
  LogOut,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Brand from "../components/Brand";
import TaskForm from "../components/TaskForm";
import Modal from "../components/Modal";
import { useAuth } from "../context/AuthContext";
import { api } from "../services/api";
const dateLabel = (date) =>
  new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
export default function Dashboard() {
  const { user, token, logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [busyId, setBusyId] = useState(null);
  const handleError = useCallback(
    (err) => {
      if (err.status === 401) logout();
      else setError(err.message);
    },
    [logout],
  );
  // Each request uses an AbortController so navigating away cannot update this page.
  useEffect(() => {
    const controller = new AbortController();
    api("/tasks", { token, signal: controller.signal })
      .then((data) => setTasks(data.tasks))
      .catch((err) => {
        if (err.name !== "AbortError") handleError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [token, handleError]);
  async function reload() {
    setLoading(true);
    setError("");
    try {
      const data = await api("/tasks", { token });
      setTasks(data.tasks);
    } catch (err) {
      handleError(err);
    } finally {
      setLoading(false);
    }
  }
  async function save(body) {
    try {
      const editing = form?.task;
      const data = await api(editing ? `/tasks/${editing.id}` : "/tasks", {
        token,
        method: editing ? "PUT" : "POST",
        body,
      });
      setTasks((current) =>
        editing
          ? current.map((task) => (task.id === editing.id ? data.task : task))
          : [data.task, ...current],
      );
      setError("");
      setNotice(editing ? "Task updated." : "Your new task is ready.");
    } catch (err) {
      if (err.status === 401) logout();
      throw err;
    }
  }
  async function toggle(task) {
    setBusyId(task.id);
    setError("");
    try {
      const data = await api(`/tasks/${task.id}`, {
        token,
        method: "PUT",
        body: {
          ...task,
          status: task.status === "Completed" ? "Pending" : "Completed",
        },
      });
      setTasks((current) =>
        current.map((item) => (item.id === task.id ? data.task : item)),
      );
      setNotice(
        data.task.status === "Completed"
          ? "Task completed. Nice work!"
          : "Task marked as pending.",
      );
    } catch (err) {
      handleError(err);
    } finally {
      setBusyId(null);
    }
  }
  async function remove() {
    setBusyId(deleting.id);
    setDeleteError("");
    try {
      await api(`/tasks/${deleting.id}`, { token, method: "DELETE" });
      setTasks((current) => current.filter((task) => task.id !== deleting.id));
      setDeleting(null);
      setNotice("Task deleted.");
    } catch (err) {
      if (err.status === 401) logout();
      else setDeleteError(err.message);
    } finally {
      setBusyId(null);
    }
  }
  const completed = tasks.filter((task) => task.status === "Completed").length;
  const visible = tasks.filter(
    (task) =>
      (filter === "All" || task.status === filter) &&
      `${task.title} ${task.description}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <header className="bg-white border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-5 sm:px-9 h-20 flex items-center justify-between">
          <Brand />
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="hidden sm:inline text-sm text-slate-500">
              Your personal workspace
            </span>
            <span className="h-6 w-px bg-slate-200 hidden sm:block" />
            <div className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-full bg-blue-50 font-semibold text-blue-600">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span className="hidden md:block text-sm font-semibold">
                {user.name}
              </span>
            </div>
            <button
              onClick={logout}
              className="text-slate-500 hover:text-blue-600 flex items-center gap-2 text-sm font-medium"
              aria-label="Log out"
            >
              <LogOut size={17} />
              <span className="hidden sm:block">Log out</span>
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-5 sm:px-9 pt-7 pb-14">
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-8">
          <LayoutDashboard size={14} />
          <span>Workspace</span>
          <ChevronRight size={12} />
          <span className="text-slate-600">Overview</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-5 mb-8">
          <div>
            <div className="eyebrow text-slate-400 mb-2">
              A LITTLE FOCUS GOES A LONG WAY
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Hello, {user.name.split(" ")[0]}{" "}
              <span className="text-blue-500">.</span>
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-500">
              Here’s what’s on your plate. Let’s make some progress.
            </p>
          </div>
          <button className="btn-primary" onClick={() => setForm({})}>
            <Plus size={18} />
            New task
          </button>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 sm:gap-5 mb-8">
          {[
            {
              label: "Total tasks",
              value: tasks.length,
              icon: ClipboardList,
              color: "bg-blue-50 text-blue-600",
              text: "Everything in your workspace",
            },
            {
              label: "Completed",
              value: completed,
              icon: CircleCheck,
              color: "bg-emerald-50 text-emerald-600",
              text: "Small wins, adding up",
            },
            {
              label: "Pending",
              value: tasks.length - completed,
              icon: Clock3,
              color: "bg-amber-50 text-amber-600",
              text: "Ready for your next step",
            },
          ].map(({ label, value, icon: Icon, color, text }) => (
            <div
              key={label}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-slate-500 font-medium">{label}</p>
                  <p className="text-3xl font-bold mt-2">
                    {loading ? "—" : value}
                  </p>
                </div>
                <span className={`rounded-xl p-3 ${color}`}>
                  <Icon size={21} />
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-4">{text}</p>
            </div>
          ))}
        </div>
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="px-5 sm:px-7 pt-6">
            <div className="flex justify-between items-center mb-5">
              <div className="flex gap-3 items-center">
                <h2 className="font-bold text-lg">My tasks</h2>
                <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-md">
                  {tasks.length}
                </span>
              </div>
              <span className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
                <CalendarDays size={14} />
                {new Date().toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>
            <div className="flex flex-wrap gap-4 items-center justify-between pb-5">
              <div
                role="group"
                aria-label="Filter tasks"
                className="flex p-1 bg-slate-100/80 rounded-lg"
              >
                {["All", "Pending", "Completed"].map((label) => (
                  <button
                    key={label}
                    aria-pressed={filter === label}
                    onClick={() => setFilter(label)}
                    className={`px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition ${filter === label ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-900"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className="relative w-full sm:w-64">
                <Search
                  size={16}
                  className="absolute left-3 top-3 text-slate-400"
                />
                <input
                  aria-label="Search tasks"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search your tasks…"
                  className="pl-9! py-2! text-sm!"
                />
              </div>
            </div>
          </div>
          {error && (
            <div className="mx-5 mb-4 error" role="alert">
              {error}{" "}
              <button className="underline font-semibold" onClick={reload}>
                Try again
              </button>
            </div>
          )}
          <p role="status" className="sr-only">
            {notice}
          </p>
          {loading ? (
            <div
              className="p-16 text-center text-slate-400 animate-pulse"
              role="status"
            >
              Loading your tasks…
            </div>
          ) : visible.length === 0 ? (
            <div className="px-5 py-16 text-center border-t border-slate-100">
              <span className="inline-grid size-16 place-items-center rounded-2xl bg-blue-50 text-blue-500 mb-5">
                <CheckCheck size={30} />
              </span>
              <h3 className="font-semibold text-lg">
                {tasks.length
                  ? "Nothing here just yet"
                  : "A fresh start, a clear mind"}
              </h3>
              <p className="text-sm text-slate-400 mt-2 mb-6">
                {tasks.length
                  ? "Try another filter or search to find your tasks."
                  : "Add your first task and turn your plans into progress."}
              </p>
              {!tasks.length && (
                <button
                  className="btn-primary mx-auto"
                  onClick={() => setForm({})}
                >
                  <Plus size={17} />
                  Create your first task
                </button>
              )}
            </div>
          ) : (
            <div>
              <div className="hidden md:grid grid-cols-[minmax(0,1fr)_110px_130px_145px_80px] gap-4 px-7 py-3 bg-slate-50/80 border-y border-slate-100 text-[10px] font-semibold tracking-widest text-slate-400 uppercase">
                <span>Task details</span>
                <span>Priority</span>
                <span>Status</span>
                <span>Due date</span>
                <span className="text-right">Actions</span>
              </div>
              {visible.map((task) => (
                <article
                  key={task.id}
                  className="grid md:grid-cols-[minmax(0,1fr)_110px_130px_145px_80px] gap-3 md:gap-4 items-center px-5 sm:px-7 py-5 border-b last:border-0 border-slate-100 hover:bg-slate-50/50 transition"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      disabled={busyId === task.id}
                      onClick={() => toggle(task)}
                      aria-label={`${task.status === "Completed" ? "Mark pending" : "Complete task"}: ${task.title}`}
                      className={`mt-0.5 shrink-0 rounded-full ${task.status === "Completed" ? "text-blue-600" : "text-slate-300 hover:text-blue-500"}`}
                    >
                      {task.status === "Completed" ? (
                        <CircleCheck size={21} />
                      ) : (
                        <Circle size={21} />
                      )}
                    </button>
                    <div className="min-w-0">
                      <h3
                        className={`text-sm font-semibold break-words ${task.status === "Completed" ? "text-slate-400 line-through" : "text-slate-800"}`}
                      >
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-xs text-slate-400 mt-1.5 whitespace-pre-wrap break-words">
                          {task.description}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-400 mt-2">
                        Created {new Date(task.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="ml-8 md:ml-0">
                    <span
                      className={`badge ${task.priority === "High" ? "bg-rose-50 text-rose-600" : task.priority === "Medium" ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-blue-600"}`}
                    >
                      <span className="size-1.5 rounded-full bg-current" />
                      {task.priority}
                    </span>
                  </div>
                  <div className="ml-8 md:ml-0">
                    <span
                      className={`badge ${task.status === "Completed" ? "text-emerald-600 bg-emerald-50" : "text-slate-500 bg-slate-100"}`}
                    >
                      {task.status === "Completed" ? (
                        <Check size={12} />
                      ) : (
                        <Clock3 size={12} />
                      )}{" "}
                      {task.status}
                    </span>
                  </div>
                  <span
                    className={`ml-8 md:ml-0 flex items-center gap-1.5 text-xs ${task.due_date && task.due_date < today && task.status !== "Completed" ? "text-rose-500" : "text-slate-400"}`}
                  >
                    <CalendarDays size={13} />
                    {task.due_date ? dateLabel(task.due_date) : "No due date"}
                  </span>
                  <div className="flex gap-1 justify-end">
                    <button
                      className="icon-btn"
                      aria-label={`Edit ${task.title}`}
                      disabled={busyId === task.id}
                      onClick={() => setForm({ task })}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-btn hover:text-rose-600! hover:bg-rose-50!"
                      aria-label={`Delete ${task.title}`}
                      disabled={busyId === task.id}
                      onClick={() => {
                        setDeleting(task);
                        setDeleteError("");
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </article>
              ))}
              <div className="px-7 py-4 text-xs text-slate-400">
                Showing {visible.length} of {tasks.length} tasks
              </div>
            </div>
          )}
        </section>
        <p className="mt-8 text-center text-xs text-slate-400">
          One task at a time. You’re making progress.
        </p>
      </main>
      {form && (
        <TaskForm
          task={form.task}
          onSave={save}
          onClose={() => setForm(null)}
        />
      )}
      {deleting && (
        <Modal
          title="Delete this task?"
          busy={busyId === deleting.id}
          onClose={() => setDeleting(null)}
        >
          <div className="p-6">
            <p className="text-sm text-slate-500 break-words">
              “{deleting.title}” will be permanently deleted.
            </p>
            {deleteError && (
              <p className="error mt-4" role="alert">
                {deleteError}
              </p>
            )}
            <div className="flex gap-3 justify-end mt-7">
              <button
                className="btn-secondary"
                disabled={busyId === deleting.id}
                onClick={() => setDeleting(null)}
              >
                Cancel
              </button>
              <button
                className="btn-primary bg-rose-600! hover:bg-rose-700!"
                disabled={busyId === deleting.id}
                onClick={remove}
              >
                {busyId === deleting.id ? "Deleting…" : "Delete task"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
