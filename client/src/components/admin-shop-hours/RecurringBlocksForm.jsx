import { useState } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { apiFetch } from "../../api/http.js";
import { DAYS, EMPTY_BLOCK, dayLabel } from "./constants.js";

// L'elenco delle pause vive in una bozza locale: "Salva pause" manda tutto
// al backend con PUT. Eliminazioni e modifiche valgono solo dopo il salvataggio.
export default function RecurringBlocksForm({ shop, token }) {
  const [blocks, setBlocks] = useState(() => shop.recurringBlocks ?? []);
  const [newBlock, setNewBlock] = useState(EMPTY_BLOCK);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Form compilato e valido (serve inizio < fine).
  const formBlockIsValid =
    Boolean(newBlock.open) &&
    Boolean(newBlock.close) &&
    newBlock.open < newBlock.close;

  // Form a metà compilato (o invalido): blocchiamo il salvataggio invece di
  // ignorare la mezza pausa senza spiegazioni.
  const formIsIncomplete =
    Boolean(newBlock.open || newBlock.close || newBlock.reason) && !formBlockIsValid;

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
    // Toglie il blocco dalla lista: "Salva pause" risalva con quello modificato.
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    // Elenco attuale + eventuale pausa nuova del form.
    const finalBlocks = formBlockIsValid
      ? [...blocks, { ...newBlock }]
      : [...blocks];

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
    <div className="card h-100">
      <div className="card-body">
        <h2 className="h5 mb-1">Pause ricorrenti</h2>
        <p className="text-secondary small mb-3">
          Blocchi settimanali che rendono non prenotabili degli orari
          (es. pausa pranzo).
        </p>

        {message && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        {blocks.length === 0 ? (
          <p className="text-secondary small">Nessuna pausa configurata.</p>
        ) : (
          <ul className="list-group mb-3">
            {blocks.map((b, i) => (
              <li
                key={i}
                className="list-group-item d-flex justify-content-between align-items-center gap-2"
              >
                <span className="flex-grow-1">
                  <strong>{dayLabel(b.dayOfWeek)}</strong> · {b.open} – {b.close}
                  {b.reason ? ` · ${b.reason}` : ""}
                </span>
                <div className="d-flex gap-1 flex-shrink-0">
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

        <div className="row g-2 mb-3">
          <div className="col-4">
            <label className="form-label small mb-1">Giorno</label>
            <select
              className="form-select form-select-sm"
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
          <div className="col-4">
            <label className="form-label small mb-1">Inizio</label>
            <input
              type="time"
              className="form-control form-control-sm"
              value={newBlock.open}
              onChange={(e) => setNewBlock({ ...newBlock, open: e.target.value })}
            />
          </div>
          <div className="col-4">
            <label className="form-label small mb-1">Fine</label>
            <input
              type="time"
              className="form-control form-control-sm"
              value={newBlock.close}
              onChange={(e) =>
                setNewBlock({ ...newBlock, close: e.target.value })
              }
            />
          </div>
          <div className="col-12">
            <label className="form-label small mb-1">Motivo (facoltativo)</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={newBlock.reason}
              onChange={(e) =>
                setNewBlock({ ...newBlock, reason: e.target.value })
              }
              placeholder="Es. Pausa pranzo"
            />
          </div>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving || formIsIncomplete}
          title={
            formIsIncomplete
              ? "Completa o svuota il form della nuova pausa"
              : undefined
          }
        >
          {saving ? "Salvataggio..." : "Salva pause"}
        </button>
        <p className="form-text">
          Per aggiungere una pausa compila il form e premi "Salva pause".
          Eliminazioni e modifiche hanno effetto solo dopo il salvataggio.
        </p>
      </div>
    </div>
  );
}
