import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api/axios';
import ErrorMessage from '../components/common/ErrorMessage';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const notice = location.state?.registered ? 'Account created. Log in to continue.' : '';
  const from = location.state?.from;

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : from || '/dashboard'} replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.password) return setError('Enter your email and password.');
    setBusy(true); setError('');
    try {
      const u = await login(form.email.trim(), form.password);
      navigate(u.role === 'admin' ? '/admin' : from || '/dashboard', { replace: true });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 440 }}>
      <h1 className="h2 mb-3">Log in</h1>
      <ErrorMessage message={notice} variant="success" />
      <form className="rm-panel" onSubmit={onSubmit} noValidate>
        <ErrorMessage message={error} />
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email</label>
          <input id="email" type="email" className="form-control" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">Password</label>
          <div className="input-group">
            <input id="password" type={show ? 'text' : 'password'} className="form-control" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'}>
              {show ? <FaEyeSlash aria-hidden="true" /> : <FaEye aria-hidden="true" />}
            </button>
          </div>
        </div>
        <button className="btn btn-primary w-100" disabled={busy}>{busy ? 'Logging in…' : 'Log in'}</button>
      </form>
      <p className="mt-3 text-center">New to Roomly? <Link to="/register" state={location.state}>Create an account</Link></p>
    </div>
  );
}
