import { useContext } from "react";
import ThemeContext from "../context/ThemeContext";

// Tema corrente ("light" | "dark") + funzione per alternarlo.
export default function useTheme() {
  return useContext(ThemeContext);
}
