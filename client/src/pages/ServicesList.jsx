import ErrorAlert from "../components/ErrorAlert";
import useFetch from "../hooks/useFetch";
import { formatPrice } from "../utils/format.js";
import { useNavigate } from "react-router-dom";

export default function ServicesList() {
  const { data: services, loading, error, refetch: loadServices } =
    useFetch("/services");

  const navigate = useNavigate();

  if (loading) return <div className="text-center mt-5">Caricamento...</div>;
  if (error) return <ErrorAlert message={error} onRetry={loadServices} />;

  return (
    <div>
      <h2 className="mb-4">I nostri servizi</h2>
      <div className="row g-3">
        {services.map((s) => (
          <div className="col-md-4" key={s._id}>
            <div className="card h-100 service-card">
              <img
                src={s.imageUrl || "/images/barber-bg.jpg"}
                alt={s.name}
                className="service-card-img"
              />
              <div className="card-body service-card-body">
                <div className="service-info">
                  <h5 className="card-title mb-1">{s.name}</h5>
                  <p className="card-text text-secondary small mb-0">
                    Durata: {s.durationMinutes} min
                  </p>
                </div>
                <div className="service-cta">
                  <span className="fw-bold text-brand d-block mb-2">
                    {formatPrice(s.price)}
                  </span>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => navigate("/booking", { state: { service: s } })}
                  >
                    Prenota
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
