// import express from "express";
// import authController from "../controllers/authController.js";
// const router = express.Router();

// router.post("/login", authController.login);
// router.post("/verify-admin-key", authController.verifyAdminKey);

// export default router;

import express from "express";
import { authenticate } from "../middleware/auth.js";
import * as authController from "../controllers/authController.js";

const router = express.Router();

router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/me", authenticate, authController.me);
router.post("/verify-admin-key", authController.verifyAdminKey);

export default router;
