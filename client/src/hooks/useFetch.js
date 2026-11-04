import { useState, useEffect } from "react";
import { apiFetch } from "../api/http.js";

// GET condiviso tra le pagine: gestisce loading / error / data e offre refetch.
// Espone anche setData così le pagine possono aggiornare la lista in locale
// dopo le mutazioni (creazione/modifica/disattivazione) senza rifare la GET.
export default function useFetch(endpoint, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await apiFetch(endpoint, options));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [endpoint]);

  return { data, setData, loading, error, refetch: fetchData };
}
