import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const Settings = () => {
  const [settings, setSettings] = useState([]);
  const [formData, setFormData] = useState({});
  const [users, setUsers] = useState([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({
    name: "",
    username: "",
    password: "",
    role: "cashier",
    adminKey: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    fetchSettings();
    fetchUsers();
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

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/users", getAuthHeaders());
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
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

  const handleUserFormChange = (field, value) => {
    setUserForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetUserForm = () => {
    setUserForm({
      name: "",
      username: "",
      password: "",
      role: "cashier",
      adminKey: "",
    });
    setEditingUser(null);
    setShowUserForm(false);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      if (editingUser) {
        await axios.put(
          `/api/users/${editingUser.id}`,
          {
            ...userForm,
            password: userForm.password || undefined,
          },
          getAuthHeaders(),
        );
        setMessage("✅ User updated successfully!");
      } else {
        await axios.post("/api/users", userForm, getAuthHeaders());
        setMessage("✅ User created successfully!");
      }
      resetUserForm();
      fetchUsers();
      setTimeout(() => setMessage(""), 4000);
    } catch (error) {
      setMessage(`❌ ${error.response?.data?.message || "Error saving user"}`);
      setTimeout(() => setMessage(""), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      username: user.username,
      password: "",
      role: user.role,
      adminKey: user.admin_key || "",
    });
    setShowUserForm(true);
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Are you sure you want to delete this user?")) return;

    try {
      await axios.delete(`/api/users/${userId}`, getAuthHeaders());
      setMessage("✅ User deleted successfully!");
      fetchUsers();
      setTimeout(() => setMessage(""), 4000);
    } catch (error) {
      setMessage(
        `❌ ${error.response?.data?.message || "Error deleting user"}`,
      );
      setTimeout(() => setMessage(""), 4000);
    }
  };

  const renderInput = (setting) => {
    const { setting_key, setting_type } = setting;
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
      <div className="max-w-5xl mx-auto p-6 flex items-center justify-center h-64">
        <div className="text-gray-400">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">⚙️ System Settings</h1>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
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

      {/* User Management Section */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            👥 User Management
          </h2>
          <button
            onClick={() => {
              resetUserForm();
              setShowUserForm(true);
            }}
            className="btn-primary text-sm px-4 py-2"
          >
            ➕ Add User
          </button>
        </div>

        {/* Add/Edit User Form */}
        {showUserForm && (
          <form
            onSubmit={handleSaveUser}
            className="bg-gray-50 rounded-xl p-5 space-y-4 border border-gray-200"
          >
            <h3 className="font-bold text-gray-900">
              {editingUser ? "✏️ Edit User" : "➕ Add New User"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  value={userForm.name}
                  onChange={(e) => handleUserFormChange("name", e.target.value)}
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Username
                </label>
                <input
                  type="text"
                  value={userForm.username}
                  onChange={(e) =>
                    handleUserFormChange("username", e.target.value)
                  }
                  className="input-field"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password{" "}
                  {editingUser && (
                    <span className="text-xs text-gray-400 font-normal">
                      (leave blank to keep current)
                    </span>
                  )}
                </label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) =>
                    handleUserFormChange("password", e.target.value)
                  }
                  className="input-field"
                  required={!editingUser}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Role
                </label>
                <select
                  value={userForm.role}
                  onChange={(e) => handleUserFormChange("role", e.target.value)}
                  className="input-field"
                >
                  <option value="cashier">Cashier</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {userForm.role === "admin" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Admin Key
                  </label>
                  <input
                    type="text"
                    value={userForm.adminKey}
                    onChange={(e) =>
                      handleUserFormChange("adminKey", e.target.value)
                    }
                    className="input-field"
                    placeholder="Used for void approval"
                    required={userForm.role === "admin"}
                  />
                </div>
              )}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={resetUserForm}
                className="btn-secondary px-6"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary px-6 disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingUser
                    ? "Update User"
                    : "Create User"}
              </button>
            </div>
          </form>
        )}

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                  Name
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                  Username
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                  Role
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                  Admin Key
                </th>
                <th className="text-center text-xs font-semibold text-gray-500 uppercase px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-4 py-8 text-center text-gray-400 text-sm"
                  >
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {user.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {user.username}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          user.role === "admin"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                      {user.admin_key || "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-xs font-medium text-primary-600 hover:text-primary-800 bg-primary-50 hover:bg-primary-100 px-2.5 py-1 rounded transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Toast Notification */}
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
