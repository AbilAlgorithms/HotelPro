import { useCallback, useEffect, useMemo, useState } from 'react';
import api, { errMsg } from '../../api/axios';
import Loading from '../common/Loading';
import ErrorMessage from '../common/ErrorMessage';
import { fmtDate, money } from '../../utils';

export default function BookingsTab({ onChanged }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  const load = useCallback(() => api.get('/admin/bookings')
    .then((r) => setBookings(r.data.bookings))
    .catch((e) => setError(errMsg(e)))
    .finally(() => setLoading(false)), []);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return bookings.filter((b) => (!status || b.status === status || b.paymentStatus === status) &&
      (!term || [b._id, b.guestName, b.userId?.name, b.userId?.email, b.roomId?.type, b.roomId?.roomNumber].some((v) => v && String(v).toLowerCase().includes(term))));
  }, [bookings, q, status]);

  const cancel = async (b) => {
    if (!window.confirm(`Cancel booking ${b._id} for ${b.userId?.name || b.guestName}?`)) return;
    setError(''); setNotice('');
    try {
      const r = await api.patch(`/bookings/${b._id}/cancel`);
      setNotice(r.data.message);
      await load(); onChanged?.();
    } catch (e) { setError(errMsg(e)); }
  };

  if (loading) return <Loading />;
  return (
    <>
      <div className="row g-2 mb-3">
        <div className="col-md-6"><label htmlFor="bq" className="visually-hidden">Search bookings</label>
          <input id="bq" className="form-control" placeholder="Search by customer, email, room or booking ID" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="col-md-3"><label htmlFor="bs" className="visually-hidden">Filter by status</label>
          <select id="bs" className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">All statuses</option>
            <option value="booked">Booked</option><option value="cancelled">Cancelled</option>
            <option value="paid">Paid</option><option value="pending">Payment pending</option>
            <option value="failed">Payment failed</option><option value="refunded">Refunded</option>
          </select></div>
      </div>
      <ErrorMessage message={notice} variant="success" onClose={() => setNotice('')} />
      <ErrorMessage message={error} onClose={() => setError('')} />
      {shown.length === 0 ? <div className="rm-panel text-center text-muted">No bookings match.</div> : (
        <div className="table-responsive rm-panel p-0">
          <table className="table table-hover align-middle mb-0 rm-table">
            <thead><tr><th>Booking ID</th><th>Customer</th><th>Email</th><th>Room</th><th>Check-in</th><th>Check-out</th><th>Nights</th><th>Total</th><th>Status</th><th>Payment</th><th /></tr></thead>
            <tbody>
              {shown.map((b) => (
                <tr key={b._id}>
                  <td className="small">{b._id}</td>
                  <td>{b.userId?.name || b.guestName}</td>
                  <td className="small">{b.userId?.email}</td>
                  <td>{b.roomId?.type} <span className="text-muted small">{b.roomId?.roomNumber}</span></td>
                  <td>{fmtDate(b.fromDate)}</td><td>{fmtDate(b.toDate)}</td><td>{b.totalDays}</td><td>{money(b.totalAmount)}</td>
                  <td><span className={`rm-status rm-status-${b.status}`}>{b.status}</span></td>
                  <td><span className={`rm-status rm-status-${b.paymentStatus}`}>{b.paymentStatus}</span></td>
                  <td>{b.status === 'booked' && <button className="btn btn-outline-danger btn-sm" onClick={() => cancel(b)}>Cancel</button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
