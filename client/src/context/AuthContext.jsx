import { createContext, useState, useEffect } from "react";
import { apiFetch } from "../api/http.js";

// 1) Crea il contesto (il "contenitore" condiviso)
const AuthContext = createContext();

// 2) Il provider: avvolge l'app e fornisce stato + funzioni a tutti i figli
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // true finché non abbiamo letto localStorage

  // 3) Al mount (una sola volta): ripristina la sessione da localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken) setToken(savedToken);
    if (savedUser) setUser(JSON.parse(savedUser));

    setLoading(false);
  }, []);

  // 4) Login e registrazione condividono la stessa chiamata e lo stesso salvataggio
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

  // 5) Logout: pulisci tutto
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// 6) Esporta il contesto (per usarlo con useContext nelle pagine)
export default AuthContext;
