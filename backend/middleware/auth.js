import jwt from "jsonwebtoken";

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  if (!header.startsWith("Bearer "))
    return res.status(401).json({ message: "Please log in to continue." });
  try {
    const payload = jwt.verify(header.slice(7), req.app.locals.jwtSecret, {
      algorithms: ["HS256"],
    });
    const user = req.app.locals.db
      .prepare("SELECT id, name, email, created_at FROM users WHERE id = ?")
      .get(payload.sub);
    if (!user)
      return res
        .status(401)
        .json({ message: "Your account could not be found." });
    req.user = user;
    next();
  } catch {
    res
      .status(401)
      .json({ message: "Your session has expired. Please log in again." });
  }
}
