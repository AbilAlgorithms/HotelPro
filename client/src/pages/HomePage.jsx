import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaWifi, FaCoffee, FaConciergeBell, FaSnowflake, FaShieldAlt, FaBed } from 'react-icons/fa';
import api, { errMsg } from '../api/axios';
import heroImg from '../assets/hero.svg';
import RoomCard from '../components/rooms/RoomCard';
import Loading from '../components/common/Loading';
import ErrorMessage from '../components/common/ErrorMessage';
import { useAuth } from '../context/AuthContext';
import { addDays, todayStr } from '../utils';

const FEATURES = [
  { icon: FaWifi, title: 'Fast Wi-Fi', text: 'Unlimited fibre Wi-Fi in every room and the lobby.' },
  { icon: FaSnowflake, title: 'Air conditioning', text: 'Quiet, individually controlled cooling in all rooms.' },
  { icon: FaCoffee, title: 'Breakfast', text: 'Fresh breakfast included with Double rooms and above.' },
  { icon: FaConciergeBell, title: 'Front desk', text: 'Someone at reception 24 hours a day.' },
];

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    api.get('/rooms')
      .then((r) => setRooms(r.data.rooms.slice(0, 3)))
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, []);

  const search = (e) => {
    e.preventDefault();
    if (!checkIn || !checkOut) return setFormError('Choose both a check-in and a check-out date.');
    if (checkOut <= checkIn) return setFormError('Check-out must be after check-in.');
    navigate(`/rooms?checkIn=${checkIn}&checkOut=${checkOut}`);
  };

  const book = (room) => navigate(`/book/${room._id}`);

  return (
    <>
      <section className="rm-hero">
        <div className="container py-5">
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <h1>A good room, booked in a minute.</h1>
              <p className="lead">Pick your dates, see which rooms are free, and confirm your stay. No phone calls, no waiting for an email.</p>
              <form className="rm-search" onSubmit={search} noValidate>
                <div className="row g-2 align-items-end">
                  <div className="col-sm-4">
                    <label htmlFor="h-in" className="form-label small mb-1">Check-in</label>
                    <input id="h-in" type="date" className="form-control" min={todayStr()} value={checkIn}
                      onChange={(e) => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut(addDays(e.target.value, 1)); }} />
                  </div>
                  <div className="col-sm-4">
                    <label htmlFor="h-out" className="form-label small mb-1">Check-out</label>
                    <input id="h-out" type="date" className="form-control" min={checkIn ? addDays(checkIn, 1) : todayStr()} value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
                  </div>
                  <div className="col-sm-4 d-grid"><button className="btn btn-brass" type="submit">Find rooms</button></div>
                </div>
                {formError && <div className="text-danger small mt-2" role="alert">{formError}</div>}
              </form>
            </div>
            <div className="col-lg-6">
              <img className="rm-hero-img rounded" src={heroImg} alt="The Roomly hotel at dusk with lit windows" />
            </div>
          </div>
        </div>
      </section>

      <section className="container mt-5">
        <div className="d-flex justify-content-between align-items-end mb-3">
          <h2 className="rm-section-title mb-0">Rooms guests choose most</h2>
          <Link to="/rooms">See all rooms</Link>
        </div>
        {loading && <Loading label="Loading rooms…" />}
        <ErrorMessage message={error} />
        {!loading && !error && rooms.length === 0 && <p className="text-muted">No rooms have been listed yet. Check back soon.</p>}
        <div className="row g-4">
          {rooms.map((r) => <div className="col-md-6 col-lg-4" key={r._id}><RoomCard room={r} onBook={book} /></div>)}
        </div>
      </section>

      <section className="container mt-5">
        <h2 className="rm-section-title mb-3">What every stay includes</h2>
        <div className="row g-3">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <div className="col-sm-6 col-lg-3" key={title}>
              <div className="rm-panel h-100">
                <span className="rm-feature-icon mb-2"><Icon aria-hidden="true" /></span>
                <h3 className="h6 mb-1">{title}</h3>
                <p className="small text-muted mb-0">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container mt-5">
        <div className="row g-4 align-items-center">
          <div className="col-lg-7">
            <h2 className="rm-section-title">About Roomly</h2>
            <p className="text-muted">Roomly is a small hotel with a simple promise: what you see is what you book. Prices are per night, totals are calculated for you, and you can cancel free of charge until 24 hours before check-in.</p>
            <Link to="/about">Read more about us</Link>
          </div>
          <div className="col-lg-5">
            <div className="rm-cta p-4">
              <h2 className="h4">Ready to pick a room?</h2>
              <p className="mb-3">{user ? 'Your next stay is a few clicks away.' : 'Create a free account to book and manage your stays.'}</p>
              <Link className="btn btn-brass" to={user ? '/rooms' : '/register'}><FaBed className="me-1" aria-hidden="true" />{user ? 'Browse rooms' : 'Create account'}</Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
