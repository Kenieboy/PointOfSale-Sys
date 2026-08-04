import pool from "../config/db.js";

const findByUsername = async (username) => {
  const [rows] = await pool.query("SELECT * FROM users WHERE username = ?", [
    username,
  ]);
  return rows[0] || null;
};

const findById = async (id) => {
  const [rows] = await pool.query(
    "SELECT id, username, name, role FROM users WHERE id = ?",
    [id],
  );
  return rows[0] || null;
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

export { findByUsername, findById, verifyAdminKey, createUser };
