import { Router } from "express";
import {
  createPayslip,
  getPayslipById,
  getPayslips,
} from "../controllers/payslipController.js";
import { protect, protectAdmin } from "../middleware/aurth.js";

const payslipRouter = Router();

payslipRouter.use(protect);
payslipRouter.get("/", getPayslips);
payslipRouter.post("/", protectAdmin, createPayslip);
payslipRouter.get("/:id", getPayslipById);

export default payslipRouter;
