import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="container py-5 text-center">
      <h1 className="display-5">Page not found</h1>
      <p className="text-muted">The page you opened does not exist or has moved.</p>
      <Link className="btn btn-primary" to="/">Go to the homepage</Link>
    </div>
  );
}
