import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="rm-footer mt-5">
      <div className="container py-4 d-flex flex-column flex-md-row justify-content-between gap-3">
        <div>
          <div className="rm-brand mb-1">Roomly</div>
          <p className="mb-0 small">Reception is open around the clock. Check-in from 2 pm, check-out by 11 am.</p>
        </div>
        <div className="d-flex gap-4 small">
          <Link to="/rooms">Rooms</Link>
          <Link to="/about">About</Link>
          <Link to="/login">Log in</Link>
          <Link to="/register">Create account</Link>
        </div>
      </div>
      <div className="container pb-3 small opacity-75">Roomly is a university project. Payments are simulated and no real money moves.</div>
    </footer>
  );
}
