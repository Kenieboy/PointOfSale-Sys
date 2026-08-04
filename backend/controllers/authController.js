import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  findByUsername,
  verifyAdminKey as verifyAdminKeyModel,
} from "../models/User.js";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await findByUsername(username);

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

    res.json({
      token,
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

const verifyAdminKey = async (req, res) => {
  const { adminKey } = req.body;

  try {
    const admin = await verifyAdminKeyModel(adminKey);

    if (!admin) {
      return res.status(401).json({ message: "Invalid admin key" });
    }

    res.json({ valid: true, admin });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default { login, verifyAdminKey };
