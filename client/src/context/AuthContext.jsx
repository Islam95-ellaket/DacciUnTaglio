import { createContext, useState } from "react";
import { apiFetch } from "../api/http.js";

const AuthContext = createContext();

// Ripristina la sessione da localStorage al primo render (lettura lazy:
// niente effect e niente flash di caricamento).
const readStoredUser = () => {
  try {
    const saved = localStorage.getItem("user");
    return saved ? JSON.parse(saved) : null;
  } catch {
    // JSON corrotto: trattiamo la sessione come assente
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  // Con la lettura lazy non c'è fase di caricamento: il flag resta per i
  // consumatori del contesto (es. ProtectedRoute).
  const [loading] = useState(false);

  // Login, registrazione e login Google condividono la stessa chiamata
  // e lo stesso salvataggio (token JWT + dati pubblici dell'utente).
  const authenticate = async (endpoint, body) => {
    const data = await apiFetch(`/auth${endpoint}`, { method: "POST", body });

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };

  const login = (email, password) => authenticate("/login", { email, password });

  const register = (name, email, password, phone = "") =>
    authenticate("/register", { name, email, password, phone });

  // Il backend verifica il token ID di Google; il salvataggio è lo stesso
  // degli altri login.
  const googleLogin = (idToken) => authenticate("/google", { idToken });

  // Logout: pulisci tutto
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, googleLogin, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
