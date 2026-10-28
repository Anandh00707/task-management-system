import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import {
  listTasks,
  readTask,
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/taskController.js";
const router = Router();
router.use(requireAuth);
router.param("id", (req, res, next, id) => {
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id)))
    return res.status(400).json({ message: "Invalid task ID." });
  next();
});
router.route("/").get(listTasks).post(createTask);
router.route("/:id").get(readTask).put(updateTask).delete(deleteTask);
export default router;
