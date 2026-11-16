import { useState, useEffect } from "react";
import { apiFetch } from "../api/http.js";

// GET condiviso tra le pagine: loading / error / data + refetch.
// Espone anche setData per aggiornare la lista in locale dopo le mutazioni
// (creazione/modifica/disattivazione) senza rifare la GET.
export default function useFetch(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Refetch manuale (bottone "Riprova"): parte da un evento, quindi i setState
  // sincroni qui vanno bene e danno subito il feedback di caricamento.
  const refetch = () => {
    setLoading(true);
    setError(null);

    return apiFetch(endpoint, options)
      .then(setData)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  // Catena di promesse invece di una funzione async: nessun setState sincrono
  // nel corpo dell'effect (regola react-hooks/set-state-in-effect) e il flag
  // cancelled ignora la risposta se l'endpoint cambia mentre è in volo.
  useEffect(() => {
    let cancelled = false;

    apiFetch(endpoint, options)
      .then((result) => {
        if (!cancelled) {
          setData(result);
          setError(null);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // options è ricreato dai chiamanti a ogni render: dipendere dall'oggetto
    // intero causerebbe una fetch a ogni render. Contratto del hook: si
    // rifà solo quando cambia l'endpoint.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  return { data, setData, loading, error, refetch };
}
