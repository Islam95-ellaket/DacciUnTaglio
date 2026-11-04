import { useContext, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import AuthContext from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const closeMenu = () => setOpen(false);

  const handleLogout = () => {
    logout();
    closeMenu();
    navigate("/");
  };

  // Classe "active" automatica sulla pagina corrente
  const linkClass = ({ isActive }) => `nav-link ${isActive ? "active" : ""}`;

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container">
        <Link className="navbar-brand" to="/" onClick={closeMenu}>
          Barber Booking
        </Link>

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
              <NavLink className={linkClass} to="/" onClick={closeMenu}>
                Home
              </NavLink>
            </li>

            <li className="nav-item">
              <NavLink className={linkClass} to="/services" onClick={closeMenu}>
                Servizi
              </NavLink>
            </li>

            {user ? (
              <>
                <li className="nav-item">
                  <span className="navbar-text me-lg-2">Ciao, {user.name}</span>
                </li>

                {user.role !== "admin" && (
                  <>
                    <li className="nav-item">
                      <NavLink className={linkClass} to="/booking" onClick={closeMenu}>
                        Prenota
                      </NavLink>
                    </li>
                    <li className="nav-item">
                      <NavLink className={linkClass} to="/my-bookings" onClick={closeMenu}>
                        Le mie prenotazioni
                      </NavLink>
                    </li>
                  </>
                )}

                {user.role === "admin" && (
                  <>
                    <li className="nav-item">
                      <NavLink
                        className={linkClass}
                        to="/admin-area"
                        onClick={closeMenu}
                      >
                        Area Admin
                      </NavLink>
                    </li>
                  </>
                )}

                <li className="nav-item">
                  <button
                    className="btn btn-sm btn-outline-light ms-lg-2 mt-2 mt-lg-0"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </li>
              </>
            ) : (
              <>
                <li className="nav-item">
                  <NavLink className={linkClass} to="/login" onClick={closeMenu}>
                    Login
                  </NavLink>
                </li>
                <li className="nav-item">
                  <NavLink
                    className={linkClass}
                    to="/register"
                    onClick={closeMenu}
                  >
                    Registrati
                  </NavLink>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </nav>
  );
}