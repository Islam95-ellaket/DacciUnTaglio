import { useState, useContext } from "react";
import { Link } from "react-router-dom";
import AuthContext from "../context/AuthContext";
import ErrorAlert from "../components/ErrorAlert";
import useFetch from "../hooks/useFetch";
import { apiFetch } from "../api/http.js";
import { formatPrice, formatDate, formatTime } from "../utils/format.js";
import { STATUS_LABELS, STATUS_BADGES } from "../utils/constants.js";

// Card attive (annullabili) e card passate/annullate; gli stati vuoti
// offrono sempre un'azione per proseguire.
export default function MyBookings() {
  const { token } = useContext(AuthContext);

  // --- Prenotazioni dal backend ---
  const {
    data,
    setData: setAppointments,
    loading,
    error,
    refetch: loadAppointments,
  } = useFetch("/appointments/mine", { token });

  const appointments = data ?? [];

  // --- Stati ---
  const [cancelling, setCancelling] = useState(null); // id in fase di annullamento
  const [message, setMessage] = useState(null); // { type: "success" | "danger", text }

  // --- Annulla prenotazione ---
  const handleCancel = async (id) => {
    if (!window.confirm("Vuoi davvero annullare questa prenotazione?")) return;

    setCancelling(id);
    setMessage(null);
    try {
      await apiFetch(`/appointments/${id}`, { method: "DELETE", token });

      // Aggiorna la lista localmente: la prenotazione passa tra le annullate
      setAppointments((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status: "cancelled" } : a))
      );
      setMessage({ type: "success", text: "Prenotazione annullata." });
    } catch (err) {
      setMessage({ type: "danger", text: err.message });
    } finally {
      setCancelling(null);
    }
  };

  // --- Suddivisione in attive / passate ---
  const now = new Date();

  const upcoming = appointments
    .filter((a) => a.status === "active" && new Date(a.start) > now)
    .sort((a, b) => new Date(a.start) - new Date(b.start)); // la più vicina per prima

  const past = appointments
    .filter((a) => !(a.status === "active" && new Date(a.start) > now))
    .sort((a, b) => new Date(b.start) - new Date(a.start)); // la più recente per prima

  // --- Render ---
  if (loading) {
    return (
      <div className="text-center mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Caricamento...</span>
        </div>
      </div>
    );
  }

  if (error) return <ErrorAlert message={error} onRetry={loadAppointments} />;

  if (appointments.length === 0) {
    return (
      <div>
        <h2 className="mb-4">Le mie prenotazioni</h2>
        <div className="alert alert-info">Nessuna prenotazione.</div>
        <Link to="/booking" className="btn btn-primary">
          Prenota un appuntamento
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4">Le mie prenotazioni</h2>

      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      {/* Prenotazioni attive */}
      <h4 className="mb-3">Attive</h4>
      {upcoming.length === 0 ? (
        <div className="mb-4">
          <p className="text-secondary">Non hai prenotazioni in programma.</p>
          <Link to="/booking" className="btn btn-primary">
            Prenota un appuntamento
          </Link>
        </div>
      ) : (
        <div className="row g-3 mb-4">
          {upcoming.map((a) => (
            <div className="col-md-6" key={a._id}>
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title mb-0">{a.serviceId?.name}</h5>
                    <span className="badge bg-success">Attivo</span>
                  </div>
                  <p className="card-text text-secondary small mb-1">
                    {formatDate(a.start)} · Ore {formatTime(a.start)}
                  </p>
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <span className="booking-price">
                      {formatPrice(a.serviceId?.price)}
                    </span>
                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => handleCancel(a._id)}
                      disabled={cancelling === a._id}
                    >
                      {cancelling === a._id ? "Annullamento..." : "Annulla"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Prenotazioni passate / annullate */}
      <h4 className="mb-3">Passate o annullate</h4>
      {past.length === 0 ? (
        <p className="text-secondary">Nessuna prenotazione passata.</p>
      ) : (
        <div className="row g-3">
          {past.map((a) => (
            <div className="col-md-6" key={a._id}>
              <div className="card h-100 past-card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title mb-0">{a.serviceId?.name}</h5>
                    <span className={STATUS_BADGES[a.status] || "badge bg-secondary"}>
                      {STATUS_LABELS[a.status] || a.status}
                    </span>
                  </div>
                  <p className="card-text text-secondary small mb-0">
                    {formatDate(a.start)} · Ore {formatTime(a.start)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
