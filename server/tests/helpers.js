import { vi } from "vitest";
import { fromZonedTime } from "date-fns-tz";
import { getLocalDateString } from "../utils/dateUtils.js";

export const TIMEZONE = "Europe/Rome";

// ─── Helper: date future e conversioni nel fuso del negozio ──────────────────
// I servizi escludono gli slot nel passato (start <= now), quindi i test
// usano date calcolate dinamicamente: restano validi qualunque giorno li lanci.

// Giorno della settimana (0 = domenica) di una data YYYY-MM-DD "locale"
export const weekdayOf = (dateStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
};

// Prima data futura (minimo minDaysAhead da oggi) che cade nel weekday richiesto,
// restituita come stringa YYYY-MM-DD nel fuso del negozio
export const futureLocalDate = (weekday, minDaysAhead = 3) => {
  let date = new Date(Date.now() + minDaysAhead * 24 * 60 * 60 * 1000);
  let dateStr = getLocalDateString(date, TIMEZONE);

  while (weekdayOf(dateStr) !== weekday) {
    date = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    dateStr = getLocalDateString(date, TIMEZONE);
  }

  return dateStr;
};

// Orario locale "HH:MM" di un giorno → ISO string UTC (stessa conversione dei servizi)
export const slotISO = (dateStr, hhmm) =>
  fromZonedTime(`${dateStr}T${hhmm}:00`, TIMEZONE).toISOString();

// ─── Helper: chiamare i controller Express direttamente nei test ─────────────
// Senza supertest: i controller sono funzioni (req, res, next), quindi passiamo
// oggetti "finti". Gli errori finiscono in next(ApiError), non in risposte HTTP.

export const mockRes = () => {
  const res = {};
  res.status = vi.fn(() => res); // res.status(201) deve restituire res per concatenare .json()
  res.json = vi.fn(() => res);
  return res;
};

// Esegue un controller e restituisce { res, next } per le asserzioni
export const callController = async (handler, req) => {
  const res = mockRes();
  const next = vi.fn();
  await handler(req, res, next);
  return { res, next };
};

// Primo errore passato a next (un ApiError con statusCode)
export const nextError = (next) => next.mock.calls[0][0];
