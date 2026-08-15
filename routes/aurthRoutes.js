import { Router } from "express";
import { changePassword, login, session } from "../controllers/authControllers.js";
import { protect } from "../middleware/aurth.js";

const aurthRouter = Router();

// Get all employees
aurthRouter.post("/login", login);

// Create a new employee
aurthRouter.get("/session", protect , session);

// Update an employee
aurthRouter.post("/change-password", protect , changePassword);


export default aurthRouter;
