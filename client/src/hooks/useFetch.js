import { useState, useEffect } from "react";

// GET condiviso tra le pagine: gestisce loading / error / data e offre refetch.
// Espone anche setData così le pagine possono aggiornare la lista in locale
// dopo le mutazioni (creazione/modifica/disattivazione) senza rifare la GET.
export default function useFetch(url, options) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, options);
      const payload = await res.json().catch(() => null);
      if (!res.ok)
        throw new Error(payload?.error?.message || "Errore caricamento dati");
      setData(payload);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [url]);

  return { data, setData, loading, error, refetch: fetchData };
}
