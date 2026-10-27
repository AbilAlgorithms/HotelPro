export default function ErrorMessage({ message, variant = 'danger', onClose }) {
  if (!message) return null;
  return (
    <div className={`alert alert-${variant} d-flex justify-content-between align-items-start`} role="alert">
      <span>{message}</span>
      {onClose && <button type="button" className="btn-close" aria-label="Dismiss" onClick={onClose} />}
    </div>
  );
}
