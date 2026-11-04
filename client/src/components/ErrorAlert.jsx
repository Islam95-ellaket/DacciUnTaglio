export default function ErrorAlert({ message, onRetry }) {
  if (!message) return null;
  
  return (
    <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
      <span>{message}</span>
      {onRetry && (
        <button
          type="button"
          className="btn btn-sm btn-outline-danger"
          onClick={onRetry}
        >
          Riprova
        </button>
      )}
    </div>
  );
}
