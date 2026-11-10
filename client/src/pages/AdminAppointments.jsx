import { useState, useEffect, useContext, useCallback } from "react";
import AuthContext from "../context/AuthContext";
import ErrorAlert from "../components/ErrorAlert";
import { apiFetch } from "../api/http.js";
import {
  formatPrice,
  formatTime,
  formatDateShort,
  getRomeDate,
} from "../utils/format.js";
import { APPOINTMENT_STATUSES, STATUS_LABELS, STATUS_BADGES } from "../utils/constants.js";

const UNAUTHORIZED_MESSAGE = "Sessione scaduta. Effettua nuovamente l'accesso.";

export default function AdminAppointments() {
  const { token } = useContext(AuthContext);

  // Stati
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [updating, setUpdating] = useState(null);

  // Intervallo date: oggi → oggi + 7 giorni
  const [from, setFrom] = useState(() => getRomeDate());
  const [to, setTo] = useState(() =>
    getRomeDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))
  );

  const invalidRange = !from || !to || from > to;

  // Caricamento appuntamenti
  const loadAppointments = useCallback(
    async (signal) => {
      if (!token) {
        setAppointments([]);
        setLoading(false);
        setError(UNAUTHORIZED_MESSAGE);
        return;
      }

      if (invalidRange) {
        setAppointments([]);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({ from, to });
        const data = await apiFetch(`/appointments/admin?${params}`, {
          token,
          signal,
        });

        if (!Array.isArray(data)) {
          throw new Error("Risposta del server non valida.");
        }

        setAppointments(data);
      } catch (err) {
        if (err.name === "AbortError") return;

        setError(err.status === 401 ? UNAUTHORIZED_MESSAGE : err.message);
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [from, to, token, invalidRange]
  );

  // Caricamento automatico a ogni cambio di intervallo
  useEffect(() => {
    const controller = new AbortController();
    loadAppointments(controller.signal);
    return () => controller.abort();
  }, [loadAppointments]);

  // Aggiornamento stato appuntamento
  const handleStatusChange = async (id, newStatus) => {
    if (!token || updating !== null) return;

    if (!APPOINTMENT_STATUSES.includes(newStatus)) return;

    if (
      newStatus === "cancelled" &&
      !window.confirm("Vuoi davvero annullare questo appuntamento?")
    ) {
      return;
    }

    setUpdating(id);
    setMessage(null);

    try {
      const data = await apiFetch(`/appointments/${id}/status`, {
        method: "PATCH",
        token,
        body: { status: newStatus },
      });

      // Aggiorna la tabella usando la risposta del server
      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment._id === id
            ? { ...appointment, status: data.status || newStatus }
            : appointment
        )
      );

      setMessage({
        type: "success",
        text: `Appuntamento ${STATUS_LABELS[newStatus].toLowerCase()} correttamente.`,
      });
    } catch (err) {
      if (err.status === 401) {
        setMessage({ type: "danger", text: UNAUTHORIZED_MESSAGE });
      } else if (err.status === 409) {
        setMessage({
          type: "danger",
          text:
            err.message || "Orario non disponibile. Esiste un altro appuntamento.",
        });
      } else {
        setMessage({ type: "danger", text: err.message });
      }
    } finally {
      setUpdating(null);
    }
  };

  // Un appuntamento è "passato" quando la sua fine è precedente ad ora
  const isPast = (iso) => new Date(iso) < new Date();

  // Azioni di un appuntamento: condivise tra la tabella desktop e le card mobile
  const renderActions = (a) =>
    isPast(a.end) ? (
      <select
        className="form-select form-select-sm"
        value={a.status}
        onChange={(e) => handleStatusChange(a._id, e.target.value)}
        disabled={updating !== null}
      >
        <option value="completed">Completato</option>
        <option value="cancelled">Annullato</option>
        <option value="no-show">Non presentato</option>
      </select>
    ) : (
      <>
        {a.status === "active" && (
          <button
            className="btn btn-sm btn-outline-danger mb-1"
            onClick={() => handleStatusChange(a._id, "cancelled")}
            disabled={updating !== null}
          >
            {updating === a._id ? "..." : "Annulla"}
          </button>
        )}

        {a.status === "cancelled" && (
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() => handleStatusChange(a._id, "active")}
            disabled={updating !== null}
          >
            {updating === a._id ? "..." : "Riattiva"}
          </button>
        )}

        {(a.status === "completed" || a.status === "no-show") && (
          <span className="text-muted">Nessuna azione</span>
        )}
      </>
    );

  // Render
  return (
    <div>
      <h2 className="mb-3">Appuntamenti</h2>

      {/* Messaggi */}
      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      {/* Filtro date */}
      <div className="row g-2 mb-3">
        <div className="col-md-3">
          <label className="form-label">Da</label>
          <input
            type="date"
            className="form-control"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>

        <div className="col-md-3">
          <label className="form-label">A</label>
          <input
            type="date"
            className="form-control"
            value={to}
            min={from || undefined}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
      </div>

      {/* Intervallo non valido */}
      {invalidRange && (
        <div className="alert alert-warning">
          Seleziona un intervallo valido. La data iniziale non può essere
          successiva alla data finale.
        </div>
      )}

      {/* Caricamento */}
      {!invalidRange && loading && (
        <div className="text-center my-4">Caricamento appuntamenti...</div>
      )}

      {/* Errore */}
      <ErrorAlert message={error} onRetry={() => loadAppointments()} />

      {/* Nessun appuntamento */}
      {!loading && !error && !invalidRange && appointments.length === 0 && (
        <div className="alert alert-info">
          Nessun appuntamento in questo intervallo.
        </div>
      )}

      {/* Elenco appuntamenti: card su mobile, tabella da tablet in su */}
      {!loading && !error && !invalidRange && appointments.length > 0 && (
        <>
          {/* Card su mobile */}
          <div className="d-md-none">
            {appointments.map((a) => (
              <div className="card mb-2" key={a._id}>
                <div className="card-body py-2">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <strong>{a.userId?.name || "—"}</strong>
                    <span
                      className={`badge ${
                        STATUS_BADGES[a.status] || "bg-secondary"
                      }`}
                    >
                      {STATUS_LABELS[a.status] || a.status}
                    </span>
                  </div>
                  <div className="small text-muted mb-1">
                    {a.serviceId?.name || "—"} · {formatPrice(a.serviceId?.price)}
                  </div>
                  <div className="small mb-2">
                    {formatDateShort(a.start)} · {formatTime(a.start)} –{" "}
                    {formatTime(a.end)}
                  </div>
                  {renderActions(a)}
                </div>
              </div>
            ))}
          </div>

          {/* Tabella su tablet e desktop */}
          <div className="table-responsive d-none d-md-block">
            <table className="table table-striped table-hover align-middle">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Ora</th>
                  <th>Cliente</th>
                  <th>Contatto</th>
                  <th>Servizio</th>
                  <th>Prezzo</th>
                  <th>Stato</th>
                  <th>Azioni</th>
                </tr>
              </thead>

              <tbody>
                {appointments.map((a) => (
                  <tr key={a._id}>
                    <td>{formatDateShort(a.start)}</td>

                    <td>
                      {formatTime(a.start)} - {formatTime(a.end)}
                    </td>

                    <td>{a.userId?.name || "—"}</td>

                    <td>
                      {a.userId?.phone ? (
                        <a href={`tel:${a.userId.phone}`}>{a.userId.phone}</a>
                      ) : (
                        <a href={`mailto:${a.userId?.email}`}>
                          {a.userId?.email || "—"}
                        </a>
                      )}
                    </td>

                    <td>{a.serviceId?.name || "—"}</td>

                    <td>{formatPrice(a.serviceId?.price)}</td>

                    <td>
                      <span
                        className={`badge ${
                          STATUS_BADGES[a.status] || "bg-secondary"
                        }`}
                      >
                        {STATUS_LABELS[a.status] || a.status}
                      </span>
                    </td>

                    <td>{renderActions(a)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
