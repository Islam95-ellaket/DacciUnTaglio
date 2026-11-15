import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { formatPrice, formatDate, formatTime } from "../../utils/format.js";

// Schermata finale: cerchio verde con check, dettagli dell'appuntamento
// e due azioni: "Le mie prenotazioni" (primario) e "Torna alla home".
export default function ConfirmationScreen({ service, slot }) {
  return (
    <div className="confirm-wrap text-center mt-4">
      <div className="confirm-circle">
        <Check size={30} />
      </div>
      <h2 className="mb-2">Prenotazione confermata!</h2>
      <p className="text-secondary">
        {service.name} — {formatDate(slot)} alle {formatTime(slot)}
      </p>
      <p className="confirm-total mb-4">{formatPrice(service.price)}</p>

      <div className="d-grid gap-2 d-md-flex justify-content-md-center">
        <Link to="/my-bookings" className="btn btn-primary">
          Le mie prenotazioni
        </Link>
        <Link to="/" className="btn btn-outline-primary">
          Torna alla home
        </Link>
      </div>
    </div>
  );
}
