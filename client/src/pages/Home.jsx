import { Link, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { Clock } from "lucide-react";
import AuthContext from "../context/AuthContext";
import useFetch from "../hooks/useFetch";
import ErrorAlert from "../components/ErrorAlert";
import { formatPrice } from "../utils/format.js";

export default function Home() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  // Servizi in evidenza: stessa GET pubblica della pagina Servizi
  const { data: services, loading, error, refetch } = useFetch("/services");

  return (
    <div>
      {/* Hero */}
      <section className="hero text-center">
        <h1>Il tuo barbiere, a portata di click.</h1>
        <p className="text-secondary mt-3">
          Prenota il tuo appuntamento in pochi click: scegli servizio, data e
          orario.
        </p>
        <div className="d-grid gap-2 d-md-flex justify-content-md-center mt-4">
          <Link to="/booking" className="btn btn-primary">
            Prenota un appuntamento
          </Link>
          <Link to="/services" className="btn btn-outline-primary">
            Vedi i servizi
          </Link>
        </div>

        {user && user.role === "admin" && (
          <p className="mt-3 mb-0">
            <Link to="/admin-area" className="btn btn-link">
              Vai all'Area Admin
            </Link>
          </p>
        )}
      </section>

      {/* Servizi più richiesti */}
      <section className="mt-5">
        <h2 className="mb-3">Servizi più richiesti</h2>

        {loading && (
          <div className="text-center text-secondary">Caricamento...</div>
        )}
        {error && <ErrorAlert message={error} onRetry={refetch} />}

        {services && (
          <div className="row g-3">
            {services.map((s) => (
              <div className="col-md-4" key={s._id}>
                <div className="card h-100 service-card">
                  <div className="card-body service-card-body">
                    <div className="service-info">
                      <h5 className="card-title mb-1">{s.name}</h5>
                      <p className="card-text text-secondary small mb-0">
                        <Clock size={14} className="me-1" />
                        {s.durationMinutes} min
                      </p>
                    </div>
                    <div className="service-cta">
                      <span className="fw-bold text-brand d-block mb-2">
                        {formatPrice(s.price)}
                      </span>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() =>
                          navigate("/booking", { state: { service: s } })
                        }
                      >
                        Prenota
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
