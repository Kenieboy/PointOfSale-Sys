import pool from "../config/db.js";

const getAll = async (active = true) => {
  const [rows] = await pool.query("SELECT * FROM products WHERE active = ?", [
    active,
  ]);
  return rows;
};

const findById = async (id) => {
  const [rows] = await pool.query("SELECT * FROM products WHERE id = ?", [id]);
  return rows[0] || null;
};

const createProduct = async (productData) => {
  const { name, price, category, barcode } = productData;
  const [result] = await pool.query(
    "INSERT INTO products (name, price, category, barcode) VALUES (?, ?, ?, ?)",
    [name, price, category, barcode],
  );
  return result.insertId;
};

const updateProduct = async (id, productData) => {
  const { name, price, category, barcode, active } = productData;
  const [result] = await pool.query(
    "UPDATE products SET name = ?, price = ?, category = ?, barcode = ?, active = ? WHERE id = ?",
    [name, price, category, barcode, active, id],
  );
  return result.affectedRows > 0;
};

const deleteProduct = async (id) => {
  const [result] = await pool.query(
    "UPDATE products SET active = 0 WHERE id = ?",
    [id],
  );
  return result.affectedRows > 0;
};

export { getAll, findById, createProduct, updateProduct, deleteProduct };
