import { useContext, useEffect, useRef, useState } from "react";
import AuthContext from "../context/AuthContext";

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

        // Larghezza adattiva: riempie il contenitore senza traboccare sui telefoni.
        // Larghezza naturale del div = larghezza del contenuto del genitore
        // (come il bottone "Accedi" in w-100); va letta PRIMA di assegnare
        // style.width, altrimenti la seconda esecuzione trova quella vecchia.
        buttonRef.current.style.width = "";
        const containerWidth = buttonRef.current.clientWidth || 320;
        const width = Math.min(400, containerWidth);
        // Google non disegna il bottone oltre i 400px: il div resta largo
        // quanto il bottone e, se il contenitore è più largo, lo zoom sul div
        // (quello sull'iframe viene ignorato) lo porta a tutta la larghezza.
        // Sotto i 400px di contenitore tutto resta al naturale (zoom 1).
        buttonRef.current.style.width = `${width}px`;
        if (containerWidth > width) {
          buttonRef.current.style.zoom = String(containerWidth / width);
        }
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
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
  }, [googleLogin, onError, onSuccess, text]);

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
