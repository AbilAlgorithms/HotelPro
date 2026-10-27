import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { assetUrl, errMsg } from '../api/axios';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { fmtDate, fmtDateTime, money } from '../utils';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(() => {
    return api.get('/bookings/my')
      .then((r) => setBookings(r.data.bookings))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => { load(); }, [load]);

  const cancel = async (b) => {
    if (!window.confirm(`Cancel your ${b.roomId?.type} room booking for ${fmtDate(b.fromDate)}?`)) return;
    setBusyId(b._id); setError(''); setNotice('');
    try {
      const r = await api.patch(`/bookings/${b._id}/cancel`);
      setNotice(r.data.message);
      await load(); // refresh from the server
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="container py-4">
      <h1 className="h2 mb-3">My bookings</h1>
      <ErrorMessage message={notice} variant="success" onClose={() => setNotice('')} />
      <ErrorMessage message={error} onClose={() => setError('')} />
      {loading ? <Loading /> : bookings.length === 0 ? (
        <div className="rm-panel text-center py-5">
          <h2 className="h5">You have no bookings</h2>
          <p className="text-muted">Pick your dates and book your first stay.</p>
          <Link className="btn btn-primary" to="/rooms">Browse rooms</Link>
        </div>
      ) : (
        <div className="row g-3">
          {bookings.map((b) => (
            <div className="col-lg-6" key={b._id}>
              <div className="rm-card d-flex flex-column flex-sm-row h-100">
                {b.roomId?.photos?.[0] ? <img className="rm-card-img" style={{ width: 180, height: 'auto', minHeight: 140 }} src={assetUrl(b.roomId.photos[0])} alt={`${b.roomId.type} room`} />
                  : <div className="rm-card-img rm-img-empty" style={{ width: 180 }}>No photo</div>}
                <div className="p-3 flex-grow-1">
                  <div className="d-flex justify-content-between gap-2">
                    <h2 className="h5 mb-1">{b.roomId?.type || 'Room'} room</h2>
                    <div className="d-flex gap-1 flex-wrap justify-content-end">
                      <span className={`rm-status rm-status-${b.status}`}>{b.status}</span>
                      <span className={`rm-status rm-status-${b.paymentStatus}`}>{b.paymentStatus}</span>
                    </div>
                  </div>
                  <div className="small text-muted mb-2">Booking {b._id}</div>
                  <div>{fmtDate(b.fromDate)} to {fmtDate(b.toDate)} · {b.totalDays} night{b.totalDays > 1 ? 's' : ''}</div>
                  <div className="fw-semibold">{money(b.totalAmount)}</div>
                  <div className="small text-muted">Booked {fmtDateTime(b.createdAt)}{b.paymentReference ? ` · Ref ${b.paymentReference}` : ''}</div>
                  {b.cancellable ? (
                    <button className="btn btn-outline-danger btn-sm mt-2" disabled={busyId === b._id} onClick={() => cancel(b)}>{busyId === b._id ? 'Cancelling…' : 'Cancel booking'}</button>
                  ) : b.status === 'booked' && <div className="small text-muted mt-2">{b.cancelReason}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
