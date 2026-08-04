// const express = require('express');
// const router = express.Router();
// const { authenticate } = require('../middleware/auth');
// const saleController = require('../controllers/saleController');

import express from "express";
const router = express.Router();
import { authenticate } from "../middleware/auth.js";
import saleController from "../controllers/saleController.js";

router.post("/", authenticate, saleController.createSale);
router.post("/void-item", authenticate, saleController.voidItem);
router.get("/today", authenticate, saleController.getTodaySales);

export default router;
