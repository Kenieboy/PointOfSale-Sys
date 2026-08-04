import pool from "../config/db.js";

const createSale = async (saleData) => {
  const { userId, totalAmount, paymentMethod } = saleData;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [saleResult] = await connection.query(
      'INSERT INTO sales (user_id, total_amount, payment_method, status) VALUES (?, ?, ?, "completed")',
      [userId, totalAmount, paymentMethod],
    );

    const saleId = saleResult.insertId;
    await connection.commit();
    return saleId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const addSaleItem = async (saleId, item) => {
  const [result] = await pool.query(
    "INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)",
    [
      saleId,
      item.productId,
      item.quantity,
      item.price,
      item.quantity * item.price,
    ],
  );
  return result.insertId;
};

const getSaleItemById = async (saleItemId) => {
  const [rows] = await pool.query("SELECT * FROM sale_items WHERE id = ?", [
    saleItemId,
  ]);
  return rows[0] || null;
};

const voidItem = async (saleItemId, reason, voidedBy, adminApprovedBy) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const item = await getSaleItemById(saleItemId);
    if (!item) throw new Error("Item not found");

    await connection.query(
      `INSERT INTO voided_items 
       (sale_item_id, product_id, quantity, unit_price, reason, voided_by, admin_approved_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        saleItemId,
        item.product_id,
        item.quantity,
        item.unit_price,
        reason,
        voidedBy,
        adminApprovedBy,
      ],
    );

    await connection.query("UPDATE sale_items SET voided = 1 WHERE id = ?", [
      saleItemId,
    ]);
    await connection.query(
      "UPDATE sales SET total_amount = total_amount - ? WHERE id = ?",
      [item.total_price, item.sale_id],
    );

    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const getTodaySales = async () => {
  const [rows] = await pool.query(`
    SELECT s.*, u.name as cashier_name,
      (SELECT SUM(total_price) FROM sale_items WHERE sale_id = s.id AND voided = 0) as actual_total
    FROM sales s
    JOIN users u ON s.user_id = u.id
    WHERE DATE(s.created_at) = CURDATE() AND s.status = 'completed'
    ORDER BY s.created_at DESC
  `);
  return rows;
};

const getSaleById = async (id) => {
  const [rows] = await pool.query("SELECT * FROM sales WHERE id = ?", [id]);
  return rows[0] || null;
};

const getSaleWithItems = async (saleId) => {
  const [saleRows] = await pool.query(
    `SELECT s.*, u.name as cashier_name
     FROM sales s
     JOIN users u ON s.user_id = u.id
     WHERE s.id = ?`,
    [saleId],
  );

  if (saleRows.length === 0) return null;

  const [itemRows] = await pool.query(
    `SELECT si.*, p.name as product_name
     FROM sale_items si
     JOIN products p ON si.product_id = p.id
     WHERE si.sale_id = ? AND si.voided = 0`,
    [saleId],
  );

  return {
    ...saleRows[0],
    items: itemRows,
  };
};

export {
  createSale,
  addSaleItem,
  getSaleItemById,
  voidItem,
  getTodaySales,
  getSaleById,
  getSaleWithItems,
};
