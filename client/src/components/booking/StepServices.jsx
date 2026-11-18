import ErrorAlert from "../ErrorAlert.jsx";
import { formatPrice } from "../../utils/format.js";

// Step 1: card cliccabili con sfondo immagine e altezza uniforme;
// il click avanza allo step 2.
export default function StepServices({ services, loading, error, onRetry, onSelect }) {
  if (loading) return <div className="text-center mt-5">Caricamento...</div>;
  if (error) return <ErrorAlert message={error} onRetry={onRetry} />;

  return (
    <div>
      <h2 className="mb-4">Scegli un servizio</h2>
      <div className="row g-3">
        {services.map((s) => (
          <div className="col-md-4" key={s._id}>
            <div className="service-select-card" onClick={() => onSelect(s)}>
              <h5 className="service-select-name mb-1">{s.name}</h5>
              <p className="text-secondary small mb-0">{s.durationMinutes} min</p>
              <span className="service-select-price fw-bold text-brand">
                {formatPrice(s.price)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
