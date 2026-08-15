import express from "express";

import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employeeController.js";
import { protect, protectAdmin } from "../middleware/aurth.js";

const router = express.Router();

// Get all employees
router.get("/", protect, protectAdmin, getEmployees);

// Create a new employee
router.post("/", protect, protectAdmin, createEmployee);

// Update an employee
router.put("/:id", protect, protectAdmin, updateEmployee);

// Delete an employee
router.delete("/:id", protect, protectAdmin, deleteEmployee);

export default router;
