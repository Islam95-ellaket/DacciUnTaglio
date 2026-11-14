import mongoose from "mongoose";
import Service from "../models/Service.js";
import Shop from "../models/Shop.js";
import Appointment from "../models/Appointment.js";
import { fromZonedTime } from "date-fns-tz";
import ApiError from "../utils/ApiError.js";
import { isValidDateString, nextDate } from "../utils/dateUtils.js";

const MINUTE_MS = 60 * 1000;

/**
 * Converte stringa "HH:MM" in minuti trascorsi dalla mezzanotte.
 */
function parseTime(time) {
  if (typeof time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

/**
 * Verifica se due intervalli [startA, endA) e [startB, endB) si sovrappongono.
 */
function overlaps(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

/**
 * Genera gli slot disponibili per un servizio in una data specifica.
 */
export const getAvailableSlots = async (serviceId, date) => {
  if (!isValidDateString(date)) {
    throw new ApiError(400, "Data non valida (formato YYYY-MM-DD)");
  }

  if (!mongoose.isValidObjectId(serviceId)) {
    throw new ApiError(400, "ID del servizio non valido");
  }

  const [service, shop] = await Promise.all([
    Service.findById(serviceId),
    Shop.findOne(),
  ]);

  if (!service || !service.isActive) {
    throw new ApiError(404, "Servizio non trovato o non disponibile");
  }

  if (!shop) {
    throw new ApiError(404, "Negozio non trovato");
  }

  const duration = Number(service.durationMinutes);
  const timeZone = shop.timezone || "Europe/Rome";
  const SLOT_INTERVAL = Number(shop.slotInterval) || 10;

  if (duration <= 0 || SLOT_INTERVAL <= 0) {
    throw new ApiError(500, "Configurazione durata o intervallo non valida");
  }

  // 4. Calcola i confini della giornata nel fuso del negozio
  const dayStart = fromZonedTime(`${date}T00:00:00`, timeZone);
  const dayEnd = fromZonedTime(`${nextDate(date)}T00:00:00`, timeZone);

  if (!Number.isFinite(dayStart.getTime()) || !Number.isFinite(dayEnd.getTime())) {
    throw new ApiError(400, "Impossibile interpretare la data");
  }

  // 5. Determina il giorno della settimana nel fuso del negozio
  const [y, m, d] = date.split("-").map(Number);
  const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const workingHour = shop.workingHours?.find((item) => item.dayOfWeek === dayOfWeek);

  if (!workingHour) return [];

  const openMinutes = parseTime(workingHour.open);
  const closeMinutes = parseTime(workingHour.close);

  if (openMinutes === null || closeMinutes === null || closeMinutes <= openMinutes) {
    throw new ApiError(500, "Orari di apertura non validi");
  }

  // 6. Recupera gli appuntamenti della giornata
  const appointments = await Appointment.find({
    shopId: shop._id,
    status: "active",
    start: { $gte: dayStart, $lt: dayEnd },
  }).select("start end");

  // 7. Filtra e converte i blocchi ricorrenti del giorno richiesto
  const recurringIntervals = (shop.recurringBlocks ?? [])
    .filter((rb) => rb.dayOfWeek === dayOfWeek)
    .map((rb) => {
      const rbOpen = parseTime(rb.open);
      const rbClose = parseTime(rb.close);
      if (rbOpen === null || rbClose === null || rbClose <= rbOpen) {
        throw new ApiError(500, "Orari dei recurringBlocks non validi");
      }
      const startStr = `${date}T${String(Math.floor(rbOpen / 60)).padStart(2, "0")}:${String(rbOpen % 60).padStart(2, "0")}:00`;
      const endStr = `${date}T${String(Math.floor(rbClose / 60)).padStart(2, "0")}:${String(rbClose % 60).padStart(2, "0")}:00`;
      return {
        start: fromZonedTime(startStr, timeZone).getTime(),
        end: fromZonedTime(endStr, timeZone).getTime(),
      };
    });

  const now = Date.now();
  const availableSlots = [];

  // 8. Genera gli slot consecutivi
  for (let minutes = openMinutes; minutes + duration <= closeMinutes; minutes += SLOT_INTERVAL) {
    const localStartStr = `${date}T${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}:00`;
    const start = fromZonedTime(localStartStr, timeZone);
    const end = new Date(start.getTime() + duration * MINUTE_MS);

    if (start.getTime() <= now) continue;

    const hasConflict =
      appointments.some((a) => overlaps(start.getTime(), end.getTime(), new Date(a.start).getTime(), new Date(a.end).getTime())) ||
      (shop.blockedSlots ?? []).some((b) => overlaps(start.getTime(), end.getTime(), new Date(b.start).getTime(), new Date(b.end).getTime())) ||
      recurringIntervals.some((rb) => overlaps(start.getTime(), end.getTime(), rb.start, rb.end));

    if (!hasConflict) {
      availableSlots.push(start.toISOString());
    }
  }

  return availableSlots;
};

/**
 * Ritorna i giorni di un mese (formato YYYY-MM) con almeno uno slot
 * disponibile per il servizio richiesto. Alimenta il calendario mensile
 * del cliente: i giorni chiusi, pieni o passati non compaiono.
 */
export const getAvailableDaysInMonth = async (serviceId, month) => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new ApiError(400, "Mese non valido (formato YYYY-MM richiesto)");
  }

  if (!mongoose.isValidObjectId(serviceId)) {
    throw new ApiError(400, "ID del servizio non valido");
  }

  const [year, monthNum] = month.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, monthNum, 0)).getUTCDate();

  const availableDays = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${month}-${String(day).padStart(2, "0")}`;
    const slots = await getAvailableSlots(serviceId, dateStr);
    if (slots.length > 0) {
      availableDays.push(dateStr);
    }
  }

  return availableDays;
};
