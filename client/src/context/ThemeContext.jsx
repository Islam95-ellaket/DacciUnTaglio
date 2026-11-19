import { createContext, useEffect, useState } from "react";

// Tema chiaro/scuro condiviso in tutta l'app. Il tema vive su
// <html data-bs-theme="...">: Bootstrap 5.3 ribalta i suoi componenti da solo,
// le nostre variabili --dut-* vengono ribaltate in variables.css.
const ThemeContext = createContext();

const getInitialTheme = () =>
  localStorage.getItem("theme") === "dark" ? "dark" : "light";

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-bs-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// L'hook useTheme vive in hooks/useTheme.js (regola react-refresh:
// un file non puo' esportare insieme componenti e hook).
export default ThemeContext;
