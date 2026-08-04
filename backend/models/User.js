import pool from "../config/db.js";

const findByUsername = async (username) => {
  const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [
    username,
  ]);
  return rows[0] || null;
};

const findById = async (id) => {
  const [rows] = await pool.query(
    "SELECT id, username, name, role, admin_key, created_at FROM users WHERE id = ?",
    [id],
  );
  return rows[0] || null;
};

const getAllUsers = async () => {
  const [rows] = await pool.query(
    "SELECT id, username, name, role, admin_key, created_at FROM users ORDER BY created_at DESC",
  );
  return rows;
};

const verifyAdminKey = async (adminKey) => {
  const [rows] = await pool.query(
    'SELECT id, username, name FROM users WHERE role = "admin" AND admin_key = ?',
    [adminKey],
  );
  return rows[0] || null;
};

const createUser = async (userData) => {
  const { username, password, name, role, adminKey } = userData;
  const [result] = await pool.query(
    "INSERT INTO users (username, password, name, role, admin_key) VALUES (?, ?, ?, ?, ?)",
    [username, password, name, role, adminKey || null],
  );
  return result.insertId;
};

const updateUser = async (id, userData) => {
  const { username, name, role, adminKey } = userData;
  const [result] = await pool.query(
    "UPDATE users SET username = ?, name = ?, role = ?, admin_key = ? WHERE id = ?",
    [username, name, role, adminKey || null, id],
  );
  return result.affectedRows > 0;
};

const updatePassword = async (id, hashedPassword) => {
  const [result] = await pool.query(
    "UPDATE users SET password = ? WHERE id = ?",
    [hashedPassword, id],
  );
  return result.affectedRows > 0;
};

const deleteUser = async (id) => {
  const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);
  return result.affectedRows > 0;
};

export {
  findByUsername,
  findById,
  getAllUsers,
  verifyAdminKey,
  createUser,
  updateUser,
  updatePassword,
  deleteUser,
};
