import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FaBed } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const close = () => setOpen(false);
  const onLogout = () => { logout(); close(); navigate('/'); };

  return (
    <nav className="navbar navbar-expand-lg rm-nav sticky-top">
      <div className="container">
        <Link className="navbar-brand rm-brand" to="/" onClick={close}><FaBed aria-hidden="true" /> Roomly</Link>
        <button className="navbar-toggler" type="button" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen(!open)}>
          <span className="navbar-toggler-icon" />
        </button>
        <div className={`collapse navbar-collapse ${open ? 'show' : ''}`}>
          <ul className="navbar-nav me-auto mb-2 mb-lg-0">
            <li className="nav-item"><NavLink className="nav-link" to="/" end onClick={close}>Home</NavLink></li>
            <li className="nav-item"><NavLink className="nav-link" to="/rooms" onClick={close}>Rooms</NavLink></li>
            <li className="nav-item"><NavLink className="nav-link" to="/about" onClick={close}>About</NavLink></li>
            {user?.role === 'customer' && <li className="nav-item"><NavLink className="nav-link" to="/my-bookings" onClick={close}>My bookings</NavLink></li>}
          </ul>
          <div className="d-flex gap-2 align-items-center">
            {user ? (
              <>
                <Link className="btn btn-outline-primary btn-sm" to={user.role === 'admin' ? '/admin' : '/dashboard'} onClick={close}>
                  {user.role === 'admin' ? 'Admin dashboard' : 'Dashboard'}
                </Link>
                <button className="btn btn-primary btn-sm" onClick={onLogout}>Log out</button>
              </>
            ) : (
              <>
                <Link className="btn btn-outline-primary btn-sm" to="/login" onClick={close}>Log in</Link>
                <Link className="btn btn-primary btn-sm" to="/register" onClick={close}>Create account</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
