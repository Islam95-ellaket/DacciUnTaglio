import ErrorAlert from "../ErrorAlert.jsx";
import { formatTime, getRomeDate } from "../../utils/format.js";

// Step 2 del booking: scelta della data (picker nativo) e dell'orario
// (griglia di slot caricata dal backend per la data selezionata).
export default function StepSchedule({
  service,
  token,
  date,
  slots,
  slotsLoading,
  slotsError,
  selectedSlot,
  message,
  onSelectDate,
  onSelectSlot,
  onRetrySlots,
  onBack,
  onNext,
}) {
  const today = getRomeDate(); // YYYY-MM-DD nel fuso del negozio: limite del picker

  return (
    <div>
      <h2 className="mb-3">Scegli data e orario</h2>
      <p className="text-muted">
        Servizio: <strong>{service.name}</strong> ({service.durationMinutes}{" "}
        min)
      </p>

      {!token && (
        <div className="alert alert-warning">
          Devi effettuare l'accesso per completare la prenotazione.
        </div>
      )}

      {message && <div className="alert alert-warning">{message}</div>}
      <ErrorAlert message={slotsError} onRetry={onRetrySlots} />

      <div className="mb-3">
        <label className="form-label">Data</label>
        <input
          type="date"
          className="form-control"
          value={date}
          onChange={(e) => onSelectDate(e.target.value)}
          min={today}
        />
      </div>

      {slotsLoading && <div className="text-center">Caricamento slot...</div>}

      {!slotsLoading && !slotsError && date && slots.length === 0 && (
        <div className="alert alert-info">
          Nessuno slot disponibile per questa data.
        </div>
      )}

      {!slotsLoading && slots.length > 0 && (
        <div className="d-flex flex-wrap gap-2 mb-3">
          {slots.map((slot) => (
            <button
              key={slot}
              className={`btn ${
                selectedSlot === slot ? "btn-primary" : "btn-outline-primary"
              }`}
              onClick={() => onSelectSlot(slot)}
            >
              {formatTime(slot)}
            </button>
          ))}
        </div>
      )}

      <div className="d-flex gap-2">
        <button className="btn btn-secondary" onClick={onBack}>
          Indietro
        </button>
        <button
          className="btn btn-primary"
          disabled={!selectedSlot || !token}
          onClick={onNext}
        >
          Avanti
        </button>
      </div>
    </div>
  );
}
