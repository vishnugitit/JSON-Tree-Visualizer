// src/components/ThemeToggle.jsx
import React, { useEffect, useState } from 'react';

const THEME_KEY = 'json-tree-theme'; // localStorage key

export default function ThemeToggle() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } catch {
      return 'light';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    // remove both classes to avoid stale
    root.classList.remove('dark', 'light');
    root.classList.add(theme === 'dark' ? 'dark' : 'light');

    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /**/ }
  }, [theme]);

  const toggle = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  return (
    <div className="theme-toggle">
      <button
        className="btn btn-sm btn-outline-secondary"
        onClick={toggle}
        aria-label="Toggle theme"
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? '🌙 Dark' : '☀️ Light'}
      </button>
    </div>
  );
}
