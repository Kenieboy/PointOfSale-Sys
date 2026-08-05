import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as User from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax", // lax is safer for dev proxy
  path: "/api", // ✅ CRITICAL: cookie available on ALL routes
  maxAge: 8 * 60 * 60 * 1000,
};

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: "8h" },
    );

    // Set HTTP-only cookie
    res.cookie("token", token, COOKIE_OPTIONS);

    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const logout = (req, res) => {
  res.clearCookie("token", COOKIE_OPTIONS);
  res.json({ message: "Logged out successfully" });
};

const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      id: user.id,
      username: user.username,
      role: user.role,
      name: user.name,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const verifyAdminKey = async (req, res) => {
  const { adminKey } = req.body;

  try {
    const admin = await User.verifyAdminKey(adminKey);
    if (!admin) {
      return res.status(401).json({ message: "Invalid admin key" });
    }
    res.json({ valid: true, admin });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export { login, logout, me, verifyAdminKey };
