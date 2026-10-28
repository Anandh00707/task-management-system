import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtempSync, rmSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Window } from "happy-dom";
import { createApp } from "../../backend/app.js";
import { openDatabase } from "../../backend/database/db.js";
const require = createRequire(import.meta.url);
const { buildSync } = require("esbuild");
const directory = mkdtempSync(join(tmpdir(), "taskflow-react-"));
const bundlePath = join(directory, "app.cjs");
const db = openDatabase(":memory:");
const server = createApp({
  db,
  jwtSecret: "integration-test-secret-with-at-least-32-characters",
}).listen(0, "127.0.0.1");
await new Promise((resolve) => server.once("listening", resolve));
const base = `http://127.0.0.1:${server.address().port}/api`;
const requests = [];
const realFetch = globalThis.fetch;
globalThis.fetch = async (...args) => {
  const response = await realFetch(...args);
  requests.push({ url: args[0], status: response.status });
  return response;
};
const window = new Window({ url: "http://localhost:5173/register" });
for (const key of [
  "window",
  "document",
  "navigator",
  "HTMLElement",
  "HTMLInputElement",
  "HTMLFormElement",
  "Event",
  "MouseEvent",
  "FormData",
  "sessionStorage",
  "localStorage",
]) {
  Object.defineProperty(globalThis, key, {
    configurable: true,
    value: key === "window" ? window : window[key],
  });
}
window.HTMLDialogElement.prototype.showModal = function () {
  this.open = true;
};
window.HTMLDialogElement.prototype.close = function () {
  this.open = false;
};
document.body.innerHTML = '<div id="root"></div>';
buildSync({
  entryPoints: [fileURLToPath(new URL("../src/main.jsx", import.meta.url))],
  bundle: true,
  platform: "node",
  format: "cjs",
  outfile: bundlePath,
  loader: { ".css": "empty" },
  jsx: "automatic",
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify(base),
    "process.env.NODE_ENV": '"production"',
  },
});
require(bundlePath);
const pause = () => new Promise((resolve) => setTimeout(resolve, 25));
async function waitFor(check, label) {
  for (let i = 0; i < 240; i++) {
    if (check()) return;
    await pause();
  }
  throw new Error(`Timed out: ${label}\n${document.body.textContent}`);
}
const text = () => document.body.textContent;
const buttons = () => [...document.querySelectorAll("button")];
function clickText(label) {
  const btn = buttons().find((b) => b.textContent.trim() === label);
  assert.ok(btn, `Button exists: ${label}`);
  btn.click();
}
function fill(name, value) {
  const el = document.querySelector(`[name="${name}"]`);
  assert.ok(el, name);
  el.value = value;
}
function submit() {
  document.querySelector("form").requestSubmit();
}
try {
  await waitFor(
    () => document.querySelector('[name="name"]'),
    "registration form",
  );
  fill("name", "Alex Morgan");
  fill("email", "alex-ui@example.com");
  fill("password", "TestPassword123!");
  submit();
  await waitFor(() => text().includes("Hello, Alex"), "signed-in dashboard");
  await waitFor(
    () => text().includes("A fresh start"),
    "empty state after loading",
  );
  clickText("New task");
  await waitFor(() => document.querySelector('[name="title"]'), "task form");
  fill("title", "Prepare college demo");
  fill("description", "Review all API endpoints");
  fill("due_date", "2026-12-15");
  fill("priority", "High");
  submit();
  await waitFor(
    () =>
      text().includes("Prepare college demo") &&
      !document.querySelector("dialog"),
    "task rendered after saving",
  );
  assert.equal(
    db.prepare("SELECT title FROM tasks").get().title,
    "Prepare college demo",
  );
  document.querySelector('[aria-label="Edit Prepare college demo"]').click();
  await waitFor(() => document.querySelector('[name="title"]'), "edit form");
  fill("title", "College demo ready");
  submit();
  await waitFor(
    () =>
      text().includes("College demo ready") &&
      !document.querySelector("dialog"),
    "edited task rendered",
  );
  document
    .querySelector('[aria-label="Complete task: College demo ready"]')
    .click();
  await waitFor(
    () => db.prepare("SELECT status FROM tasks").get()?.status === "Completed",
    "completion persisted",
  );
  clickText("Pending");
  await waitFor(() => !document.querySelector("article"), "pending filter");
  clickText("Completed");
  await waitFor(() => document.querySelector("article"), "completed filter");
  document.querySelector('[aria-label="Delete College demo ready"]').click();
  await waitFor(() => document.querySelector("dialog"), "delete confirmation");
  clickText("Cancel");
  await waitFor(() => !document.querySelector("dialog"), "cancel deletion");
  assert.equal(db.prepare("SELECT count(*) AS n FROM tasks").get().n, 1);
  document.querySelector('[aria-label="Delete College demo ready"]').click();
  await waitFor(
    () => document.querySelector("dialog"),
    "delete confirmation again",
  );
  clickText("Delete task");
  await waitFor(
    () =>
      !document.querySelector("dialog") && !document.querySelector("article"),
    "deletion rendered",
  );
  assert.equal(db.prepare("SELECT count(*) AS n FROM tasks").get().n, 0);
  document.querySelector('[aria-label="Log out"]').click();
  await waitFor(
    () => document.querySelector('[name="email"]'),
    "logout redirects to login",
  );
  assert.equal(sessionStorage.getItem("taskflow-token"), null);
  fill("email", "alex-ui@example.com");
  fill("password", "TestPassword123!");
  submit();
  await waitFor(
    () => text().includes("Hello, Alex"),
    "login returns to dashboard",
  );
  assert.ok(
    requests.some((r) => r.url.endsWith("/auth/register") && r.status === 201),
  );
  assert.ok(requests.some((r) => r.url.endsWith("/tasks") && r.status === 201));
  assert.ok(requests.some((r) => r.status === 204));
  console.log(
    "PASS: React DOM → real HTTP API → SQLite → rendered UI. Registration, create, edit, toggle, filters, delete cancellation/confirmation, logout and login.",
  );
} finally {
  await new Promise((resolve) => server.close(resolve));
  db.close();
  window.happyDOM.abort();
  rmSync(directory, { recursive: true, force: true });
}
