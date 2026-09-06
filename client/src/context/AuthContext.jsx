// AuthContext — holds the logged-in user and the auth actions.
// Any component can call useAuth() to read the user or log in/out.
import { createContext, useContext, useEffect, useState } from 'react';
import { api, tokenStorage } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load: if we have a saved token, check it is still valid.
  useEffect(() => {
    const token = tokenStorage.get();
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => tokenStorage.clear())
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    tokenStorage.set(data.token);
    setUser(data.user);
  };

  const signup = async (name, email, password) => {
    const data = await api.post('/auth/register', { name, email, password });
    tokenStorage.set(data.token);
    setUser(data.user);
  };

  const logout = () => {
    tokenStorage.clear();
    setUser(null);
  };

  // Syncs the user object after EXP changes (task ticks) so the level
  // bar moves instantly without a refetch.
  const applyUser = (freshUser) => setUser(freshUser);

  const refreshUser = async () => {
    const data = await api.get('/auth/me');
    setUser(data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, applyUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
