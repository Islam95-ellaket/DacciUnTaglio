import ErrorAlert from "../ErrorAlert.jsx";
import { formatPrice } from "../../utils/format.js";

// Step 1: card cliccabili, una per servizio. Se il servizio ha una sua
// immagine (caricata dall'admin su Cloudinary) fa da sfondo, altrimenti
// l'immagine di default del salone. Il click avanza allo step 2.
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
              className="service-select-card"
              style={
                s.imageUrl
                  ? {
                      backgroundImage: `linear-gradient(var(--dut-card-veil), var(--dut-card-veil)), url("${s.imageUrl}")`,
                    }
                  : undefined
              }
              onClick={() => onSelect(s)}
            >
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
