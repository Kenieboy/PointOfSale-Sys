import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./components/Login";
import POS from "./components/POS";
import AdminDashboard from "./components/AdminDashboard";
import Reports from "./components/Reports";
import Navbar from "./components/Navbar";
import Settings from "./components/Settings";
import { SettingsProvider } from "./context/SettingsContext";

const PrivateRoute = ({ children, adminOnly }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) return <Navigate to="/login" />;
  if (adminOnly && user.role !== "admin") return <Navigate to="/pos" />;

  return (
    <>
      <Navbar />
      {children}
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/pos"
              element={
                <PrivateRoute>
                  <POS />
                </PrivateRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute adminOnly>
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <PrivateRoute adminOnly>
                  <Reports />
                </PrivateRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <PrivateRoute adminOnly>
                  <Settings />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<Navigate to="/pos" />} />
          </Routes>
        </Router>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
