import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../api/axios';
import RoomCard from '../components/rooms/RoomCard';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { useAuth } from '../context/AuthContext';
import { addDays, nightsBetween, todayStr } from '../utils';

const TYPES = ['Single', 'Double', 'Deluxe', 'Suite'];

export default function RoomsPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const checkIn = params.get('checkIn') || '';
  const checkOut = params.get('checkOut') || '';
  const type = params.get('type') || '';

  const [inDate, setInDate] = useState(checkIn);
  const [outDate, setOutDate] = useState(checkOut);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  // Reload whenever the URL's filters change.
  useEffect(() => {
    setLoading(true); setError('');
    const q = {};
    if (checkIn && checkOut) { q.checkIn = checkIn; q.checkOut = checkOut; }
    if (type) q.type = type;
    api.get('/rooms', { params: q })
      .then((r) => setRooms(r.data.rooms))
      .catch((e) => { setRooms([]); setError(errMsg(e)); })
      .finally(() => setLoading(false));
  }, [checkIn, checkOut, type]);

  const update = (next) => {
    const p = new URLSearchParams(params);
    Object.entries(next).forEach(([k, v]) => (v ? p.set(k, v) : p.delete(k)));
    setParams(p);
  };

  const search = (e) => {
    e.preventDefault();
    if ((inDate || outDate) && (!inDate || !outDate)) return setFormError('Choose both dates, or clear both to see all rooms.');
    if (inDate && outDate <= inDate) return setFormError('Check-out must be after check-in.');
    setFormError('');
    update({ checkIn: inDate, checkOut: outDate });
  };

  const clear = () => { setInDate(''); setOutDate(''); setFormError(''); update({ checkIn: '', checkOut: '' }); };

  const book = (room) => {
    const qs = checkIn && checkOut ? `?checkIn=${checkIn}&checkOut=${checkOut}` : '';
    const target = `/book/${room._id}${qs}`;
    if (!user) return navigate('/login', { state: { from: target } });
    navigate(target);
  };

  const nights = checkIn && checkOut ? nightsBetween(checkIn, checkOut) : 0;

  return (
    <div className="container py-4">
      <h1 className="h2 mb-3">Rooms</h1>
      <form className="rm-panel mb-4" onSubmit={search} noValidate>
        <div className="row g-2 align-items-end">
          <div className="col-6 col-md-3">
            <label htmlFor="r-in" className="form-label small mb-1">Check-in</label>
            <input id="r-in" type="date" className="form-control" min={todayStr()} value={inDate}
              onChange={(e) => { setInDate(e.target.value); if (outDate && e.target.value >= outDate) setOutDate(addDays(e.target.value, 1)); }} />
          </div>
          <div className="col-6 col-md-3">
            <label htmlFor="r-out" className="form-label small mb-1">Check-out</label>
            <input id="r-out" type="date" className="form-control" min={inDate ? addDays(inDate, 1) : todayStr()} value={outDate} onChange={(e) => setOutDate(e.target.value)} />
          </div>
          <div className="col-6 col-md-3">
            <label htmlFor="r-type" className="form-label small mb-1">Room type</label>
            <select id="r-type" className="form-select" value={type} onChange={(e) => update({ type: e.target.value })}>
              <option value="">All types</option>
              {TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-6 col-md-3 d-flex gap-2">
            <button className="btn btn-primary flex-grow-1" type="submit">Check availability</button>
            {(checkIn || checkOut) && <button type="button" className="btn btn-outline-primary" onClick={clear}>Clear</button>}
          </div>
        </div>
        {formError && <div className="text-danger small mt-2" role="alert">{formError}</div>}
      </form>

      {nights > 0 && !loading && !error && <p className="text-muted">Showing rooms free for {nights} night{nights > 1 ? 's' : ''}.</p>}
      <ErrorMessage message={error} />
      {loading ? <Loading label="Finding rooms…" /> : (
        <>
          {!error && rooms.length === 0 && (
            <div className="rm-panel text-center py-5">
              <h2 className="h5">{nights ? 'No rooms are free for those dates' : 'No rooms match your search'}</h2>
              <p className="text-muted mb-0">{nights ? 'Try moving your dates by a day or two, or choose another room type.' : 'Try a different room type.'}</p>
            </div>
          )}
          <div className="row g-4">
            {rooms.map((r) => <div className="col-md-6 col-lg-4" key={r._id}><RoomCard room={r} nights={nights} onBook={book} /></div>)}
          </div>
        </>
      )}
    </div>
  );
}
