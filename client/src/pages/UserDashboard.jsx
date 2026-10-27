import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { fmtDate, money } from '../utils';

export default function UserDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/bookings/my')
      .then((r) => setBookings(r.data.bookings))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  const upcoming = bookings.filter((b) => b.status === 'booked' && new Date(b.toDate) > new Date());
  const next = [...upcoming].sort((a, b) => new Date(a.fromDate) - new Date(b.fromDate))[0];

  return (
    <div className="container py-4">
      <h1 className="h2">Hello, {user.name.split(' ')[0]}</h1>
      <p className="text-muted">Manage your stays or find a room for your next trip.</p>
      <div className="d-flex flex-wrap gap-2 mb-4">
        <Link className="btn btn-primary" to="/rooms">View rooms</Link>
        <Link className="btn btn-outline-primary" to="/rooms">Search available rooms</Link>
        <Link className="btn btn-outline-primary" to="/my-bookings">My bookings</Link>
        <button className="btn btn-outline-secondary" onClick={() => { logout(); navigate('/'); }}>Log out</button>
      </div>
      <ErrorMessage message={error} />
      {loading ? <Loading /> : bookings.length === 0 ? (
        <div className="rm-panel text-center py-5">
          <h2 className="h5">No bookings yet</h2>
          <p className="text-muted">When you book a room it will show up here.</p>
          <Link className="btn btn-primary" to="/rooms">Find a room</Link>
        </div>
      ) : (
        <div className="row g-3">
          <div className="col-md-4"><div className="rm-stat"><strong>{upcoming.length}</strong>upcoming stay{upcoming.length === 1 ? '' : 's'}</div></div>
          <div className="col-md-4"><div className="rm-stat"><strong>{bookings.filter((b) => b.paymentStatus === 'paid' || b.paymentStatus === 'refunded').length}</strong>booking{bookings.length === 1 ? '' : 's'} made</div></div>
          <div className="col-md-4"><div className="rm-stat"><strong>{next ? fmtDate(next.fromDate) : '–'}</strong>{next ? `next check-in · ${money(next.totalAmount)}` : 'no upcoming check-in'}</div></div>
        </div>
      )}
    </div>
  );
}
