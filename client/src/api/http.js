const API = import.meta.env.VITE_API_URL;

// fetch condiviso: header auth, JSON e formato errore del backend
// ({ error: { message } }). L'errore lanciato espone .status.
export async function apiFetch(endpoint, { method = "GET", token, body, signal } = {}) {
  const res = await fetch(`${API}${endpoint}`, {
    method,
    signal,
    headers: {
      ...(body !== undefined && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const error = new Error(data?.error?.message || "Errore del server");
    error.status = res.status;
    throw error;
  }

  return data;
}
