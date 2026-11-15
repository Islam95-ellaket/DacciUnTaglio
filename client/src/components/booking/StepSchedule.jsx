import ErrorAlert from "../ErrorAlert.jsx";
import { formatTime, formatPrice, getRomeDate } from "../../utils/format.js";

// Step 2 del booking: riepilogo servizio+data (colonna 380px su desktop)
// e griglia di slot orari. Su mobile le due colonne si impilano.
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

      {!token && (
        <div className="alert alert-warning">
          Devi effettuare l'accesso per completare la prenotazione.
        </div>
      )}
      {message && <div className="alert alert-warning">{message}</div>}
      <ErrorAlert message={slotsError} onRetry={onRetrySlots} />

      <div className="booking-layout">
        {/* Riepilogo: servizio scelto + data */}
        <div className="card">
          <div className="card-body">
            <p className="small text-secondary text-uppercase mb-1">Riepilogo</p>
            <h5 className="mb-1">{service.name}</h5>
            <p className="text-secondary small mb-2">
              {service.durationMinutes} min
            </p>
            <p className="fw-bold text-brand">{formatPrice(service.price)}</p>
            <hr />
            <label className="form-label">Data</label>
            <input
              type="date"
              className="form-control"
              value={date}
              onChange={(e) => onSelectDate(e.target.value)}
              min={today}
            />
          </div>
        </div>

        {/* Slot orari della data scelta */}
        <div>
          {slotsLoading && (
            <div className="text-center text-secondary">Caricamento orari...</div>
          )}

          {!date && !slotsLoading && (
            <p className="text-secondary mb-0">
              Seleziona una data nel riepilogo per vedere gli orari disponibili.
            </p>
          )}

          {!slotsLoading && !slotsError && date && slots.length === 0 && (
            <div className="alert alert-info mb-0">
              Nessuno slot disponibile per questa data.
            </div>
          )}

          {!slotsLoading && slots.length > 0 && (
            <>
              <h5 className="mb-3">Scegli un orario</h5>
              <div className="slot-grid">
                {slots.map((slot) => (
                  <button
                    key={slot}
                    type="button"
                    className={`slot ${
                      selectedSlot === slot ? "slot--selected" : ""
                    }`}
                    onClick={() => onSelectSlot(slot)}
                  >
                    {formatTime(slot)}
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="d-flex justify-content-between align-items-center mt-3">
            <button
              className="btn btn-link text-secondary p-0 text-decoration-none"
              onClick={onBack}
            >
              ← Indietro
            </button>
            <button
              className="btn btn-primary"
              disabled={!selectedSlot || !token}
              onClick={onNext}
            >
              Continua
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
