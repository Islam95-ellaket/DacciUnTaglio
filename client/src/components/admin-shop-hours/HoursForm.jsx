import { useState } from "react";
import { apiFetch } from "../../api/http.js";
import { DAYS, buildInitialHours } from "./constants.js";

/**
 * Form degli orari di apertura settimanali.
 * Un toggle "Aperto/Chiuso" e due campi ora per ogni giorno;
 * il salvataggio sostituisce l'intero elenco workingHours (PUT).
 */
export default function HoursForm({ shop, token }) {
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

    const workingHours = DAYS.filter((d) => hours[d.dayOfWeek]?.isOpen).map(
      (d) => ({
        dayOfWeek: d.dayOfWeek,
        open: hours[d.dayOfWeek]?.open,
        close: hours[d.dayOfWeek]?.close,
      })
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
