import ErrorAlert from "../ErrorAlert.jsx";
import { formatPrice } from "../../utils/format.js";

// Step 1 del booking: scelta del servizio tramite card cliccabili.
export default function StepServices({ services, loading, error, onRetry, onSelect }) {
  if (loading) return <div className="text-center mt-5">Caricamento...</div>;
  if (error) return <ErrorAlert message={error} onRetry={onRetry} />;

  return (
    <div>
      <h2 className="mb-4">Scegli un servizio</h2>
      <div className="row g-3">
        {services.map((s) => (
          <div className="col-md-4" key={s._id}>
            <div
              className="card h-100 clickable-card"
              onClick={() => onSelect(s)}
            >
              <div className="card-body text-center">
                <h5 className="card-title">{s.name}</h5>
                <p className="card-text">Durata: {s.durationMinutes} min</p>
                <p className="fw-bold">{formatPrice(s.price)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
