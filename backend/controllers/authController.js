import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { validateAccount } from "../middleware/validation.js";

function session(req, user) {
  const token = jwt.sign({}, req.app.locals.jwtSecret, {
    subject: String(user.id),
    expiresIn: "1d",
    algorithm: "HS256",
  });
  return { token, user };
}

export async function register(req, res) {
  const error = validateAccount(req.body, true);
  if (error) return res.status(400).json({ message: error });
  const { name, email, password } = req.body;
  const db = req.app.locals.db;
  const normalizedEmail = email.trim().toLowerCase();
  if (db.prepare("SELECT id FROM users WHERE email = ?").get(normalizedEmail))
    return res
      .status(409)
      .json({ message: "An account with this email already exists." });
  const hash = await bcrypt.hash(password, 12);
  try {
    const result = db
      .prepare(
        "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      )
      .run(name.trim(), normalizedEmail, hash);
    const user = db
      .prepare("SELECT id, name, email, created_at FROM users WHERE id = ?")
      .get(result.lastInsertRowid);
    res.status(201).json(session(req, user));
  } catch (error) {
    if (String(error.message).includes("UNIQUE"))
      return res
        .status(409)
        .json({ message: "An account with this email already exists." });
    throw error;
  }
}

export async function login(req, res) {
  const error = validateAccount(req.body);
  if (error) return res.status(400).json({ message: error });
  const user = req.app.locals.db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(req.body.email.trim().toLowerCase());
  if (!user || !(await bcrypt.compare(req.body.password, user.password_hash)))
    return res.status(401).json({ message: "Email or password is incorrect." });
  const { password_hash, ...publicUser } = user;
  res.json(session(req, publicUser));
}
