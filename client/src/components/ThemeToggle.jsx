// ThemeToggle — the sun/moon button in the navbar that switches between
// light and dark mode. The choice is saved to localStorage and re-applied
// before first paint by a tiny script in index.html (no flash on reload).
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const THEME_KEY = 'ascend_theme';

// Read the theme that index.html already applied to <html>.
function currentTheme() {
  try {
    const saved = window.localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch {
    // localStorage unavailable — fall through to the class on <html>
  }
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState(currentTheme);
  const isDark = theme === 'dark';

  // Keep <html class="dark"> and storage in sync whenever the theme changes.
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      // storage unavailable — the toggle still works for this session
    }
  }, [theme, isDark]);

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors duration-150 hover:bg-hoverbg hover:text-ink"
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
