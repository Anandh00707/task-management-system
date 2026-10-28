import { createApp } from "./app.js";
import { openDatabase } from "./database/db.js";
const db = openDatabase();
const app = createApp({
  db,
  jwtSecret: process.env.JWT_SECRET,
  frontendUrl: process.env.FRONTEND_URL,
});
const server = app.listen(process.env.PORT || 5000, "0.0.0.0", () =>
  console.log(`API running on port ${process.env.PORT || 5000}`),
);
function shutdown() {
  server.close(() => {
    db.close();
    process.exit(0);
  });
}
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
