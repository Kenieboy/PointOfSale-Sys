import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Settings = () => {
  const [settings, setSettings] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await axios.get("/api/settings", getAuthHeaders());
      setSettings(response.data.raw);
      const initial = {};
      response.data.raw.forEach((s) => {
        initial[s.setting_key] = s.setting_value;
      });
      setFormData(initial);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const updates = Object.keys(formData).map((key) => ({
        key,
        value: String(formData[key]),
      }));

      await axios.put("/api/settings", { settings: updates }, getAuthHeaders());
      setMessage("✅ Settings saved successfully!");
      setTimeout(() => setMessage(""), 4000);
    } catch (error) {
      setMessage("❌ Error saving settings");
      setTimeout(() => setMessage(""), 4000);
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (setting) => {
    const { setting_key, setting_type, description } = setting;
    const value = formData[setting_key] || "";

    if (setting_type === "boolean") {
      return (
        <select
          value={value}
          onChange={(e) => handleChange(setting_key, e.target.value)}
          className="input-field"
        >
          <option value="true">Enabled</option>
          <option value="false">Disabled</option>
        </select>
      );
    }

    if (setting_type === "number") {
      return (
        <input
          type="number"
          step="0.01"
          value={value}
          onChange={(e) => handleChange(setting_key, e.target.value)}
          className="input-field"
        />
      );
    }

    return (
      <input
        type="text"
        value={value}
        onChange={(e) => handleChange(setting_key, e.target.value)}
        className="input-field"
      />
    );
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6 flex items-center justify-center h-64">
        <div className="text-gray-400">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">⚙️ System Settings</h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        {/* Store Information */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            🏪 Store Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {settings
              .filter((s) =>
                [
                  "store_name",
                  "store_address",
                  "store_phone",
                  "store_email",
                ].includes(s.setting_key),
              )
              .map((setting) => (
                <div key={setting.setting_key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 capitalize">
                    {setting.setting_key.replace(/_/g, " ")}
                  </label>
                  {renderInput(setting)}
                  {setting.description && (
                    <p className="text-xs text-gray-400 mt-1">
                      {setting.description}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Tax & Currency */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            💰 Tax & Currency
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {settings
              .filter((s) =>
                ["tax_rate", "currency_symbol", "enable_tax"].includes(
                  s.setting_key,
                ),
              )
              .map((setting) => (
                <div key={setting.setting_key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 capitalize">
                    {setting.setting_key.replace(/_/g, " ")}
                  </label>
                  {renderInput(setting)}
                  {setting.description && (
                    <p className="text-xs text-gray-400 mt-1">
                      {setting.description}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Receipt Settings */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">
            🧾 Receipt Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {settings
              .filter((s) =>
                [
                  "receipt_header",
                  "receipt_footer",
                  "receipt_show_change_breakdown",
                ].includes(s.setting_key),
              )
              .map((setting) => (
                <div
                  key={setting.setting_key}
                  className={
                    setting.setting_type === "string" &&
                    String(setting.setting_value).length > 50
                      ? "md:col-span-2"
                      : ""
                  }
                >
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 capitalize">
                    {setting.setting_key.replace(/_/g, " ")}
                  </label>
                  {String(setting.setting_value).length > 50 ? (
                    <textarea
                      value={formData[setting.setting_key] || ""}
                      onChange={(e) =>
                        handleChange(setting.setting_key, e.target.value)
                      }
                      className="input-field resize-none"
                      rows="2"
                    />
                  ) : (
                    renderInput(setting)
                  )}
                  {setting.description && (
                    <p className="text-xs text-gray-400 mt-1">
                      {setting.description}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </div>

        <div className="pt-4 border-t border-gray-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary disabled:opacity-50 px-8"
          >
            {saving ? "Saving..." : "💾 Save Settings"}
          </button>
        </div>
      </form>

      {/* Toast Notification - Same style as POS */}
      {message && (
        <div
          className={`fixed bottom-6 right-6 px-6 py-3 rounded-lg shadow-lg cursor-pointer animate-slideIn z-50 ${
            message.includes("❌") ? "bg-red-500" : "bg-green-500"
          } text-white`}
          onClick={() => setMessage("")}
        >
          <div className="flex items-center gap-2">
            <span>{message.includes("❌") ? "⚠️" : "✅"}</span>
            <span className="font-medium">
              {message.replace(/✅|❌/g, "").trim()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
