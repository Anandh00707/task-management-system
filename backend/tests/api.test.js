import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApp } from "../app.js";
import { openDatabase } from "../database/db.js";
const secret = "test-only-secret-that-is-at-least-32-characters";
let db, server, url, token, otherToken, taskId;
const directory = mkdtempSync(join(tmpdir(), "taskflow-test-"));
const databasePath = join(directory, "test.sqlite");
async function request(path, { method = "GET", body, auth, origin } = {}) {
  const response = await fetch(url + path, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(auth ? { Authorization: `Bearer ${auth}` } : {}),
      ...(origin ? { Origin: origin } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return {
    status: response.status,
    data: response.status === 204 ? null : await response.json(),
    headers: response.headers,
  };
}
before(async () => {
  db = openDatabase(databasePath);
  server = createApp({ db, jwtSecret: secret }).listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  url = `http://127.0.0.1:${server.address().port}`;
});
after(async () => {
  await new Promise((resolve) => server.close(resolve));
  db.close();
  rmSync(directory, { recursive: true, force: true });
});
test("rejects unauthenticated and malformed requests", async () => {
  assert.equal((await request("/api/tasks")).status, 401);
  assert.equal(
    (await request("/api/auth/register", { method: "POST", body: {} })).status,
    400,
  );
  assert.equal(
    (
      await request("/api/auth/register", {
        method: "POST",
        body: { name: "A", email: "invalid", password: "password123" },
      })
    ).status,
    400,
  );
  const malformed = await fetch(url + "/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{",
  });
  assert.equal(malformed.status, 400);
});
test("registers, hashes password, rejects duplicates, logs in, and returns safe profile", async () => {
  const account = {
    name: "Alex Morgan",
    email: "Alex@example.com",
    password: "password123",
  };
  const registration = await request("/api/auth/register", {
    method: "POST",
    body: account,
  });
  assert.equal(registration.status, 201);
  token = registration.data.token;
  assert.equal(registration.data.user.email, "alex@example.com");
  assert.equal(registration.data.user.password_hash, undefined);
  const stored = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get("alex@example.com");
  assert.notEqual(stored.password_hash, account.password);
  assert.ok(await bcrypt.compare(account.password, stored.password_hash));
  assert.equal(
    (await request("/api/auth/register", { method: "POST", body: account }))
      .status,
    409,
  );
  assert.equal(
    (
      await request("/api/auth/login", {
        method: "POST",
        body: { email: account.email, password: "wrongpass" },
      })
    ).status,
    401,
  );
  assert.equal(
    (await request("/api/auth/login", { method: "POST", body: account }))
      .status,
    200,
  );
  const profile = await request("/api/auth/me", { auth: token });
  assert.equal(profile.status, 200);
  assert.equal(profile.data.user.name, account.name);
  assert.equal(profile.data.user.password_hash, undefined);
  const other = await request("/api/auth/register", {
    method: "POST",
    body: { ...account, email: "other@example.com" },
  });
  otherToken = other.data.token;
});
test("creates, reads, edits, completes, and filters tasks", async () => {
  const created = await request("/api/tasks/", {
    method: "POST",
    auth: token,
    body: {
      title: "  Prepare project demo  ",
      description: "Review the README",
      priority: "High",
      due_date: "2026-12-15",
    },
  });
  assert.equal(created.status, 201);
  taskId = created.data.task.id;
  assert.equal(created.data.task.title, "Prepare project demo");
  assert.equal(created.data.task.status, "Pending");
  assert.ok(created.data.task.created_at);
  assert.equal(
    (await request(`/api/tasks/${taskId}`, { auth: token })).status,
    200,
  );
  const changed = await request(`/api/tasks/${taskId}`, {
    method: "PUT",
    auth: token,
    body: { ...created.data.task, title: "Demo is ready", status: "Completed" },
  });
  assert.equal(changed.status, 200);
  assert.equal(changed.data.task.status, "Completed");
  assert.equal(
    (await request("/api/tasks?status=Completed", { auth: token })).data.tasks
      .length,
    1,
  );
  assert.equal(
    (await request("/api/tasks?status=Pending", { auth: token })).data.tasks
      .length,
    0,
  );
});
test("isolates tasks between users for every operation", async () => {
  assert.deepEqual(
    (await request("/api/tasks", { auth: otherToken })).data.tasks,
    [],
  );
  for (const method of ["GET", "PUT", "DELETE"]) {
    assert.equal(
      (
        await request(`/api/tasks/${taskId}`, {
          method,
          auth: otherToken,
          ...(method === "PUT" ? { body: { title: "stolen" } } : {}),
        })
      ).status,
      404,
    );
  }
});
test("rejects invalid tasks, IDs, filters and tokens", async () => {
  for (const body of [
    { title: " " },
    { title: "x", priority: "Urgent" },
    { title: "x", status: "unknown" },
    { title: "x", due_date: "2026-02-30" },
    { title: "x", description: 5 },
  ]) {
    assert.equal(
      (await request("/api/tasks", { method: "POST", auth: token, body }))
        .status,
      400,
    );
  }
  assert.equal((await request("/api/tasks/nope", { auth: token })).status, 400);
  assert.equal(
    (await request("/api/tasks?status=wrong", { auth: token })).status,
    400,
  );
  assert.equal((await request("/api/tasks", { auth: "fake" })).status, 401);
  const expired = jwt.sign({}, secret, { subject: "1", expiresIn: -1 });
  assert.equal((await request("/api/tasks", { auth: expired })).status, 401);
});
test("allows configured CORS origin and blocks others", async () => {
  const allowed = await request("/api/health", {
    origin: "http://localhost:5173",
  });
  assert.equal(
    allowed.headers.get("access-control-allow-origin"),
    "http://localhost:5173",
  );
  assert.equal(
    (await request("/api/health", { origin: "https://untrusted.example" }))
      .status,
    403,
  );
});
test("persists data across database reopen and deletes tasks", async () => {
  const secondConnection = openDatabase(databasePath);
  assert.equal(
    secondConnection.prepare("SELECT title FROM tasks WHERE id = ?").get(taskId)
      .title,
    "Demo is ready",
  );
  secondConnection.close();
  assert.equal(
    (await request(`/api/tasks/${taskId}`, { method: "DELETE", auth: token }))
      .status,
    204,
  );
  assert.equal(
    (await request(`/api/tasks/${taskId}`, { auth: token })).status,
    404,
  );
  assert.equal(
    (await request(`/api/tasks/${taskId}`, { method: "DELETE", auth: token }))
      .status,
    404,
  );
});
