import { useState, useContext } from "react";
import AuthContext from "../context/AuthContext";
import ErrorAlert from "../components/ErrorAlert";
import useFetch from "../hooks/useFetch";

const API = import.meta.env.VITE_API_URL;

const STATUS_LABELS = {
  active: "Attiva",
  cancelled: "Annullata",
  completed: "Completata",
  "no-show": "Non presentato",
};

const STATUS_BADGES = {
  active: "bg-primary",
  cancelled: "bg-danger",
  completed: "bg-success",
  "no-show": "bg-warning text-dark",
};

export default function MyBookings() {
  const { token } = useContext(AuthContext);

  // --- Prenotazioni dal backend ---
  const {
    data,
    setData: setAppointments,
    loading,
    error,
    refetch: loadAppointments,
  } = useFetch(`${API}/appointments/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });

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
      const res = await fetch(`${API}/appointments/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error?.message || "Errore durante l'annullamento");
      }

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

  // --- Formattazione ---
  const formatPrice = (v) =>
    typeof v === "number"
      ? v.toLocaleString("it-IT", { style: "currency", currency: "EUR" })
      : "";

  const formatTime = (iso) =>
    new Date(iso).toLocaleTimeString("it-IT", {
      timeZone: "Europe/Rome",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString("it-IT", {
      timeZone: "Europe/Rome",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

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
                  <h5 className="card-title">{a.service?.name}</h5>
                  <p className="card-text mb-1">{formatDate(a.start)}</p>
                  <p className="card-text mb-1">Ore {formatTime(a.start)}</p>
                  <p className="fw-bold">{formatPrice(a.service?.price)}</p>
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
                  <h5 className="card-title">{a.service?.name}</h5>
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