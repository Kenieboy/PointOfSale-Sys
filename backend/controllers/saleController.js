import {
  createSale as createSaleModel,
  addSaleItem as addSaleItemModel,
  voidItem as voidItemModel,
  getTodaySales as getTodaySalesModel,
} from "../models/Sale.js";

const createSale = async (req, res) => {
  const { items, totalAmount, paymentMethod } = req.body;
  const userId = req.user.id;

  try {
    const saleId = await createSaleModel({
      userId,
      totalAmount,
      paymentMethod,
    });

    for (const item of items) {
      await addSaleItemModel(saleId, item);
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
    await voidItemModel(saleItemId, reason, voidedBy, adminId);
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
    const sales = await getTodaySalesModel();
    res.json(sales);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default { createSale, voidItem, getTodaySales };
