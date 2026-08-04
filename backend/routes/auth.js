import express from "express";
import authController from "../controllers/authController.js";
const router = express.Router();

router.post("/login", authController.login);
router.post("/verify-admin-key", authController.verifyAdminKey);

export default router;
