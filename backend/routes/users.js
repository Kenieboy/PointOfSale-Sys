import express from "express";
import { authenticate, authorizeAdmin } from "../middleware/auth.js";
import * as userController from "../controllers/userController.js";

const router = express.Router();

router.get("/", authenticate, authorizeAdmin, userController.getAllUsers);
router.post("/", authenticate, authorizeAdmin, userController.createUser);
router.put("/:id", authenticate, authorizeAdmin, userController.updateUser);
router.delete("/:id", authenticate, authorizeAdmin, userController.deleteUser);

export default router;
