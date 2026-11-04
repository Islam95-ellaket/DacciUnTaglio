import { createContext, useState, useEffect } from "react";

// 1) Crea il contesto (il "contenitore" condiviso)
const AuthContext = createContext();

// 2) Il provider: avvolge l'app e fornisce stato + funzioni a tutti i figli
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true); // true finché non abbiamo letto localStorage

  // 3) Al mount (una sola volta): ricarica da localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken) {
      setToken(savedToken);
    }

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    setLoading(false);
  }, []);

  // 4) Login: chiama l'API, salva in localStorage + stato
  const login = async (email, password) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Errore di login");
      }

      const data = await res.json();
      const { token, user } = data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setToken(token);
      setUser(user);
    } catch (error) {
      console.log("ERROR:", error);
      throw error;
    }
  };

  // 5) Register: identico a login ma endpoint /register e body { name, email, password, phone }
  const register = async (name, email, password, phone = "") => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, phone }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || "Errore di registrazione");
      }

      const data = await res.json();
      const { token, user } = data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      setToken(token);
      setUser(user);
    } catch (error) {
      console.log("ERROR:", error);
      throw error; // rilancia perché il form possa mostrare il messaggio
    }
  };

  // 6) Logout: pulisci tutto
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

// 7) Esporta il contesto (per usarlo con useContext nelle pagine)
export default AuthContext;
