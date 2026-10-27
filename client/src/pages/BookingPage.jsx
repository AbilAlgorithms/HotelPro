import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import api, { assetUrl, errMsg } from '../api/axios';
import { useAuth } from '../context/AuthContext';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { addDays, fmtDate, money, nightsBetween, todayStr } from '../utils';

export default function BookingPage() {
  const { roomId } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [dates, setDates] = useState({ checkIn: params.get('checkIn') || '', checkOut: params.get('checkOut') || '' });
  const [guest, setGuest] = useState({ guestName: user.name, phone: user.phone || '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null); // { ok, booking, message }

  const nights = nightsBetween(dates.checkIn, dates.checkOut);
  const validDates = dates.checkIn >= todayStr() && nights >= 1;

  // Load the room (with availability once the dates are valid).
  useEffect(() => {
    setLoading(true);
    const q = validDates ? { checkIn: dates.checkIn, checkOut: dates.checkOut } : {};
    api.get(`/rooms/${roomId}`, { params: q })
      .then((r) => { setRoom(r.data.room); setLoadError(''); })
      .catch((e) => setLoadError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [roomId, dates.checkIn, dates.checkOut, validDates]);

  const pay = async (outcome) => {
    setError('');
    if (!validDates) return setError('Choose valid check-in and check-out dates first.');
    if (guest.guestName.trim().length < 2) return setError('Enter the guest name.');
    if (!/^\+?[0-9][0-9\s-]{6,14}$/.test(guest.phone.trim())) return setError('Enter a valid phone number.');
    setBusy(true);
    try {
      // Only identifiers and dates are sent; the server calculates nights and price.
      const r = await api.post('/bookings', { roomId, fromDate: dates.checkIn, toDate: dates.checkOut, guestName: guest.guestName.trim(), phone: guest.phone.trim(), paymentOutcome: outcome });
      setResult({ ok: true, booking: r.data.booking, message: r.data.message });
    } catch (e) {
      if (e.response?.status === 402) setResult({ ok: false, message: e.response.data.message });
      else setError(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  if (loading && !room) return <Loading label="Loading room…" />;
  if (loadError && !room) return <div className="container py-5"><ErrorMessage message={loadError} /><Link to="/rooms">Back to rooms</Link></div>;

  if (result) {
    return (
      <div className="container py-5" style={{ maxWidth: 560 }}>
        <div className="rm-panel text-center">
          <h1 className="h3">{result.ok ? 'Booking confirmed' : 'Payment did not go through'}</h1>
          <p className="text-muted">{result.message}</p>
          {result.ok && (
            <div className="text-start small mb-3">
              <div>Booking ID: {result.booking._id}</div>
              <div>Room: {room.type} · {fmtDate(result.booking.fromDate)} to {fmtDate(result.booking.toDate)} ({result.booking.totalDays} nights)</div>
              <div>Total: {money(result.booking.totalAmount)} · Payment ref: {result.booking.paymentReference}</div>
            </div>
          )}
          <div className="d-flex gap-2 justify-content-center">
            {result.ok ? <Link className="btn btn-primary" to="/my-bookings">View my bookings</Link>
              : <button className="btn btn-primary" onClick={() => setResult(null)}>Try again</button>}
            <Link className="btn btn-outline-primary" to="/rooms">Browse rooms</Link>
          </div>
        </div>
      </div>
    );
  }

  const soldOut = validDates && room.availableUnits === 0;
  return (
    <div className="container py-4">
      <h1 className="h2 mb-3">Confirm your booking</h1>
      <div className="row g-4">
        <div className="col-lg-7">
          <div className="rm-panel mb-3">
            <div className="d-flex gap-3">
              {room.photos?.[0] && <img className="rm-thumb" style={{ width: 120, height: 84 }} src={assetUrl(room.photos[0])} alt={`${room.type} room`} />}
              <div>
                <h2 className="h5 mb-1">{room.type} room</h2>
                <p className="small text-muted mb-1">{room.description}</p>
                <div className="fw-semibold">{money(room.rent)} per night</div>
              </div>
            </div>
          </div>
          <div className="rm-panel mb-3">
            <h2 className="h6">Your dates</h2>
            <div className="row g-2">
              <div className="col-6"><label htmlFor="b-in" className="form-label small mb-1">Check-in</label>
                <input id="b-in" type="date" className="form-control" min={todayStr()} value={dates.checkIn}
                  onChange={(e) => setDates({ checkIn: e.target.value, checkOut: dates.checkOut && dates.checkOut <= e.target.value ? addDays(e.target.value, 1) : dates.checkOut })} /></div>
              <div className="col-6"><label htmlFor="b-out" className="form-label small mb-1">Check-out</label>
                <input id="b-out" type="date" className="form-control" min={dates.checkIn ? addDays(dates.checkIn, 1) : todayStr()} value={dates.checkOut} onChange={(e) => setDates({ ...dates, checkOut: e.target.value })} /></div>
            </div>
            {soldOut && <div className="text-danger small mt-2" role="alert">This room type is fully booked for those dates. Try other dates.</div>}
            {validDates && room.availableUnits > 0 && <div className="text-muted small mt-2">{room.availableUnits} room{room.availableUnits > 1 ? 's' : ''} available.</div>}
          </div>
          <div className="rm-panel">
            <h2 className="h6">Guest details</h2>
            <div className="row g-2">
              <div className="col-md-6"><label htmlFor="g-name" className="form-label small mb-1">Guest name</label>
                <input id="g-name" className="form-control" value={guest.guestName} onChange={(e) => setGuest({ ...guest, guestName: e.target.value })} /></div>
              <div className="col-md-6"><label htmlFor="g-phone" className="form-label small mb-1">Phone number</label>
                <input id="g-phone" type="tel" className="form-control" value={guest.phone} onChange={(e) => setGuest({ ...guest, phone: e.target.value })} /></div>
            </div>
          </div>
        </div>
        <div className="col-lg-5">
          <div className="rm-panel">
            <h2 className="h5">Summary</h2>
            <dl className="row mb-2 small">
              <dt className="col-6 fw-normal text-muted">Nights</dt><dd className="col-6 text-end">{validDates ? nights : '–'}</dd>
              <dt className="col-6 fw-normal text-muted">Price per night</dt><dd className="col-6 text-end">{money(room.rent)}</dd>
              <dt className="col-6 fw-bold">Estimated total</dt><dd className="col-6 text-end fw-bold">{validDates ? money(nights * room.rent) : '–'}</dd>
            </dl>
            <p className="small text-muted">The server recalculates the final amount when you confirm.</p>
            <div className="rm-demo-banner mb-3"><strong>Demonstration payment.</strong> No card details are collected and no money is charged. Choose how the simulated payment should end.</div>
            <ErrorMessage message={error} />
            <div className="d-grid gap-2">
              <button className="btn btn-primary" disabled={busy || soldOut || !validDates} onClick={() => pay('success')}>{busy ? 'Processing…' : 'Pay (simulate success)'}</button>
              <button className="btn btn-outline-danger" disabled={busy || soldOut || !validDates} onClick={() => pay('fail')}>Simulate failed payment</button>
              <button className="btn btn-link" onClick={() => navigate(-1)}>Back</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
