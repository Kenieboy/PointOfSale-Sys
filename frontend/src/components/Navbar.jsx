import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navLinkClass = (path) =>
    `px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
      isActive(path)
        ? "bg-primary-100 text-primary-700"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  const handleLogout = async () => {
    await logout();
    window.location.href = "/login"; // Hard redirect to clear any state
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center gap-8">
            <Link
              to="/pos"
              className="flex items-center gap-2 text-xl font-bold text-primary-600"
            >
              <span>🛒</span>
              <span>POS</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              <Link to="/pos" className={navLinkClass("/pos")}>
                POS Terminal
              </Link>
              {user?.role === "admin" && (
                <>
                  <Link to="/dashboard" className={navLinkClass("/admin")}>
                    Dashboard
                  </Link>
                  <Link to="/reports" className={navLinkClass("/reports")}>
                    Reports
                  </Link>
                  <Link to="/settings" className={navLinkClass("/settings")}>
                    Settings
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
              <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">{user?.name}</span>
                <span className="text-xs text-gray-500 capitalize">
                  {user?.role}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="text-sm font-medium text-red-600 hover:text-red-700 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
