import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  use,
} from "react";
import axios from "axios";

// Tell axios to always send cookies with requests
axios.defaults.withCredentials = true;

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await axios.get("/api/auth/me");
        setUser(response.data);
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  });

  const login = async (username, password) => {
    const response = await axios.post("/api/auth/login", {
      username,
      password,
    });
    const { user } = response.data;
    setUser(user);
    return user;
  };

  const logout = async () => {
    await axios.post("/api/auth/logout");
    setUser(null);
  };

  // No more manual getAuthHeaders needed — cookie sends automatically
  const getAuthHeaders = () => ({});

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, getAuthHeaders }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
