import express from "express";
import { authenticate } from "../middleware/auth.js";
import * as saleController from "../controllers/saleController.js";

const router = express.Router();

router.post("/", authenticate, saleController.createSale);
router.post("/void-item", authenticate, saleController.voidItem);
router.get("/today", authenticate, saleController.getTodaySales);
router.get("/:id", authenticate, saleController.getSaleDetails);

export default router;
