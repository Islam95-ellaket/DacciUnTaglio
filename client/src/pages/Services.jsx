import { useState, useContext } from "react";
import AuthContext from "../context/AuthContext";
import ErrorAlert from "../components/ErrorAlert";
import useFetch from "../hooks/useFetch";
import { apiFetch } from "../api/http.js";
import { formatPrice } from "../utils/format.js";

export default function Services() {
  const { token } = useContext(AuthContext);

  const {
    data: services,
    setData: setServices,
    loading,
    error,
    refetch: loadData,
  } = useFetch("/services");

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
      const service = await apiFetch("/services", {
        method: "POST",
        token,
        body: {
          name: form.name.trim(),
          price: Number(form.price),
          durationMinutes: Number(form.durationMinutes),
        },
      });
      setServices((prev) => [...prev, service]);
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
      const updated = await apiFetch(`/services/${editing._id}`, {
        method: "PATCH",
        token,
        body: {
          name: editing.name.trim(),
          price: Number(editing.price),
          durationMinutes: Number(editing.durationMinutes),
        },
      });
      setServices((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
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
      await apiFetch(`/services/${id}`, { method: "DELETE", token });
      // rimuovo dalla lista locale (il backend ha messo isActive: false)
      setServices((prev) => prev.filter((s) => s._id !== id));
      setMessage("Servizio disattivato.");
    } catch (err) {
      setMessage(err.message);
    }
  };

  // Azioni di un servizio: condivise tra la tabella desktop e le card mobile
  const renderActions = (s) => (
    <>
      <button
        className="btn btn-sm btn-outline-secondary me-2"
        onClick={() => setEditing({ ...s })}
      >
        Modifica
      </button>
      <button
        className="btn btn-sm btn-outline-danger"
        onClick={() => handleDelete(s._id)}
      >
        Disattiva
      </button>
    </>
  );

  if (loading) return <div className="text-center mt-5">Caricamento...</div>;
  if (error) return <ErrorAlert message={error} onRetry={loadData} />;

  return (
    <div>
      <h2 className="mb-3">Gestione servizi</h2>
      {message && <div className="alert alert-info">{message}</div>}

      {/* Form creazione */}
      <form onSubmit={handleCreate} className="row g-2 mb-4">
        <div className="col-md-4">
          <input
            className="form-control"
            placeholder="Nome servizio"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="col-md-3">
          <input
            className="form-control"
            type="number"
            placeholder="Prezzo (€)"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
        </div>
        <div className="col-md-3">
          <input
            className="form-control"
            type="number"
            placeholder="Durata (min)"
            min="1"
            value={form.durationMinutes}
            onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
            required
          />
        </div>
        <div className="col-md-2">
          <button className="btn btn-primary w-100" type="submit">
            Aggiungi
          </button>
        </div>
      </form>

      {/* Elenco servizi: card su mobile, tabella da tablet in su */}
      {/* Card su mobile */}
      <div className="d-md-none">
        {services.map((s) => (
          <div className="card mb-2" key={s._id}>
            <div className="card-body py-2">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <strong>{s.name}</strong>
                <span className="fw-bold">{formatPrice(s.price)}</span>
              </div>
              <div className="small text-muted mb-2">
                Durata: {s.durationMinutes} min
              </div>
              {renderActions(s)}
            </div>
          </div>
        ))}
      </div>

      {/* Tabella su tablet e desktop */}
      <div className="table-responsive d-none d-md-block">
        <table className="table table-striped">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Prezzo</th>
              <th>Durata</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s._id}>
                <td>{s.name}</td>
                <td>{formatPrice(s.price)}</td>
                <td>{s.durationMinutes} min</td>
                <td>{renderActions(s)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal modifica (Bootstrap, gestito con stato) */}
      {editing && (
        <div className="modal d-block modal-overlay-dark" tabIndex="-1">
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleUpdate}>
                <div className="modal-header">
                  <h5 className="modal-title">Modifica servizio</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setEditing(null)}
                  />
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Nome</label>
                    <input
                      className="form-control"
                      value={editing.name}
                      onChange={(e) =>
                        setEditing({ ...editing, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Prezzo (€)</label>
                    <input
                      className="form-control"
                      type="number"
                      min="0"
                      step="0.01"
                      value={editing.price}
                      onChange={(e) =>
                        setEditing({ ...editing, price: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Durata (min)</label>
                    <input
                      className="form-control"
                      type="number"
                      min="1"
                      value={editing.durationMinutes}
                      onChange={(e) =>
                        setEditing({ ...editing, durationMinutes: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setEditing(null)}
                  >
                    Annulla
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Salva
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
