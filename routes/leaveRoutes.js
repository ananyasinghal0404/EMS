import { Router } from "express";
import {
  createLeave,
  getLeaves,
  updateLeaveStatus,
} from "../controllers/leaveController.js";
import { protect, protectAdmin } from "../middleware/aurth.js";

const leaveRouter = Router();

leaveRouter.use(protect);
leaveRouter.get("/", getLeaves);
leaveRouter.post("/", createLeave);
leaveRouter.patch("/:id/status", protectAdmin, updateLeaveStatus);

export default leaveRouter;
