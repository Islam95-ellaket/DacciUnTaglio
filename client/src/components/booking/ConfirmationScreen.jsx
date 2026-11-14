import { formatPrice, formatDate, formatTime } from "../../utils/format.js";

// Schermata finale mostrata dopo una prenotazione riuscita.
export default function ConfirmationScreen({ service, slot, onReset }) {
  return (
    <div className="text-center mt-5">
      <div className="alert alert-success">
        <h4>✅ Prenotazione confermata!</h4>
        <p>
          {service.name} — {formatDate(slot)} alle {formatTime(slot)}
        </p>
        <p className="fw-bold">{formatPrice(service.price)}</p>
      </div>
      <button className="btn btn-primary" onClick={onReset}>
        Nuova prenotazione
      </button>
    </div>
  );
}
