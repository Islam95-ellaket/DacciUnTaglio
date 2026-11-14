import { useState, useEffect, useCallback, useRef } from "react";
import { apiFetch } from "../api/http.js";
import ErrorAlert from "./ErrorAlert.jsx";
import { getRomeDate } from "../utils/format.js";

const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];
const MONTH_NAMES = [
  "Gennaio", "Febbraio", "Marzo", "Aprile", "Maggio", "Giugno",
  "Luglio", "Agosto", "Settembre", "Ottobre", "Novembre", "Dicembre",
];

// Griglia fissa di 42 celle (6 settimane): le prime possono appartenere
// al mese precedente. Le date sono trattate come "YYYY-MM-DD nel fuso del
// negozio", con lo stesso trucco UTC usato anche dal backend (coerenza).
const buildGrid = (year, monthIndex) => {
  const firstWeekday = (new Date(Date.UTC(year, monthIndex, 1)).getUTCDay() + 6) % 7; // 0 = lunedì
  const start = new Date(Date.UTC(year, monthIndex, 1 - firstWeekday));

  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate() + i));
    return {
      dateStr: d.toISOString().slice(0, 10),
      inMonth: d.getUTCMonth() === monthIndex,
    };
  });
};

export default function MonthCalendar({ serviceId, selectedDate, onSelectDate }) {
  const today = getRomeDate(); // YYYY-MM-DD nel fuso del negozio
  const [viewYear, setViewYear] = useState(() => Number(today.slice(0, 4)));
  const [viewMonth, setViewMonth] = useState(() => Number(today.slice(5, 7)) - 1); // 0-based

  // Lo stato "caricamento" è DERIVATO, non tracciato: il mese attuale è
  // "in caricamento" finché loadedMonth non lo raggiunge.
  const monthKey = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
  const [loadedMonth, setLoadedMonth] = useState(null);
  const [availableDays, setAvailableDays] = useState([]);
  const [loadError, setLoadError] = useState(null); // { key, message } del mese fallito
  const loading = loadedMonth !== monthKey;
  const error = loadError?.key === monthKey ? loadError.message : null;

  // Token anti-race: se si cambia mese mentre la risposta viaggia,
  // quella vecchia viene ignorata (id non più corrente).
  const requestId = useRef(0);

  const loadMonth = useCallback(() => {
    const id = ++requestId.current;

    return apiFetch(`/availability/month?serviceId=${serviceId}&month=${monthKey}`)
      .then((data) => {
        if (id !== requestId.current) return;
        setAvailableDays(data);
        setLoadError(null);
        setLoadedMonth(monthKey);
      })
      .catch((err) => {
        if (id !== requestId.current) return;
        setLoadError({ key: monthKey, message: err.message });
      });
  }, [serviceId, monthKey]);

  useEffect(() => {
    if (serviceId) {
      loadMonth();
    }
  }, [serviceId, loadMonth]);

  const shiftMonth = (delta) => {
    const d = new Date(Date.UTC(viewYear, viewMonth + delta, 1));
    setViewYear(d.getUTCFullYear());
    setViewMonth(d.getUTCMonth());
  };

  const grid = buildGrid(viewYear, viewMonth);

  return (
    <div className="month-calendar">
      <div className="d-flex justify-content-between align-items-center mb-2">
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => shiftMonth(-1)}
          aria-label="Mese precedente"
        >
          ‹
        </button>
        <strong>
          {MONTH_NAMES[viewMonth]} {viewYear}
        </strong>
        <button
          type="button"
          className="btn btn-outline-secondary btn-sm"
          onClick={() => shiftMonth(1)}
          aria-label="Mese successivo"
        >
          ›
        </button>
      </div>

      {loading && !error && (
        <div className="text-center text-muted small py-2">Caricamento giorni...</div>
      )}
      <ErrorAlert message={error} onRetry={loadMonth} />

      {!loading && !error && (
        <div className="calendar-grid">
          {WEEKDAYS.map((w) => (
            <div key={w} className="cal-weekday">
              {w}
            </div>
          ))}

          {grid.map(({ dateStr, inMonth }) => {
            const isPast = dateStr < today;
            const isAvailable = inMonth && !isPast && availableDays.includes(dateStr);

            let className = "cal-day";
            if (!inMonth) className += " cal-day-other";
            else if (isPast) className += " cal-day-past";
            else if (dateStr === selectedDate) className += " cal-day-selected";
            else if (isAvailable) className += " cal-day-available";
            else className += " cal-day-closed";

            return (
              <button
                key={dateStr}
                type="button"
                className={className}
                disabled={!isAvailable}
                onClick={() => onSelectDate(dateStr)}
              >
                {Number(dateStr.slice(8, 10))}
              </button>
            );
          })}
        </div>
      )}

      <div className="calendar-legend small text-muted mt-2">
        <span className="legend-dot legend-available" aria-hidden="true"></span>
        Disponibile
        <span className="legend-dot legend-closed" aria-hidden="true"></span>
        Chiuso o completo
      </div>
    </div>
  );
}
