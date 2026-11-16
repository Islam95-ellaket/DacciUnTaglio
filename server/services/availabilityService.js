import mongoose from "mongoose";
import Service from "../models/Service.js";
import Shop from "../models/Shop.js";
import Appointment from "../models/Appointment.js";
import { fromZonedTime } from "date-fns-tz";
import ApiError from "../utils/ApiError.js";
import { isValidDateString, nextDate } from "../utils/dateUtils.js";

const MINUTE_MS = 60 * 1000;

// "HH:MM" → minuti dalla mezzanotte
function parseTime(time) {
  if (typeof time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

// I due intervalli [start, end) si sovrappongono?
function overlaps(startA, endA, startB, endB) {
  return startA < endB && endA > startB;
}

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
  // Passo della griglia: configurato sul negozio, fallback 10 minuti
  const slotInterval = Number(shop.slotInterval) || 10;

  if (duration <= 0 || slotInterval <= 0) {
    throw new ApiError(500, "Configurazione durata o intervallo non valida");
  }

  // 4. Confini della giornata nel fuso del negozio
  const dayStart = fromZonedTime(`${date}T00:00:00`, timeZone);
  const dayEnd = fromZonedTime(`${nextDate(date)}T00:00:00`, timeZone);

  if (!Number.isFinite(dayStart.getTime()) || !Number.isFinite(dayEnd.getTime())) {
    throw new ApiError(400, "Impossibile interpretare la data");
  }

  // 5. Giorno della settimana nel fuso del negozio
  const [y, m, d] = date.split("-").map(Number);
  const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  const workingHour = shop.workingHours?.find((item) => item.dayOfWeek === dayOfWeek);

  if (!workingHour) return [];

  const openMinutes = parseTime(workingHour.open);
  const closeMinutes = parseTime(workingHour.close);

  if (openMinutes === null || closeMinutes === null || closeMinutes <= openMinutes) {
    throw new ApiError(500, "Orari di apertura non validi");
  }

  // 6. Appuntamenti attivi della giornata
  const appointments = await Appointment.find({
    shopId: shop._id,
    status: "active",
    start: { $gte: dayStart, $lt: dayEnd },
  }).select("start end");

  // 7. Blocchi ricorrenti del giorno convertiti in intervalli da escludere
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

  // 8. Generazione degli slot consecutivi
  for (let minutes = openMinutes; minutes + duration <= closeMinutes; minutes += slotInterval) {
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
