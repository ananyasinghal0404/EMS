import { Router } from "express";
import {
  createAttendance,
  getAttendance,
  updateAttendance,
} from "../controllers/attendanceController.js";
import { protect } from "../middleware/aurth.js";

const attendanceRouter = Router();

attendanceRouter.use(protect);
attendanceRouter.get("/", getAttendance);
attendanceRouter.post("/", createAttendance);
attendanceRouter.put("/:id", updateAttendance);

export default attendanceRouter;
