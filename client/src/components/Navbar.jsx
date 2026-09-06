// Top navigation — logo, main links, theme toggle, and the profile menu.
// On phones the link labels hide and only icons remain, so everything fits.
import { NavLink } from 'react-router-dom';
import { Mountain, ListTodo, Target, Calendar } from 'lucide-react';
import ProfileDropdown from './ProfileDropdown.jsx';
import ThemeToggle from './ThemeToggle.jsx';

const LINKS = [
  { to: '/home', label: 'Home', Icon: ListTodo },
  { to: '/plans', label: 'Plans', Icon: Target },
  { to: '/calendar', label: 'Calendar', Icon: Calendar },
];

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-card">
      <div className="mx-auto flex h-14 w-full max-w-[960px] items-center justify-between gap-2 px-3 sm:px-4">
        {/* Logo + main links */}
        <div className="flex min-w-0 items-center gap-3 sm:gap-6">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-forest text-white">
              <Mountain size={17} strokeWidth={2.5} />
            </span>
            <span className="hidden text-[15px] font-semibold sm:inline">Ascend</span>
          </div>

          <nav className="flex items-center gap-0.5 sm:gap-1">
            {LINKS.map(({ to, label, Icon }) => (
              <NavLink
                key={to}
                to={to}
                title={label}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors duration-150 sm:px-3 ${
                    isActive
                      ? 'bg-forest-light font-semibold text-forest'
                      : 'text-muted hover:bg-hoverbg hover:text-ink'
                  }`
                }
              >
                <Icon size={15} />
                {/* Icon-only on phones, full label from small tablets up */}
                <span className="hidden sm:inline">{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Right side: theme switch + profile */}
        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          <ProfileDropdown />
        </div>
      </div>
    </header>
  );
}
