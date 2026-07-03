"use client";

import { Clock3, Monitor, MoonStar, Palette, SunMedium } from "lucide-react";
import { useEffect, useState } from "react";
import { type ThemeMode, useTheme } from "@/components/theme-provider";

const themeOptions: Array<{
  mode: ThemeMode;
  label: string;
  icon: typeof SunMedium;
}> = [
  { mode: "light", label: "Light", icon: SunMedium },
  { mode: "dark", label: "Dark", icon: MoonStar },
  { mode: "system", label: "System", icon: Monitor },
  { mode: "auto", label: "7am-7pm", icon: Clock3 }
];

export function ThemeSwitcher() {
  const { mode, resolvedTheme, setMode } = useTheme();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="theme-switcher">
      <button
        type="button"
        className="icon-button"
        aria-expanded={open}
        aria-label="Change theme"
        onClick={() => setOpen((current) => !current)}
      >
        <Palette size={18} />
        <span className="theme-switcher-label">
          {mode}
          <small>{resolvedTheme}</small>
        </span>
      </button>

      {open ? (
        <div className="theme-menu" role="menu" aria-label="Theme options">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const active = option.mode === mode;

            return (
              <button
                key={option.mode}
                type="button"
                className={`theme-option${active ? " theme-option-active" : ""}`}
                onClick={() => {
                  setMode(option.mode);
                  setOpen(false);
                }}
              >
                <Icon size={17} />
                <span>{option.label}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
