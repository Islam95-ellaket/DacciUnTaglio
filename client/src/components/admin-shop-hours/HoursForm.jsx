import { useState } from "react";
import { apiFetch } from "../../api/http.js";
import { DAYS, buildInitialHours } from "./constants.js";

// Una riga per giorno (.day-row); il salvataggio sostituisce tutto
// l'elenco workingHours (PUT).
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
    <div className="card h-100">
      <div className="card-body">
        <h2 className="h5 mb-1">Orari settimanali</h2>
        <p className="text-secondary small mb-3">
          I giorni chiusi non generano slot prenotabili.
        </p>

        {message && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}

        <form onSubmit={handleSave}>
          {DAYS.map((d) => {
            const day = hours[d.dayOfWeek];
            return (
              <div className="day-row" key={d.dayOfWeek}>
                <strong className="day-label">{d.label}</strong>
                <input
                  type="time"
                  className="form-control form-control-sm"
                  value={day.open}
                  disabled={!day.isOpen}
                  onChange={(e) =>
                    updateDay(d.dayOfWeek, { open: e.target.value })
                  }
                  required={day.isOpen}
                  aria-label={`Apertura ${d.label}`}
                />
                <input
                  type="time"
                  className="form-control form-control-sm"
                  value={day.close}
                  disabled={!day.isOpen}
                  onChange={(e) =>
                    updateDay(d.dayOfWeek, { close: e.target.value })
                  }
                  required={day.isOpen}
                  aria-label={`Chiusura ${d.label}`}
                />
                <div className="form-check form-switch m-0">
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
                    className="form-check-label small"
                    htmlFor={`open-${d.dayOfWeek}`}
                  >
                    {day.isOpen ? "Aperto" : "Chiuso"}
                  </label>
                </div>
              </div>
            );
          })}

          <button type="submit" className="btn btn-primary mt-3" disabled={saving}>
            {saving ? "Salvataggio..." : "Salva orari"}
          </button>
        </form>
      </div>
    </div>
  );
}
