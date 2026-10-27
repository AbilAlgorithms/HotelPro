import ProtectedRoute from './ProtectedRoute';

// Frontend convenience only. The API enforces admin access on every admin endpoint.
export default function AdminRoute({ children }) {
  return <ProtectedRoute role="admin">{children}</ProtectedRoute>;
}
