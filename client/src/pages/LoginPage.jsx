// Login page — simple centered card, with a one-click demo account button.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mountain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Shown to judges/reviewers so they can explore instantly.
const DEMO_CREDENTIALS = { email: 'rahul@ascend.app', password: 'demo1234' };

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const doLogin = async (loginEmail, loginPassword) => {
    setBusy(true);
    setError('');
    try {
      await login(loginEmail, loginPassword);
      navigate('/home');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    doLogin(email, password);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        {/* Logo & tagline */}
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-forest text-white shadow-card">
            <Mountain size={24} strokeWidth={2.5} />
          </span>
          <h1 className="text-xl font-semibold">Ascend</h1>
          <p className="text-sm text-muted">Rise one step at a time.</p>
        </div>

        <div className="rounded-lg border border-line bg-card p-6 shadow-card">
          <h2 className="mb-4 text-sm font-semibold">Welcome back</h2>

          <form onSubmit={handleSubmit} className="space-y-3">
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
                placeholder="••••••••"
                className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm outline-none transition-colors duration-150 focus:border-forest"
              />
            </div>

            {error && <p className="text-xs text-danger">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-forest py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-forest-dark disabled:opacity-60"
            >
              {busy ? 'Signing in…' : 'Log in'}
            </button>
          </form>

          {/* Demo shortcut */}
          <div className="my-4 flex items-center gap-3 text-[11px] text-muted">
            <span className="h-px flex-1 bg-line" />
            just exploring?
            <span className="h-px flex-1 bg-line" />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={() => doLogin(DEMO_CREDENTIALS.email, DEMO_CREDENTIALS.password)}
            className="w-full rounded-md border border-forest/40 py-2 text-sm font-semibold text-forest transition-colors duration-150 hover:bg-forest-light disabled:opacity-60"
          >
            Try the demo account
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-muted">
          New here?{' '}
          <Link to="/signup" className="font-semibold text-forest hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
