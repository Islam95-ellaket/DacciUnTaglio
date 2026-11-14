import ErrorAlert from "../ErrorAlert.jsx";
import { formatPrice, formatDate, formatTime } from "../../utils/format.js";

// Step 3 del booking: riepilogo della prenotazione e conferma finale.
export default function StepConfirm({ service, slot, message, confirming, onBack, onConfirm }) {
  return (
    <div>
      <h2 className="mb-3">Conferma prenotazione</h2>

      <ErrorAlert message={message} />

      <div className="card mb-3">
        <div className="card-body">
          <p>
            <strong>Servizio:</strong> {service.name}
          </p>
          <p>
            <strong>Durata:</strong> {service.durationMinutes} min
          </p>
          <p>
            <strong>Data:</strong> {formatDate(slot)}
          </p>
          <p>
            <strong>Ora:</strong> {formatTime(slot)}
          </p>
          <p className="fw-bold">
            <strong>Prezzo:</strong> {formatPrice(service.price)}
          </p>
        </div>
      </div>

      <div className="d-flex gap-2">
        <button className="btn btn-secondary" onClick={onBack} disabled={confirming}>
          Indietro
        </button>
        <button className="btn btn-success" onClick={onConfirm} disabled={confirming}>
          {confirming ? "Conferma in corso..." : "Conferma prenotazione"}
        </button>
      </div>
    </div>
  );
}
