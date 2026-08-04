import pool from "../config/db.js";

const getAll = async () => {
  const [rows] = await pool.query(
    "SELECT * FROM settings ORDER BY setting_key",
  );
  return rows;
};

const getByKey = async (key) => {
  const [rows] = await pool.query(
    "SELECT * FROM settings WHERE setting_key = ?",
    [key],
  );
  return rows[0] || null;
};

const getMultiple = async (keys) => {
  const placeholders = keys.map(() => "?").join(",");
  const [rows] = await pool.query(
    `SELECT * FROM settings WHERE setting_key IN (${placeholders})`,
    keys,
  );
  return rows;
};

const update = async (key, value, userId) => {
  const [result] = await pool.query(
    "UPDATE settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?",
    [value, userId, key],
  );
  return result.affectedRows > 0;
};

const updateBulk = async (settings, userId) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    for (const { key, value } of settings) {
      await connection.query(
        "UPDATE settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?",
        [value, userId, key],
      );
    }
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

const create = async (settingData) => {
  const { key, value, type, description } = settingData;
  const [result] = await pool.query(
    "INSERT INTO settings (setting_key, setting_value, setting_type, description) VALUES (?, ?, ?, ?)",
    [key, value, type || "string", description],
  );
  return result.insertId;
};

export { getAll, getByKey, getMultiple, update, updateBulk, create };
