import { Router } from "express";
import {
  getAdminDashboard,
  getEmployeeDashboard,
} from "../controllers/dashboardController.js";
import { protect } from "../middleware/aurth.js";

const dashboardRouter = Router();

dashboardRouter.get("/", protect, (req, res) => {
  if (req.session?.role === "ADMIN") {
    return getAdminDashboard(req, res);
  }

  return getEmployeeDashboard(req, res);
});

export default dashboardRouter;
