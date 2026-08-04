import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const SettingsContext = createContext(null);

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const response = await axios.get("/api/settings/public");
      setSettings(response.data);
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const getSetting = (key, defaultValue = "") => {
    return settings[key] !== undefined ? settings[key] : defaultValue;
  };

  return (
    <SettingsContext.Provider
      value={{ settings, loading, getSetting, refreshSettings: fetchSettings }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
