import { useState, useContext } from "react";
import AuthContext from "../context/AuthContext";
import ErrorAlert from "../components/ErrorAlert";
import useFetch from "../hooks/useFetch";
import { apiFetch } from "../api/http.js";
import { formatPrice } from "../utils/format.js";
import { uploadImageToCloudinary } from "../utils/cloudinary.js";
import ServiceActions from "../components/services/ServiceActions.jsx";
import ServiceEditModal from "../components/services/ServiceEditModal.jsx";

// Gestione servizi: creazione (con immagine opzionale caricata su Cloudinary),
// modifica e disattivazione (soft delete: il backend mette isActive: false).
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
  const [imageFile, setImageFile] = useState(null); // file scelto per la CREAZIONE
  const [imagePreview, setImagePreview] = useState("");
  const [saving, setSaving] = useState(false);

  // servizio in modifica (null = modal chiuso)
  const [editing, setEditing] = useState(null);
  const [editImageFile, setEditImageFile] = useState(null); // nuova immagine in modifica
  const [editImagePreview, setEditImagePreview] = useState("");

  // Anteprima locale del file scelto (nessun upload finché non si salva)
  const makePreview = (file) =>
    file ? URL.createObjectURL(file) : "";

  const handleImageChange = (e, setFile, setPreview) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage("Immagine troppo grande (massimo 5 MB).");
      e.target.value = "";
      return;
    }
    setFile(file);
    setPreview(makePreview(file));
    setMessage("");
  };

  // --- POST creazione (immagine prima su Cloudinary, poi servizio col link) ---
  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage("");
    setSaving(true);
    try {
      let imageUrl = "";
      if (imageFile) {
        imageUrl = await uploadImageToCloudinary(imageFile);
      }
      const service = await apiFetch("/services", {
        method: "POST",
        token,
        body: {
          name: form.name.trim(),
          price: Number(form.price),
          durationMinutes: Number(form.durationMinutes),
          imageUrl,
        },
      });
      setServices((prev) => [...prev, service]);
      setForm({ name: "", price: "", durationMinutes: "" });
      setImageFile(null);
      setImagePreview("");
      setMessage("Servizio creato.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  // --- PATCH modifica ---
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setMessage("");
    try {
      let imageUrl = editing.imageUrl;
      if (editImageFile) {
        imageUrl = await uploadImageToCloudinary(editImageFile);
      }
      const updated = await apiFetch(`/services/${editing._id}`, {
        method: "PATCH",
        token,
        body: {
          name: editing.name.trim(),
          price: Number(editing.price),
          durationMinutes: Number(editing.durationMinutes),
          imageUrl,
        },
      });
      setServices((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
      setEditing(null);
      setEditImageFile(null);
      setEditImagePreview("");
      setMessage("Servizio aggiornato.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
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

  const openEdit = (service) => {
    setEditing({ ...service });
    setEditImageFile(null);
    setEditImagePreview("");
  };

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
          <button className="btn btn-primary w-100" type="submit" disabled={saving}>
            {saving ? "Salvataggio..." : "Aggiungi"}
          </button>
        </div>
        <div className="col-12 d-flex align-items-center gap-3">
          <input
            type="file"
            accept="image/*"
            className="form-control"
            style={{ maxWidth: 420 }}
            onChange={(e) => handleImageChange(e, setImageFile, setImagePreview)}
          />
          <span className="small text-secondary">
            Immagine facoltativa (jpg, png, webp — max 5 MB)
          </span>
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Anteprima"
              style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 8 }}
            />
          )}
        </div>
      </form>

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
              <ServiceActions service={s} onEdit={openEdit} onDelete={handleDelete} />
            </div>
          </div>
        ))}
      </div>

      {/* Tabella su tablet e desktop */}
      <div className="table-responsive d-none d-md-block">
        <table className="table">
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
                <td className="d-flex align-items-center gap-2">
                  {s.imageUrl && (
                    <img
                      src={s.imageUrl}
                      alt=""
                      style={{ width: 40, height: 40, objectFit: "cover", borderRadius: 8 }}
                    />
                  )}
                  {s.name}
                </td>
                <td>{formatPrice(s.price)}</td>
                <td>{s.durationMinutes} min</td>
                <td>
                  <ServiceActions service={s} onEdit={openEdit} onDelete={handleDelete} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ServiceEditModal
        editing={editing}
        onChange={setEditing}
        onClose={() => setEditing(null)}
        onSubmit={handleUpdate}
        saving={saving}
        imagePreview={editImagePreview || editing?.imageUrl || ""}
        onImageChange={(e) => handleImageChange(e, setEditImageFile, setEditImagePreview)}
      />

      {services.length === 0 && (
        <div className="alert alert-info">Nessun servizio attivo.</div>
      )}
    </div>
  );
}
