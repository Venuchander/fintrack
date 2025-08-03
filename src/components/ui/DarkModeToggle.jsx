import React, { useEffect, useState } from "react";

const DarkModeToggle = () => {
  const [isDark, setIsDark] = useState(() => {
    // Check localStorage first, else check system preference
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  // Ensure correct theme is applied on initial mount
  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <div className="flex items-center">
      <label className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
        <input
          type="checkbox"
          checked={isDark}
          onChange={() => setIsDark(!isDark)}
          className="sr-only peer"
        />
        {/* Track */}
        <div className="absolute h-full w-full rounded-full bg-black dark:bg-white peer-checked:bg-black dark:peer-checked:bg-white transition-colors" />
        {/* Knob */}
        <div className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 transform rounded-full bg-white dark:bg-black shadow-md transition-transform peer-checked:translate-x-5" />
      </label>
    </div>
  );
};

export default DarkModeToggle;
