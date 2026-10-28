import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/tasks.js";

export function createApp({
  db,
  jwtSecret,
  frontendUrl = "http://localhost:5173",
}) {
  if (!jwtSecret || jwtSecret.length < 32)
    throw new Error(
      "Set JWT_SECRET to a random value of at least 32 characters.",
    );
  const app = express();
  app.disable("x-powered-by");
  app.locals.db = db;
  app.locals.jwtSecret = jwtSecret;
  const origins = frontendUrl
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || origins.includes(origin)) return callback(null, true);
        const error = new Error("This frontend origin is not allowed.");
        error.status = 403;
        callback(error);
      },
    }),
  );
  app.use(express.json({ limit: "16kb" }));
  app.get("/api/health", (req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", authRoutes);
  app.use("/api/tasks", taskRoutes);
  app.use((req, res) =>
    res.status(404).json({ message: "Endpoint not found." }),
  );
  app.use((error, req, res, next) => {
    if (error.status === 400)
      return res
        .status(400)
        .json({ message: "Request contains invalid JSON." });
    if (error.status === 413)
      return res.status(413).json({ message: "Request body is too large." });
    if (error.status === 403)
      return res.status(403).json({ message: error.message });
    console.error(error);
    res
      .status(500)
      .json({ message: "Something went wrong. Please try again." });
  });
  return app;
}
