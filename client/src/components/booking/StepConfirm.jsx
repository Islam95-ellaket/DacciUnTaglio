import ErrorAlert from "../ErrorAlert.jsx";
import { formatPrice, formatDate, formatTime } from "../../utils/format.js";

// Step 3 del booking: card di riepilogo centrata (520px) con totale in
// grande e un solo bottone primario ("Conferma prenotazione").
export default function StepConfirm({ service, slot, message, confirming, onBack, onConfirm }) {
  return (
    <div className="confirm-wrap">
      <h2 className="mb-3">Conferma prenotazione</h2>

      <ErrorAlert message={message} />

      <div className="card mb-3">
        <div className="card-body">
          <p className="mb-1">
            <strong>Servizio:</strong> {service.name}
          </p>
          <p className="text-secondary mb-1">
            <strong className="text-dark">Data:</strong> {formatDate(slot)}
          </p>
          <p className="text-secondary mb-1">
            <strong className="text-dark">Ora:</strong> {formatTime(slot)}
          </p>
          <p className="text-secondary mb-0">
            <strong className="text-dark">Durata:</strong>{" "}
            {service.durationMinutes} min
          </p>
          <hr />
          <div className="d-flex justify-content-between align-items-center">
            <span className="text-secondary">Totale</span>
            <span className="confirm-total">{formatPrice(service.price)}</span>
          </div>
        </div>
      </div>

      <div className="d-flex gap-2">
        <button className="btn btn-outline-secondary" onClick={onBack} disabled={confirming}>
          Indietro
        </button>
        <button className="btn btn-primary flex-fill" onClick={onConfirm} disabled={confirming}>
          {confirming ? "Conferma in corso..." : "Conferma prenotazione"}
        </button>
      </div>
    </div>
  );
}
