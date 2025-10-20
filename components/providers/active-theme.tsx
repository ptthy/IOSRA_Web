"use client";

import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const COOKIE_NAME = "active_theme";
const DEFAULT_THEME = "default";

function setThemeCookie(theme: string) {
  if (typeof window === "undefined") return;

  document.cookie = `${COOKIE_NAME}=${theme}; path=/; max-age=31536000; SameSite=Lax; ${window.location.protocol === "https:" ? "Secure;" : ""}`;
}

function applyThemeToElements(theme: string) {
  if (typeof window === "undefined") return;

  const elementsToUpdate = [document.body, document.documentElement];

  elementsToUpdate.forEach((element) => {
    // Remove all existing theme classes
    Array.from(element.classList)
      .filter((className) => className.startsWith("theme-"))
      .forEach((className) => {
        element.classList.remove(className);
      });

    // Add new theme classes
    element.classList.add(`theme-${theme}`);
    if (theme.endsWith("-scaled")) {
      element.classList.add("theme-scaled");
    }
  });
}

type ThemeContextType = {
  activeTheme: string;
  setActiveTheme: (theme: string) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ActiveThemeProvider({
  children,
  initialTheme,
}: {
  children: ReactNode;
  initialTheme?: string;
}) {
  const [activeTheme, setActiveTheme] = useState<string>(
    () => initialTheme || DEFAULT_THEME,
  );
  useEffect(() => {
    const themeToApply = activeTheme || DEFAULT_THEME;
    applyThemeToElements(themeToApply);

    setThemeCookie(themeToApply);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setThemeCookie(activeTheme);
    applyThemeToElements(activeTheme);
  }, [activeTheme]);

  return (
    <ThemeContext.Provider value={{ activeTheme, setActiveTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeConfig() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error(
      "useThemeConfig must be used within an ActiveThemeProvider",
    );
  }
  return context;
}