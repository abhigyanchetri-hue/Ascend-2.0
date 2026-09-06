// Signup page — creates an account and drops you straight into Home at Level 1.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mountain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await signup(name, email, password);
      navigate('/home');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-forest text-white shadow-card">
            <Mountain size={24} strokeWidth={2.5} />
          </span>
          <h1 className="text-xl font-semibold">Ascend</h1>
          <p className="text-sm text-muted">Rise one step at a time.</p>
        </div>

        <div className="rounded-lg border border-line bg-card p-6 shadow-card">
          <h2 className="mb-4 text-sm font-semibold">Create your account</h2>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Rahul Sharma"
                className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-forest"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-forest"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-forest"
              />
            </div>

            {error && <p className="text-xs text-danger">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-forest py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-forest-dark disabled:opacity-60"
            >
              {busy ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-forest hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
