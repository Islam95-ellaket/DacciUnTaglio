import { useState, useContext } from "react";
import AuthContext from "../context/AuthContext";
import ErrorAlert from "../components/ErrorAlert";
import useFetch from "../hooks/useFetch";

const API = import.meta.env.VITE_API_URL;

export default function Services() {
  const { token } = useContext(AuthContext);

  const {
    data: services,
    setData: setServices,
    loading,
    error,
    refetch: loadData,
  } = useFetch(`${API}/services`);

  const [message, setMessage] = useState("");

  // form creazione
  const [form, setForm] = useState({ name: "", price: "", durationMinutes: "" });

  // servizio in modifica (null = modal chiuso)
  const [editing, setEditing] = useState(null);

  // --- POST creazione ---
  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const res = await fetch(`${API}/services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name.trim(),
          price: Number(form.price),
          durationMinutes: Number(form.durationMinutes),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Errore creazione");
      setServices((prev) => [...prev, data]);
      setForm({ name: "", price: "", durationMinutes: "" });
      setMessage("Servizio creato.");
    } catch (err) {
      setMessage(err.message);
    }
  };

  // --- PATCH modifica ---
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editing) return;
    try {
      const res = await fetch(`${API}/services/${editing._id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editing.name.trim(),
          price: Number(editing.price),
          durationMinutes: Number(editing.durationMinutes),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Errore aggiornamento");
      setServices((prev) => prev.map((s) => (s._id === data._id ? data : s)));
      setEditing(null);
      setMessage("Servizio aggiornato.");
    } catch (err) {
      setMessage(err.message);
    }
  };

  // --- DELETE (soft delete lato backend) ---
  const handleDelete = async (id) => {
    if (!window.confirm("Disattivare questo servizio?")) return;
    try {
      const res = await fetch(`${API}/services/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Errore eliminazione");
      // rimuovo dalla lista locale (il backend ha messo isActive: false)
      setServices((prev) => prev.filter((s) => s._id !== id));
      setMessage("Servizio disattivato.");
    } catch (err) {
      setMessage(err.message);
    }
  };

  const formatPrice = (v) =>
    v.toLocaleString("it-IT", { style: "currency", currency: "EUR" });

  if (loading) return <div className="text-center mt-5">Caricamento...</div>;
  if (error) return <ErrorAlert message={error} onRetry={loadData} />;

  return (
    <div>
      <h2 className="mb-3">Gestione servizi</h2>
      {message && <div className="alert alert-info">{message}</div>}

      {/* Form creazione */}
      <form onSubmit={handleCreate} className="row g-2 mb-4">
        <div className="col-md-4">
          <input className="form-control" placeholder="Nome servizio"
            value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </div>
        <div className="col-md-3">
          <input className="form-control" type="number" placeholder="Prezzo (€)" min="0" step="0.01"
            value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
        </div>
        <div className="col-md-3">
          <input className="form-control" type="number" placeholder="Durata (min)" min="1"
            value={form.durationMinutes} onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })} required />
        </div>
        <div className="col-md-2">
          <button className="btn btn-primary w-100" type="submit">Aggiungi</button>
        </div>
      </form>

      {/* Tabella */}
      <table className="table table-striped">
        <thead>
          <tr><th>Nome</th><th>Prezzo</th><th>Durata</th><th>Azioni</th></tr>
        </thead>
        <tbody>
          {services.map((s) => (
            <tr key={s._id}>
              <td>{s.name}</td>
              <td>{formatPrice(s.price)}</td>
              <td>{s.durationMinutes} min</td>
              <td>
                <button className="btn btn-sm btn-outline-secondary me-2"
                  onClick={() => setEditing({ ...s })}>Modifica</button>
                <button className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDelete(s._id)}>Disattiva</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal modifica (Bootstrap, gestito con stato) */}
      {editing && (
        <div className="modal d-block modal-overlay-dark" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleUpdate}>
                <div className="modal-header">
                  <h5 className="modal-title">Modifica servizio</h5>
                  <button type="button" className="btn-close" onClick={() => setEditing(null)} />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nome</label>
                    <input className="form-control" value={editing.name}
                      onChange={(e) => setEditing({ ...editing, name: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Prezzo (€)</label>
                    <input className="form-control" type="number" min="0" step="0.01"
                      value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Durata (min)</label>
                    <input className="form-control" type="number" min="1"
                      value={editing.durationMinutes} onChange={(e) => setEditing({ ...editing, durationMinutes: e.target.value })} required />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Annulla</button>
                  <button type="submit" className="btn btn-primary">Salva</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
