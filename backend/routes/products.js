// const express = require('express');
// const router = express.Router();
// const { authenticate } = require('../middleware/auth');
// const productController = require('../controllers/productController');

import express from "express";
const router = express.Router();
import { authenticate } from "../middleware/auth.js";
import productController from "../controllers/productController.js";

router.get("/", authenticate, productController.getAllProducts);
router.post("/", authenticate, productController.createProduct);
router.put("/:id", authenticate, productController.updateProduct);
router.delete("/:id", authenticate, productController.deleteProduct);

export default router;
