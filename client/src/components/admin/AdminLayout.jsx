import { NavLink, Outlet, Link, useLocation } from "react-router-dom";
import { useContext } from "react";
import AuthContext from "../../context/AuthContext";

const MENU_ITEMS = [
  { to: "/admin-area", label: "Panoramica" },
  { to: "/admin/appointments", label: "Appuntamenti" },
  { to: "/admin/services", label: "Servizi" },
  { to: "/admin/orari", label: "Orari di apertura" },
];

// Layout admin: sidebar scura a sinistra, contenuto a destra. Su mobile la
// sidebar sparisce e la navigazione resta nella navbar.
export default function AdminLayout() {
  const { user } = useContext(AuthContext);
  const { pathname } = useLocation();

  // Iniziali per l'avatar: "Mario Rossi" → "MR"
  const initials =
    user?.name
      ?.split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "A";

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar d-none d-md-flex flex-column">
        <nav className="nav flex-column">
          {MENU_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-profile mt-auto">
          <div className="admin-avatar">{initials}</div>
          <div>
            <div className="admin-profile-name">{user?.name}</div>
            <div className="admin-profile-role">
              {user?.role === "admin" ? "Amministratore" : user?.role}
            </div>
          </div>
        </div>
      </aside>
      <div className="admin-content">
        <Outlet />

        {/* nascosto quando sei già sulla panoramica */}
        {pathname !== "/admin-area" && (
          <div className="mt-4">
            <Link to="/admin-area" className="btn btn-outline-secondary btn-sm admin-back">
              ← Torna alla panoramica
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
