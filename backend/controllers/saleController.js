import pool from "../config/db.js";
import * as Sale from "../models/Sale.js";

const createSale = async (req, res) => {
  const { items, totalAmount, paymentMethod, cashReceived, changeAmount } =
    req.body;
  const userId = req.user.id;

  try {
    const saleId = await Sale.createSale({
      userId,
      totalAmount,
      paymentMethod,
    });

    for (const item of items) {
      await Sale.addSaleItem(saleId, item);
    }

    if (paymentMethod === "cash" && cashReceived !== undefined) {
      await pool.query(
        "UPDATE sales SET cash_received = ?, change_amount = ? WHERE id = ?",
        [cashReceived, changeAmount || 0, saleId],
      );
    }

    res.status(201).json({ saleId, message: "Sale completed successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const voidItem = async (req, res) => {
  const { saleItemId, reason, adminId } = req.body;
  const voidedBy = req.user.id;

  try {
    await Sale.voidItem(saleItemId, reason, voidedBy, adminId);
    res.json({ message: "Item voided successfully" });
  } catch (error) {
    if (error.message === "Item not found") {
      return res.status(404).json({ message: error.message });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getTodaySales = async (req, res) => {
  try {
    const sales = await Sale.getTodaySales();
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getSaleDetails = async (req, res) => {
  try {
    const sale = await Sale.getSaleWithItems(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: "Sale not found" });
    }
    res.json(sale);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export { createSale, voidItem, getTodaySales, getSaleDetails };
