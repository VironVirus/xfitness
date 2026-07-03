"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark" | "system" | "auto";
export type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setMode: (mode: ThemeMode) => void;
};

const STORAGE_KEY = "xfitness-theme-mode";
const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveTheme(mode: ThemeMode, systemPrefersDark: boolean) {
  if (mode === "light") {
    return "light";
  }

  if (mode === "dark") {
    return "dark";
  }

  if (mode === "auto") {
    const hour = new Date().getHours();
    return hour >= 7 && hour < 19 ? "light" : "dark";
  }

  return systemPrefersDark ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>("dark");

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedMode = window.localStorage.getItem(STORAGE_KEY);
    if (
      storedMode === "light" ||
      storedMode === "dark" ||
      storedMode === "system" ||
      storedMode === "auto"
    ) {
      setMode(storedMode);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const nextTheme = resolveTheme(mode, media.matches);
      setResolvedTheme(nextTheme);
      document.documentElement.dataset.theme = nextTheme;
      document.documentElement.dataset.themeMode = mode;
    };

    applyTheme();
    window.localStorage.setItem(STORAGE_KEY, mode);

    const handleSystemTheme = () => {
      applyTheme();
    };

    media.addEventListener("change", handleSystemTheme);
    const timer = window.setInterval(() => {
      if (mode === "auto") {
        applyTheme();
      }
    }, 60_000);

    return () => {
      media.removeEventListener("change", handleSystemTheme);
      window.clearInterval(timer);
    };
  }, [mode]);

  const value = useMemo(
    () => ({
      mode,
      resolvedTheme,
      setMode
    }),
    [mode, resolvedTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used inside ThemeProvider");
  }

  return context;
}
