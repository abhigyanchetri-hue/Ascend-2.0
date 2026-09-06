// ProfilePage — avatar, level & title, stat cards, and profile editing.
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, LogOut, Pencil } from 'lucide-react';
import { api } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useLevel } from '../hooks/useLevel';

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

// Small rounded stat card used in the grid below.
function StatCard({ label, children }) {
  return (
    <div className="rounded-lg border border-line bg-card p-4 text-center shadow-card">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
      <div className="mt-1.5 text-lg font-semibold">{children}</div>
    </div>
  );
}

// Inline "Edit Profile" form.
function EditProfileForm({ onSaved, onCancel }) {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const patch = { name, email };
      if (password) patch.password = password;
      await api.put('/auth/me', patch);
      await refreshUser();
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    'w-full rounded-md border border-line bg-card px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-forest';
  const labelClass = 'mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted';

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-3 rounded-lg border border-line bg-card p-5 shadow-card">
      <h2 className="text-sm font-semibold">Edit profile</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Name</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>New password (leave blank to keep current)</label>
          <input
            type="password"
            className={inputClass}
            value={password}
            placeholder="••••••••"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>
      {error && <p className="text-xs text-danger">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-forest px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-forest-dark disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md px-4 py-2 text-sm text-muted transition-colors duration-150 hover:bg-hoverbg hover:text-ink"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const level = useLevel(user);
  const [summary, setSummary] = useState(null);
  const [editing, setEditing] = useState(false);
  const [savedNote, setSavedNote] = useState('');

  useEffect(() => {
    api
      .get('/stats/summary')
      .then(setSummary)
      .catch(() => setSummary(null));
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSaved = () => {
    setEditing(false);
    setSavedNote('Profile updated.');
    setTimeout(() => setSavedNote(''), 3000);
  };

  return (
    <div className="mx-auto max-w-2xl">
      {/* Identity */}
      <div className="text-center">
        <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-forest text-xl font-semibold text-white shadow-card">
          {initialsOf(user.name)}
        </span>
        <h1 className="mt-3 text-lg font-semibold">{user.name}</h1>
        <p className="text-sm text-muted">
          Level {level.level} · {level.title}
        </p>
        {savedNote && <p className="mt-1 text-xs font-medium text-forest">{savedNote}</p>}
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="Total EXP">
          {user.totalExp.toLocaleString('en-IN')}
        </StatCard>
        <StatCard label="Level progress">
          {level.currentExp} / {level.expForNext}
        </StatCard>
        <StatCard label="Streak">
          <span className="flex items-center justify-center gap-1">
            <Flame size={16} className="text-warm" /> {user.streak} days
          </span>
        </StatCard>
        <StatCard label="Longest streak">{user.longestStreak} days</StatCard>
        <StatCard label="Tasks done">{summary ? summary.totalTasksCompleted : '…'}</StatCard>
        <StatCard label="Active plans">{summary ? summary.activePlans : '…'}</StatCard>
      </div>

      {/* Mini EXP bar */}
      <div className="mt-4">
        <div className="h-2 overflow-hidden rounded-full bg-track">
          <div
            className="exp-bar-fill h-full rounded-full bg-forest"
            style={{ width: `${level.percent}%` }}
          />
        </div>
        <p className="mt-1 text-right text-xs text-muted">
          {level.currentExp} / {level.expForNext} EXP to Level {level.level + 1}
        </p>
      </div>

      {/* Actions */}
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="flex items-center gap-1.5 rounded-md border border-line px-4 py-2 text-sm font-medium text-ink transition-colors duration-150 hover:bg-hoverbg"
        >
          <Pencil size={14} /> Edit Profile
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-md border border-danger/30 px-4 py-2 text-sm font-medium text-danger transition-colors duration-150 hover:bg-danger-soft"
        >
          <LogOut size={14} /> Logout
        </button>
      </div>

      {editing && (
        <EditProfileForm onSaved={handleSaved} onCancel={() => setEditing(false)} />
      )}
    </div>
  );
}
