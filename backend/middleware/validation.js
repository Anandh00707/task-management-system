export function validateAccount(body, registering = false) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    return "Provide a JSON object.";
  if (
    registering &&
    (typeof body.name !== "string" ||
      !body.name.trim() ||
      body.name.trim().length > 80)
  )
    return "Name must contain 1–80 characters.";
  if (
    typeof body.email !== "string" ||
    body.email.length > 254 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())
  )
    return "Enter a valid email address.";
  if (
    typeof body.password !== "string" ||
    body.password.length < 8 ||
    Buffer.byteLength(body.password, "utf8") > 72
  )
    return "Password must be at least 8 characters and at most 72 UTF-8 bytes.";
  return null;
}

export function validateTask(body) {
  if (!body || typeof body !== "object" || Array.isArray(body))
    return "Provide a JSON object.";
  if (
    typeof body.title !== "string" ||
    !body.title.trim() ||
    body.title.trim().length > 150
  )
    return "Title must contain 1–150 characters.";
  if (
    body.description != null &&
    (typeof body.description !== "string" || body.description.length > 2000)
  )
    return "Description must be at most 2,000 characters.";
  if (!["Low", "Medium", "High"].includes(body.priority ?? "Medium"))
    return "Choose a valid priority.";
  if (!["Pending", "Completed"].includes(body.status ?? "Pending"))
    return "Choose a valid status.";
  if (body.due_date != null && body.due_date !== "") {
    const date = body.due_date;
    if (
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(Date.parse(date)) ||
      new Date(date).toISOString().slice(0, 10) !== date ||
      date.slice(0, 4) === "0000"
    )
      return "Enter a valid due date (YYYY-MM-DD).";
  }
  return null;
}
