import {
  getAll,
  getByKey,
  getMultiple,
  update,
  updateBulk,
} from "../models/Setting.js";

const getAllSettings = async (req, res) => {
  try {
    const settings = await getAll();
    // Convert to key-value object for easier frontend use
    const settingsObj = {};
    settings.forEach((s) => {
      let value = s.setting_value;
      if (s.setting_type === "number") value = parseFloat(value) || 0;
      if (s.setting_type === "boolean") value = value === "true";
      if (s.setting_type === "json") {
        try {
          value = JSON.parse(value);
        } catch {
          value = {};
        }
      }
      settingsObj[s.setting_key] = value;
    });
    res.json({ raw: settings, formatted: settingsObj });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getPublicSettings = async (req, res) => {
  try {
    const keys = [
      "store_name",
      "store_address",
      "store_phone",
      "currency_symbol",
      "tax_rate",
      "enable_tax",
    ];
    const settings = await getMultiple(keys);
    const settingsObj = {};
    settings.forEach((s) => {
      let value = s.setting_value;
      if (s.setting_type === "number") value = parseFloat(value) || 0;
      if (s.setting_type === "boolean") value = value === "true";
      settingsObj[s.setting_key] = value;
    });
    res.json(settingsObj);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    const { settings } = req.body; // Array of { key, value }
    const userId = req.user.id;

    await updateBulk(settings, userId);
    res.json({ message: "Settings updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export default { getAllSettings, getPublicSettings, updateSettings };
