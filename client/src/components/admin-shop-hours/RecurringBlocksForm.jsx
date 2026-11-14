import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { apiFetch } from "../../api/http.js";
import { DAYS, EMPTY_BLOCK, dayLabel } from "./constants.js";

/**
 * Sezione "Pause settimanali": blocchi ricorrenti (es. pausa pranzo) che
 * rendono non prenotabili degli orari. L'elenco si modifica in locale e si
 * salva per intero con PUT (giorno assente dall'elenco = nessuna pausa).
 */
export default function RecurringBlocksForm({ shop, token }) {
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
      <p className="form-text">La pausa entra in vigore solo dopo "Salva pause".</p>
    </div>
  );
}
