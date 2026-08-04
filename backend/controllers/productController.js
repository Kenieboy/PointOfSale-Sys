import {
  getAll,
  createProduct as createProductModel,
  updateProduct as updateProductModel,
  deleteProduct as deleteProductModel,
} from "../models/Product.js";

const getAllProducts = async (req, res) => {
  try {
    const products = await getAll(true);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createProduct = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }

  try {
    const productId = await createProductModel(req.body);
    res
      .status(201)
      .json({ id: productId, message: "Product added successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateProduct = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }

  try {
    const success = await updateProductModel(req.params.id, req.body);
    if (!success) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const deleteProduct = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }

  try {
    const success = await deleteProductModel(req.params.id);
    if (!success) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default { getAllProducts, createProduct, updateProduct, deleteProduct };
