import { Link } from "react-router-dom";
import { CalendarDays, Scissors, Clock, ChevronRight } from "lucide-react";

const SECTIONS = [
  {
    to: "/admin/appointments",
    icon: CalendarDays,
    title: "Appuntamenti",
    description: "Visualizza e gestisci gli appuntamenti del negozio.",
  },
  {
    to: "/admin/services",
    icon: Scissors,
    title: "Servizi",
    description: "Crea, modifica o disattiva i servizi offerti.",
  },
  {
    to: "/admin/orari",
    icon: Clock,
    title: "Orari di apertura",
    description: "Imposta gli orari settimanali e le pause del negozio.",
  },
];

/**
 * Panoramica admin: una card per sezione. Su desktop il link testuale
 * con freccia; su mobile la card diventa una riga con chevron a destra.
 */
export default function AdminDashboard() {
  return (
    <div>
      <h2 className="mb-1">Panoramica</h2>
      <p className="text-secondary mb-4">Gestisci il tuo negozio.</p>

      <div className="row g-3">
        {SECTIONS.map(({ to, icon: Icon, title, description }) => (
          <div className="col-md-6" key={to}>
            <div className="card h-100">
              <div className="card-body">
                <Link to={to} className="admin-entry">
                  <Icon size={22} className="admin-entry-icon" />
                  <div className="admin-entry-body">
                    <h5 className="mb-1">{title}</h5>
                    <p className="text-secondary small mb-1">{description}</p>
                    <span className="admin-entry-link d-none d-md-inline">
                      Vai →
                    </span>
                  </div>
                  <ChevronRight size={18} className="admin-entry-chevron d-md-none" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
