export default function Loading({ label = 'Loading…' }) {
  return (
    <div className="d-flex align-items-center justify-content-center gap-2 py-5 text-muted" role="status">
      <div className="spinner-border spinner-border-sm" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
