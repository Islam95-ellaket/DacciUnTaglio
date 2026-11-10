import { Link } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "../context/AuthContext";

export default function Home() {
  const { user } = useContext(AuthContext);
  return (
    <div className="text-center mt-5">
      <h1>Benvenuto su DacciUnTaglio</h1>
      <p className="text-muted">Prenota il tuo appuntamento in pochi click.</p>
      <div className="d-flex gap-2 justify-content-center mt-4">
        <Link to="/services" className="btn btn-primary">
          Vedi i Servizi
        </Link>

        {user && user.role !== "admin" && (
          <>
            <Link to="/booking" className="btn btn-outline-primary">
              Prenota un Appuntamento
            </Link>
            <Link to="/my-bookings" className="btn btn-outline-primary">
              Le mie prenotazioni
            </Link>
          </>
        )}

        {user && user.role === "admin" && (
          <Link to="/admin-area" className="btn btn-primary">
            Vai all'Area Admin
          </Link>
        )}

        {!user && (
          <>
            <Link to="/login" className="btn btn-outline-secondary">
              Accedi
            </Link>
            <Link to="/register" className="btn btn-secondary">
              Registrati
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
