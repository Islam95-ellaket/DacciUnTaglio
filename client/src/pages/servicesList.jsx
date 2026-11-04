import ErrorAlert from "../components/ErrorAlert";
import useFetch from "../hooks/useFetch";

const API = import.meta.env.VITE_API_URL;

export default function ServicesList() {
  const { data: services, loading, error, refetch: loadServices } = useFetch(
    `${API}/services`
  );

  const formatPrice = (v) =>
    v.toLocaleString("it-IT", { style: "currency", currency: "EUR" });

  if (loading) return <div className="text-center mt-5">Caricamento...</div>;
  if (error) return <ErrorAlert message={error} onRetry={loadServices} />;

  return (
    <div>
      <h2 className="mb-4">I nostri servizi</h2>
      <div className="row g-3">
        {services.map((s) => (
          <div className="col-md-4" key={s._id}>
            <div className="card h-100">
              <div className="card-body">
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
