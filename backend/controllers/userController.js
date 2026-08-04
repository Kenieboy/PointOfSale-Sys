import bcrypt from "bcryptjs";
import * as User from "../models/User.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.getAllUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { username, password, name, role, adminKey } = req.body;

    const existing = await User.findByUsername(username);
    if (existing) {
      return res.status(400).json({ message: "Username already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const userId = await User.createUser({
      username,
      password: hashedPassword,
      name,
      role,
      adminKey: role === "admin" ? adminKey : null,
    });

    res.status(201).json({ id: userId, message: "User created successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, name, role, adminKey, password } = req.body;

    const existing = await User.findById(id);
    if (!existing) {
      return res.status(404).json({ message: "User not found" });
    }

    await User.updateUser(id, {
      username,
      name,
      role,
      adminKey: role === "admin" ? adminKey : null,
    });

    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      await User.updatePassword(id, hashedPassword);
    }

    res.json({ message: "User updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.id;

    if (parseInt(id) === currentUserId) {
      return res
        .status(400)
        .json({ message: "Cannot delete your own account" });
    }

    const success = await User.deleteUser(id);
    if (!success) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
