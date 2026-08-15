import { Router } from "express";
import { protect } from "../middleware/aurth.js";
import { getProfile, updateProfile } from "../controllers/profileContoller.js";

const profileRouter = Router();

profileRouter.get("/", protect, getProfile);
profileRouter.put("/", protect, updateProfile);

export default profileRouter;
