import ErrorAlert from "../ErrorAlert.jsx";
import { formatPrice } from "../../utils/format.js";

// Step 1 del booking: card cliccabili (3 colonne desktop, lista mobile).
// Il click avanza allo step 2: la selezione visiva è hover/:active
// (bordo ocra + sfondo chiaro, classi del design system).
export default function StepServices({ services, loading, error, onRetry, onSelect }) {
  if (loading) return <div className="text-center mt-5">Caricamento...</div>;
  if (error) return <ErrorAlert message={error} onRetry={onRetry} />;

  return (
    <div>
      <h2 className="mb-4">Scegli un servizio</h2>
      <div className="row g-3">
        {services.map((s) => (
          <div className="col-md-4" key={s._id}>
            <div className="service-select-card p-3" onClick={() => onSelect(s)}>
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h5 className="mb-1">{s.name}</h5>
                  <p className="text-secondary small mb-0">
                    {s.durationMinutes} min
                  </p>
                </div>
                <span className="fw-bold text-brand">{formatPrice(s.price)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
