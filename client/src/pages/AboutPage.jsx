import { Link } from 'react-router-dom';

export default function AboutPage() {
  return (
    <div className="container py-4" style={{ maxWidth: 820 }}>
      <h1 className="h2">About Roomly</h1>
      <p className="text-muted">Roomly is a small hotel with four room types, from a quiet Single to a top-floor Suite. This site lets you check which rooms are free on your dates and book one without calling the front desk.</p>
      <h2 className="h4 mt-4">How booking works</h2>
      <p className="text-muted mb-1">Choose your dates, pick a room type, confirm your contact details and pay. A stay is counted in nights: staying from the 10th to the 12th is two nights, and you check out on the 12th.</p>
      <p className="text-muted">You can cancel from My bookings up to 24 hours before check-in. Cancelled rooms go straight back on sale.</p>
      <h2 className="h4 mt-4">About payments on this site</h2>
      <p className="text-muted">Roomly is a university project, so checkout is a demonstration. It never asks for card details and no money is taken.</p>
      <Link className="btn btn-primary" to="/rooms">See available rooms</Link>
    </div>
  );
}
