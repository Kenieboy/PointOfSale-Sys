import pool from "../config/db.js";

const getDailySummary = async (date) => {
  const [rows] = await pool.query(
    `
    SELECT 
      COUNT(DISTINCT s.id) as total_transactions,
      SUM(si.total_price) as total_sales,
      SUM(si.quantity) as total_items,
      AVG(si.total_price) as average_sale
    FROM sales s
    JOIN sale_items si ON s.id = si.sale_id
    WHERE DATE(s.created_at) = ? AND s.status = 'completed' AND si.voided = 0
  `,
    [date],
  );
  return rows[0];
};

const getDailyPaymentBreakdown = async (date) => {
  const [rows] = await pool.query(
    `
    SELECT 
      payment_method,
      COUNT(*) as count,
      SUM(total_amount) as total
    FROM sales
    WHERE DATE(created_at) = ? AND status = 'completed'
    GROUP BY payment_method
  `,
    [date],
  );
  return rows;
};

const getDailyCategoryBreakdown = async (date) => {
  const [rows] = await pool.query(
    `
    SELECT 
      p.category,
      SUM(si.quantity) as items_sold,
      SUM(si.total_price) as revenue
    FROM sales s
    JOIN sale_items si ON s.id = si.sale_id
    JOIN products p ON si.product_id = p.id
    WHERE DATE(s.created_at) = ? AND s.status = 'completed' AND si.voided = 0
    GROUP BY p.category
  `,
    [date],
  );
  return rows;
};

const getDailyHourlyBreakdown = async (date) => {
  const [rows] = await pool.query(
    `
    SELECT 
      HOUR(s.created_at) as hour,
      COUNT(*) as transactions,
      SUM(si.total_price) as sales
    FROM sales s
    JOIN sale_items si ON s.id = si.sale_id
    WHERE DATE(s.created_at) = ? AND s.status = 'completed' AND si.voided = 0
    GROUP BY HOUR(s.created_at)
    ORDER BY hour
  `,
    [date],
  );
  return rows;
};

const getMonthlySummary = async (year, month) => {
  const [rows] = await pool.query(
    `
    SELECT 
      COUNT(DISTINCT s.id) as total_transactions,
      SUM(si.total_price) as total_sales,
      SUM(si.quantity) as total_items
    FROM sales s
    JOIN sale_items si ON s.id = si.sale_id
    WHERE YEAR(s.created_at) = ? AND MONTH(s.created_at) = ? 
      AND s.status = 'completed' AND si.voided = 0
  `,
    [year, month],
  );
  return rows[0];
};

const getMonthlyDailyBreakdown = async (year, month) => {
  const [rows] = await pool.query(
    `
    SELECT 
      DATE(s.created_at) as date,
      COUNT(DISTINCT s.id) as transactions,
      SUM(si.total_price) as sales,
      SUM(si.quantity) as items
    FROM sales s
    JOIN sale_items si ON s.id = si.sale_id
    WHERE YEAR(s.created_at) = ? AND MONTH(s.created_at) = ? 
      AND s.status = 'completed' AND si.voided = 0
    GROUP BY DATE(s.created_at)
    ORDER BY date
  `,
    [year, month],
  );
  return rows;
};

const getMonthlyTopProducts = async (year, month, limit = 10) => {
  const [rows] = await pool.query(
    `
    SELECT 
      p.name,
      SUM(si.quantity) as quantity_sold,
      SUM(si.total_price) as revenue
    FROM sales s
    JOIN sale_items si ON s.id = si.sale_id
    JOIN products p ON si.product_id = p.id
    WHERE YEAR(s.created_at) = ? AND MONTH(s.created_at) = ? 
      AND s.status = 'completed' AND si.voided = 0
    GROUP BY p.id, p.name
    ORDER BY revenue DESC
    LIMIT ?
  `,
    [year, month, limit],
  );
  return rows;
};

const getMonthlyVoidedItems = async (year, month) => {
  const [rows] = await pool.query(
    `
    SELECT 
      COUNT(*) as void_count,
      SUM(total_price) as voided_amount
    FROM voided_items
    WHERE YEAR(created_at) = ? AND MONTH(created_at) = ?
  `,
    [year, month],
  );
  return rows[0];
};

export {
  getDailySummary,
  getDailyPaymentBreakdown,
  getDailyCategoryBreakdown,
  getDailyHourlyBreakdown,
  getMonthlySummary,
  getMonthlyDailyBreakdown,
  getMonthlyTopProducts,
  getMonthlyVoidedItems,
};
