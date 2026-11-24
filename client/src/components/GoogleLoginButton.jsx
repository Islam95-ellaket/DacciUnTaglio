import { useContext, useEffect, useRef, useState } from "react";
import AuthContext from "../context/AuthContext";

// Senza Client ID configurato il bottone non viene mostrato.
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCRIPT_SRC = "https://accounts.google.com/gsi/client";

// Lo script di Google arriva precaricato da index.html: qui lo riusiamo
// senza crearne un secondo (la promise in cache evita anche richieste doppie).
let scriptPromise = null;
const loadGoogleScript = () => {
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      // Caso normale: lo script di index.html è già stato eseguito.
      if (window.google?.accounts?.id) {
        resolve();
        return;
      }

      // Ancora in caricamento: agganciamo il tag già presente.
      const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
      if (existing) {
        existing.addEventListener("load", resolve);
        existing.addEventListener("error", () =>
          reject(new Error("script Google non caricato"))
        );
        return;
      }

      // Fallback (es. script tolto dall'HTML): lo creiamo noi.
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

  // Le callback arrivano come arrow function inline dai genitori: a ogni loro
  // render sarebbero un riferimento nuovo e l'effetto sotto ridisegnerebbe il
  // bottone Google a OGNI tasto premuto (con sfarfallio). In una ref sempre
  // aggiornata l'effetto resta stabile e chiama comunque quelle attuali.
  const callbacksRef = useRef({ googleLogin, onError, onSuccess });
  useEffect(() => {
    callbacksRef.current = { googleLogin, onError, onSuccess };
  });

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
              await callbacksRef.current.googleLogin(credential);
              callbacksRef.current.onSuccess?.();
            } catch (err) {
              callbacksRef.current.onError?.(err.message);
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
    // Il bottone si disegna una volta sola (o se cambia il testo): le callback
    // viaggiano sulla ref, quindi NON ridisegnare a ogni render dei genitori.
  }, [text]);

  if (!CLIENT_ID) return null;

  if (scriptError) {
    return (
      <p className="text-danger small mb-0">
        Impossibile caricare l'accesso con Google. Riprova più tardi.
      </p>
    );
  }

  // Google disegna dentro questo div il suo bottone ufficiale (iframe
  // asincrono). Il CSS riserva lo spazio con un'altezza minima, altrimenti
  // quando il bottone arriva spinge in basso il contenuto sotto di lui.
  return <div ref={buttonRef} aria-label="Accedi con Google" className="google-login-slot" />;
}
