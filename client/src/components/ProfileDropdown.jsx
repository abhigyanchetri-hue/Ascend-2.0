// ProfileDropdown — the avatar button in the navbar and its little menu
// with mini stats, a link to the profile page, and logout.
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// "Rahul Sharma" → "RS"
function initialsOf(name) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word[0].toUpperCase())
      .join('') || '?'
  );
}

export default function ProfileDropdown() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Close the menu when clicking anywhere outside it.
  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const handleLogout = () => {
    setOpen(false);
    logout();
    navigate('/login');
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open profile menu"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-xs font-semibold text-white transition-transform duration-150 hover:scale-105"
      >
        {initialsOf(user.name)}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border border-line bg-card p-4 shadow-card">
          <p className="text-sm font-semibold">{user.name}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>

          {/* Mini stats */}
          <div className="mt-3 grid grid-cols-3 gap-2 rounded-md bg-background p-2 text-center">
            <div>
              <p className="text-sm font-semibold">Lv {user.level}</p>
              <p className="text-[10px] text-muted">{user.levelTitle}</p>
            </div>
            <div>
              <p className="text-sm font-semibold">🔥 {user.streak}</p>
              <p className="text-[10px] text-muted">day streak</p>
            </div>
            <div>
              <p className="text-sm font-semibold">{user.totalExp.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-muted">total EXP</p>
            </div>
          </div>

          <div className="mt-3 space-y-1">
            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-ink transition-colors duration-150 hover:bg-hoverbg"
            >
              <User size={15} className="text-muted" /> View profile
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-danger transition-colors duration-150 hover:bg-danger-soft"
            >
              <LogOut size={15} /> Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
