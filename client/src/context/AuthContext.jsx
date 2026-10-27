import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { TOKEN_KEY } from '../api/axios';

const AuthContext = createContext(null);

// NOTE: localStorage keeps the demo simple, as the project specification requires.
// Production apps should prefer HttpOnly cookies so scripts cannot read the token.
export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY));

  // Restore the session after a refresh.
  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) { setLoading(false); return; }
    api.get('/auth/me')
      .then((res) => setUser(res.data.user))
      .catch(() => { localStorage.removeItem(TOKEN_KEY); setToken(null); })
      .finally(() => setLoading(false));
  }, []);

  // Fired by the Axios interceptor on an expired/invalid token.
  useEffect(() => {
    const clear = () => { setUser(null); setToken(null); };
    window.addEventListener('roomly:unauthorized', clear);
    return () => window.removeEventListener('roomly:unauthorized', clear);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem(TOKEN_KEY, res.data.token);
    setToken(res.data.token);
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (form) => (await api.post('/auth/register', form)).data, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, token, loading, login, register, logout }), [user, token, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
