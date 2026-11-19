import { useContext, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Scissors, Moon, Sun } from "lucide-react";
import AuthContext from "../context/AuthContext";
import useTheme from "../hooks/useTheme.js";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/");
  };

  const goToBooking = () => {
    closeMenu();
    navigate("/booking");
  };

  // CTA "Prenota ora": nel menu mobile compare SOTTO "Le mie prenotazioni";
  // su desktop resta a destra grazie a order-lg-last.
  const cta = (
    <li className="nav-item d-none d-md-block ms-lg-3 order-lg-last">
      <button className="btn btn-primary btn-sm navbar-cta" onClick={goToBooking}>
        Prenota ora
      </button>
    </li>
  );

  // Classe "active" automatica sulla pagina corrente
  const linkClass = ({ isActive }) => `nav-link ${isActive ? "active" : ""}`;

  return (
    <nav className="navbar navbar-expand-lg navbar-light navbar-app">
      <div className="container">
        <Link className="navbar-brand" to="/" onClick={closeMenu}>
          <Scissors size={18} className="me-2" />
          DacciUnTaglio
        </Link>

        {/* Nome utente accanto all'hamburger (visibile solo sotto il breakpoint lg) */}
        {user && (
          <span className="navbar-user-mobile d-lg-none" title={`Ciao, ${user.name}`}>
            Ciao, {user.name}
          </span>
        )}

        {/* Cambio tema chiaro/scuro: sempre visibile, accanto all'hamburger */}
        <button
          type="button"
          className="btn btn-sm navbar-theme-toggle"
          onClick={toggleTheme}
          aria-label={theme === "dark" ? "Passa alla modalità chiara" : "Passa alla modalità scura"}
          title={theme === "dark" ? "Modalità chiara" : "Modalità scura"}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Hamburger: visibile solo sotto il breakpoint lg */}
        <button
          className="navbar-toggler"
          type="button"
          aria-controls="main-navbar"
          aria-expanded={open}
          aria-label="Apri o chiudi il menu"
          onClick={() => setOpen((prev) => !prev)}
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div
          id="main-navbar"
          className={`collapse navbar-collapse ${open ? "show" : ""}`}
        >
          <ul className="navbar-nav ms-auto align-items-lg-center">
            <li className="nav-item">
              <NavLink className={linkClass} to="/" onClick={closeMenu} end>
                Home
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className={linkClass} to="/services" onClick={closeMenu}>
                Servizi
              </NavLink>
            </li>

            {/* Ospiti: la CTA sta dopo "Servizi" */}
            {!user && cta}

            {user ? (
              <>
                {user.role !== "admin" && (
                  <li className="nav-item">
                    <NavLink className={linkClass} to="/my-bookings" onClick={closeMenu}>
                      Le mie prenotazioni
                    </NavLink>
                  </li>
                )}

                {/* Loggati: la CTA sta sotto "Le mie prenotazioni" */}
                {user.role !== "admin" && cta}

                <li className="nav-item d-none d-lg-block">
                  <span className="navbar-text ms-lg-2 fw-semibold">
                    Ciao, {user.name}
                  </span>
                </li>

                <li className="nav-item">
                  <button
                    className="btn btn-sm btn-outline-secondary ms-lg-2 mt-2 mt-lg-0"
                    onClick={handleLogout}
                  >
                    Esci
                  </button>
                </li>
              </>
            ) : (
              <li className="nav-item">
                <NavLink className={linkClass} to="/login" onClick={closeMenu}>
                  Accedi
                </NavLink>
              </li>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}
