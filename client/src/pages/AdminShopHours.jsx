import { useState, useContext } from "react";
import AuthContext from "../context/AuthContext";
import ErrorAlert from "../components/ErrorAlert";
import useFetch from "../hooks/useFetch";
import { apiFetch } from "../api/http.js";
import { Pencil, Trash2 } from "lucide-react";

// Ordine di visualizzazione: da lunedì a domenica.
// dayOfWeek segue la convenzione JS (0 = domenica, 1 = lunedì, ..., 6 = sabato)
const DAYS = [
  { dayOfWeek: 1, label: "Lunedì" },
  { dayOfWeek: 2, label: "Martedì" },
  { dayOfWeek: 3, label: "Mercoledì" },
  { dayOfWeek: 4, label: "Giovedì" },
  { dayOfWeek: 5, label: "Venerdì" },
  { dayOfWeek: 6, label: "Sabato" },
  { dayOfWeek: 0, label: "Domenica" },
];

// Giorno presente in workingHours → aperto con i suoi orari; assente → chiuso
const buildInitialHours = (shop) => {
  const initial = {};
  for (const d of DAYS) {
    const found = shop.workingHours?.find((w) => w.dayOfWeek === d.dayOfWeek);
    initial[d.dayOfWeek] = found
      ? { isOpen: true, open: found.open, close: found.close }
      : { isOpen: false, open: "09:00", close: "19:00" };
  }
  return initial;
};

export default function AdminShopHours() {
  const { token } = useContext(AuthContext);
  const { data: shop, loading, error, refetch } = useFetch("/shop", { token });

  if (loading) return <div className="text-center mt-5">Caricamento...</div>;
  if (error) return <ErrorAlert message={error} onRetry={refetch} />;

  // Le key su updatedAt fanno rimontare i form (e reinizializzarli) se i dati cambiano
  return (
    <>
      <HoursForm key={`hours-${shop.updatedAt ?? "shop"}`} shop={shop} token={token} />
      <RecurringBlocksForm
        key={`blocks-${shop.updatedAt ?? "shop"}`}
        shop={shop}
        token={token}
      />
    </>
  );
}

function HoursForm({ shop, token }) {
  const [hours, setHours] = useState(() => buildInitialHours(shop));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const updateDay = (dayOfWeek, patch) =>
    setHours((prev) => ({
      ...prev,
      [dayOfWeek]: { ...prev[dayOfWeek], ...patch },
    }));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    // Si inviano solo i giorni aperti: gli altri equivalgono a "chiuso"
    const workingHours = DAYS.filter((d) => hours[d.dayOfWeek].isOpen).map(
      (d) => ({
        dayOfWeek: d.dayOfWeek,
        open: hours[d.dayOfWeek].open,
        close: hours[d.dayOfWeek].close,
      }),
    );

    try {
      await apiFetch("/shop/working-hours", {
        method: "PUT",
        token,
        body: { workingHours },
      });

      setMessage({ type: "success", text: "Orari salvati correttamente." });
    } catch (err) {
      setMessage({ type: "danger", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="mb-1">Orari di apertura</h2>
      <p className="text-muted mb-4">
        Imposta gli orari settimanali del negozio. I giorni chiusi non
        generano slot prenotabili.
      </p>

      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <form onSubmit={handleSave}>
        {DAYS.map((d) => {
          const day = hours[d.dayOfWeek];
          return (
            <div className="row g-2 align-items-end mb-3" key={d.dayOfWeek}>
              <div className="col-6 col-md-2">
                <strong>{d.label}</strong>
              </div>
              <div className="col-6 col-md-2">
                <div className="form-check form-switch mb-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id={`open-${d.dayOfWeek}`}
                    checked={day.isOpen}
                    onChange={(e) =>
                      updateDay(d.dayOfWeek, { isOpen: e.target.checked })
                    }
                  />
                  <label
                    className="form-check-label"
                    htmlFor={`open-${d.dayOfWeek}`}
                  >
                    {day.isOpen ? "Aperto" : "Chiuso"}
                  </label>
                </div>
              </div>
              <div className="col-6 col-md-4">
                <label className="form-label small mb-1">Apertura</label>
                <input
                  type="time"
                  className="form-control"
                  value={day.open}
                  disabled={!day.isOpen}
                  onChange={(e) =>
                    updateDay(d.dayOfWeek, { open: e.target.value })
                  }
                  required={day.isOpen}
                />
              </div>
              <div className="col-6 col-md-4">
                <label className="form-label small mb-1">Chiusura</label>
                <input
                  type="time"
                  className="form-control"
                  value={day.close}
                  disabled={!day.isOpen}
                  onChange={(e) =>
                    updateDay(d.dayOfWeek, { close: e.target.value })
                  }
                  required={day.isOpen}
                />
              </div>
            </div>
          );
        })}

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? "Salvataggio..." : "Salva orari"}
        </button>
      </form>
    </div>
  );
}

const dayLabel = (dayOfWeek) =>
  DAYS.find((d) => d.dayOfWeek === dayOfWeek)?.label ?? "";

const EMPTY_BLOCK = { dayOfWeek: 1, open: "13:00", close: "14:00", reason: "" };

// Sezione "Pause settimanali": blocchi ricorrenti (es. pausa pranzo).
// L'elenco si modifica in locale e si salva per intero con PUT.
function RecurringBlocksForm({ shop, token }) {
  const [blocks, setBlocks] = useState(() => shop.recurringBlocks ?? []);
  const [newBlock, setNewBlock] = useState(EMPTY_BLOCK);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const addBlock = () => {
    setBlocks((prev) => [...prev, { ...newBlock }]);
    setNewBlock(EMPTY_BLOCK);
  };

  const removeBlock = (index) =>
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  const editBlock = (index) => {
    const block = blocks[index];
    setNewBlock({
      dayOfWeek: block.dayOfWeek,
      open: block.open,
      close: block.close,
      reason: block.reason ?? "",
    });
    // Rimuove il blocco dalla lista: l'utente lo modifica nel form
    // e lo riaggiunge con "Aggiungi pausa" (o lo salva direttamente).
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    // Se il form contiene un blocco valido non ancora aggiunto alla lista,
    // lo includiamo nel salvataggio (evita che l'utente debba cliccare
    // "Aggiungi pausa" prima di "Salva pause").
    const finalBlocks = [...blocks];
    if (newBlock.open && newBlock.close && newBlock.open < newBlock.close) {
      finalBlocks.push({ ...newBlock });
    }

    try {
      await apiFetch("/shop/recurring-blocks", {
        method: "PUT",
        token,
        body: { recurringBlocks: finalBlocks },
      });

      setBlocks(finalBlocks);
      setNewBlock(EMPTY_BLOCK);
      setMessage({ type: "success", text: "Pause salvate correttamente." });
    } catch (err) {
      setMessage({ type: "danger", text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mt-5">
      <h2 className="mb-1">Pause settimanali</h2>
      <p className="text-muted mb-3">
        Blocchi ricorrenti che rendono non prenotabili degli orari (es. pausa
        pranzo).
      </p>

      {message && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      {blocks.length === 0 ? (
        <p className="text-muted">Nessuna pausa configurata.</p>
      ) : (
        <ul className="list-group mb-3">
          {blocks.map((b, i) => (
            <li
              key={i}
              className="list-group-item d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2"
            >
              <span>
                <strong>{dayLabel(b.dayOfWeek)}</strong> · {b.open} – {b.close}
                {b.reason ? ` · ${b.reason}` : ""}
              </span>
              <div className="d-flex gap-1 flex-wrap justify-content-end">
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => editBlock(i)}
                  aria-label="Modifica pausa"
                  title="Modifica"
                >
                  <Pencil size={14} />
                </button>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => removeBlock(i)}
                  aria-label="Rimuovi pausa"
                  title="Rimuovi"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="row g-2 align-items-end mb-3">
        <div className="col-6 col-md-3">
          <label className="form-label small mb-1">Giorno</label>
          <select
            className="form-select"
            value={newBlock.dayOfWeek}
            onChange={(e) =>
              setNewBlock({ ...newBlock, dayOfWeek: Number(e.target.value) })
            }
          >
            {DAYS.map((d) => (
              <option key={d.dayOfWeek} value={d.dayOfWeek}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div className="col-6 col-md-3">
          <label className="form-label small mb-1">Inizio</label>
          <input
            type="time"
            className="form-control"
            value={newBlock.open}
            onChange={(e) => setNewBlock({ ...newBlock, open: e.target.value })}
          />
        </div>
        <div className="col-6 col-md-3">
          <label className="form-label small mb-1">Fine</label>
          <input
            type="time"
            className="form-control"
            value={newBlock.close}
            onChange={(e) =>
              setNewBlock({ ...newBlock, close: e.target.value })
            }
          />
        </div>
        <div className="col-6 col-md-3">
          <label className="form-label small mb-1">Motivo (facoltativo)</label>
          <input
            type="text"
            className="form-control"
            value={newBlock.reason}
            onChange={(e) =>
              setNewBlock({ ...newBlock, reason: e.target.value })
            }
            placeholder="Es. Pausa pranzo"
          />
        </div>
      </div>

      <div className="d-flex gap-2">
        <button
          className="btn btn-outline-primary"
          onClick={addBlock}
          disabled={
            !newBlock.open || !newBlock.close || newBlock.open >= newBlock.close
          }
        >
          Aggiungi pausa
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "Salvataggio..." : "Salva pause"}
        </button>
      </div>
      <p className="form-text">
        La pausa entra in vigore solo dopo "Salva pause".
      </p>
    </div>
  );
}
