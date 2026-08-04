import React, { useState } from "react";
import axios from "axios";

const VoidAuthModal = ({ isOpen, onClose, onConfirm, itemName }) => {
  const [adminKey, setAdminKey] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post("/api/auth/verify-admin-key", {
        adminKey,
      });

      if (response.data.valid) {
        onConfirm(reason, response.data.admin.id);
        setAdminKey("");
        setReason("");
        onClose();
      }
    } catch (err) {
      setError("Invalid admin key. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="card w-full max-w-md p-6 animate-fadeIn">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-xl">
            🔐
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Admin Authorization
            </h2>
            <p className="text-sm text-gray-500">
              Approval required to void item
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-5">
          <p className="text-sm text-amber-800">
            Voiding: <span className="font-semibold">{itemName}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Admin Key
            </label>
            <input
              type="password"
              value={adminKey}
              onChange={(e) => setAdminKey(e.target.value)}
              placeholder="Enter admin authorization key"
              className="input-field"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Reason for Void
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why is this item being voided?"
              className="input-field resize-none"
              rows="3"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-danger flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Verifying..." : "Confirm Void"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VoidAuthModal;
