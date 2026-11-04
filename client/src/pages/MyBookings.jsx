import { useState, useContext } from "react";
import AuthContext from "../context/AuthContext";
import ErrorAlert from "../components/ErrorAlert";
import useFetch from "../hooks/useFetch";
import { apiFetch } from "../api/http.js";
import { formatPrice, formatDate, formatTime } from "../utils/format.js";
import { STATUS_LABELS, STATUS_BADGES } from "../utils/constants.js";

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
      <h4 className="mb-3">Prenotazioni attive</h4>
      {upcoming.length === 0 ? (
        <p className="text-muted">Non hai prenotazioni in programma.</p>
      ) : (
        <div className="row g-3 mb-4">
          {upcoming.map((a) => (
            <div className="col-md-6" key={a._id}>
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">{a.serviceId?.name}</h5>
                  <p className="card-text mb-1">{formatDate(a.start)}</p>
                  <p className="card-text mb-1">Ore {formatTime(a.start)}</p>
                  <p className="fw-bold">{formatPrice(a.serviceId?.price)}</p>
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
          ))}
        </div>
      )}

      {/* Prenotazioni passate / annullate */}
      <h4 className="mb-3">Prenotazioni passate o annullate</h4>
      {past.length === 0 ? (
        <p className="text-muted">Nessuna prenotazione passata.</p>
      ) : (
        <div className="row g-3">
          {past.map((a) => (
            <div className="col-md-6" key={a._id}>
              <div className="card h-100 bg-light">
                <div className="card-body">
                  <h5 className="card-title">{a.serviceId?.name}</h5>
                  <p className="card-text mb-1">{formatDate(a.start)}</p>
                  <p className="card-text mb-2">Ore {formatTime(a.start)}</p>
                  <span className={`badge ${STATUS_BADGES[a.status] || "bg-secondary"}`}>
                    {STATUS_LABELS[a.status] || a.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
