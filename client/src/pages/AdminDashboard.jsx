import { Link } from "react-router-dom";

export default function AdminDashboard() {
  return (
    <div>
      <h2 className="mb-4">Area Admin</h2>
      <p className="text-muted mb-4">Gestisci il tuo negozio.</p>

      <div className="row g-3">
        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-body text-center">
              <h5 className="card-title">📅 Appuntamenti</h5>
              <p className="card-text">
                Visualizza e gestisci gli appuntamenti del negozio.
              </p>
              <Link to="/admin/appointments" className="btn btn-primary">
                Vai agli appuntamenti
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card h-100">
            <div className="card-body text-center">
              <h5 className="card-title">✂️ Gestione Servizi</h5>
              <p className="card-text">
                Crea, modifica o disattiva i servizi offerti.
              </p>
              <Link to="/admin/services" className="btn btn-primary">
                Vai alla gestione servizi
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}