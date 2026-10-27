import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { errMsg } from '../api/axios';
import ErrorMessage from '../components/common/ErrorMessage';

const PHONE_RE = /^\+?[0-9][0-9\s-]{6,14}$/;

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const validate = () => {
    if (form.name.trim().length < 2) return 'Enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) return 'Enter a valid email address.';
    if (!PHONE_RE.test(form.phone.trim())) return 'Enter a valid phone number, for example +91 98765 43210.';
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/\d/.test(form.password)) return 'Password needs at least 8 characters, including a letter and a number.';
    if (form.password !== form.confirmPassword) return 'The two passwords do not match.';
    return '';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) return setError(problem);
    setBusy(true); setError('');
    try {
      await register({ ...form, name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() });
      navigate('/login', { replace: true, state: { registered: true, from: location.state?.from } });
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 500 }}>
      <h1 className="h2 mb-3">Create your account</h1>
      <form className="rm-panel" onSubmit={onSubmit} noValidate>
        <ErrorMessage message={error} />
        <div className="mb-3"><label htmlFor="name" className="form-label">Full name</label>
          <input id="name" className="form-control" autoComplete="name" value={form.name} onChange={set('name')} required /></div>
        <div className="mb-3"><label htmlFor="email" className="form-label">Email</label>
          <input id="email" type="email" className="form-control" autoComplete="email" value={form.email} onChange={set('email')} required /></div>
        <div className="mb-3"><label htmlFor="phone" className="form-label">Phone number</label>
          <input id="phone" type="tel" className="form-control" autoComplete="tel" value={form.phone} onChange={set('phone')} required /></div>
        <div className="mb-3"><label htmlFor="password" className="form-label">Password</label>
          <input id="password" type="password" className="form-control" autoComplete="new-password" value={form.password} onChange={set('password')} required />
          <div className="form-text">At least 8 characters with a letter and a number.</div></div>
        <div className="mb-3"><label htmlFor="confirm" className="form-label">Confirm password</label>
          <input id="confirm" type="password" className="form-control" autoComplete="new-password" value={form.confirmPassword} onChange={set('confirmPassword')} required /></div>
        <button className="btn btn-primary w-100" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</button>
      </form>
      <p className="mt-3 text-center">Already registered? <Link to="/login" state={location.state}>Log in</Link></p>
    </div>
  );
}
