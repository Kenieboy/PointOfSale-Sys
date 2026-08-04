// const express = require('express');
// const router = express.Router();
// const { authenticate, authorizeAdmin } = require('../middleware/auth');
// const reportController = require('../controllers/reportController');

import express from "express";
const router = express.Router();
import { authenticate, authorizeAdmin } from "../middleware/auth";
import reportController from "../controllers/reportController";

router.get(
  "/daily",
  authenticate,
  authorizeAdmin,
  reportController.getDailyReport,
);
router.get(
  "/monthly",
  authenticate,
  authorizeAdmin,
  reportController.getMonthlyReport,
);

export default router;
