import express from "express";
const router = express.Router();
import { authenticate, authorizeAdmin } from "../middleware/auth.js";
import settingController from "../controllers/settingController.js";

router.get("/", authenticate, authorizeAdmin, settingController.getAllSettings);
router.get("/public", settingController.getPublicSettings);
router.put("/", authenticate, authorizeAdmin, settingController.updateSettings);

export default router;
