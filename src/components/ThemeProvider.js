"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

const THEME_STORAGE_KEY = "rezumix-theme";

const ThemeContext = createContext(null);

const getSystemTheme = () => {
  if (typeof window === "undefined") {
    return "dark";
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const applyTheme = (theme) => {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("dark");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
    const resolvedTheme = storedTheme === "light" || storedTheme === "dark" ? storedTheme : getSystemTheme();

    setTheme(resolvedTheme);
    applyTheme(resolvedTheme);
    setReady(true);

    if (!storedTheme) {
      window.localStorage.setItem(THEME_STORAGE_KEY, resolvedTheme);
    }
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    applyTheme(theme);
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [ready, theme]);

  const value = useMemo(
    () => ({
      theme,
      isDark: theme === "dark",
      isLight: theme === "light",
      setTheme,
      toggleTheme: () => setTheme((currentTheme) => (currentTheme === "dark" ? "light" : "dark")),
    }),
    [theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}