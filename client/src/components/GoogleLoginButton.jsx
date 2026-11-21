import { useContext, useEffect, useRef, useState } from "react";
import AuthContext from "../context/AuthContext";
import useTheme from "../hooks/useTheme.js";

// Senza Client ID configurato il bottone non viene mostrato.
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

// Lo script di Google si carica una volta sola, anche se il componente
// viene rimontato (la promise in cache evita richieste doppie).
let scriptPromise = null;
const loadGoogleScript = () => {
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("script Google non caricato"));
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
};

export default function GoogleLoginButton({ text = "continue_with", onError, onSuccess }) {
  const { googleLogin } = useContext(AuthContext);
  const { theme } = useTheme();
  const buttonRef = useRef(null);
  const [scriptError, setScriptError] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID || !buttonRef.current) return;

    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled) return;

        // google.accounts.id arriva dallo script; callback riceve il
        // "credential" (token ID firmato da Google).
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async ({ credential }) => {
            try {
              await googleLogin(credential);
              onSuccess?.();
            } catch (err) {
              onError?.(err.message);
            }
          },
        });

        // L'iframe di Google riempie il div: se il div è più largo del
        // bottone (Google lo limita a 400px), i bordi bianchi dell'iframe
        // spuntano ai lati in dark mode. Il div deve quindi essere ESATTAMENTE
        // largo quanto il bottone, e lo centriamo sotto quello "Accedi".
        const containerWidth = buttonRef.current.parentElement?.clientWidth || 320;
        const width = Math.min(400, containerWidth);
        buttonRef.current.innerHTML = "";
        buttonRef.current.style.width = `${width}px`;
        buttonRef.current.style.marginInline = "auto";
        window.google.accounts.id.renderButton(buttonRef.current, {
          // "outline" è bianco: in dark mode spara, quindi usiamo "filled_black"
          // (nero con testo bianco). Al cambio tema l'effetto riparte e ridisegna il bottone.
          theme: theme === "dark" ? "filled_black" : "outline",
          size: "large",
          text,
          width,
          locale: "it",
        });
      })
      .catch(() => {
        if (!cancelled) setScriptError(true);
      });

    // Smontato prima che lo script sia pronto? Meglio non inizializzare Google.
    return () => {
      cancelled = true;
    };
  }, [googleLogin, onError, onSuccess, text, theme]);

  if (!CLIENT_ID) return null;

  if (scriptError) {
    return (
      <p className="text-danger small mb-0">
        Impossibile caricare l'accesso con Google. Riprova più tardi.
      </p>
    );
  }

  // Google disegna dentro questo div il suo bottone ufficiale.
  return <div ref={buttonRef} aria-label="Accedi con Google" />;
}
