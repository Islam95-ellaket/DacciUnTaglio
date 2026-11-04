import mongoose from "mongoose";
import Service from "../models/Service.js";
import Shop from "../models/Shop.js";
import Appointment from "../models/Appointment.js";
import { fromZonedTime } from "date-fns-tz";
import ApiError from "../utils/ApiError.js";
import { isValidDateString, nextDate } from "../utils/dateUtils.js";

const MINUTE_MS = 60 * 1000;

function parseTime(time) {
    if (typeof time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
        return null;
    }

    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
}

function overlaps(startA, endA, startB, endB) {
    return startA < endB && endA > startB;
}

export const getAvailableSlots = async (serviceId, date) => {
    // 1. Valida la data richiesta
    if (!isValidDateString(date)) {
        throw new ApiError(400, "Data non valida (formato YYYY-MM-DD)");
    }

    // 2. Recupera il servizio, Valida l'ID del servizio
    if (!mongoose.isValidObjectId(serviceId)) {
        throw new ApiError(400, "ID del servizio non valido");
    }

    // 3. Recupera il servizio
    const service = await Service.findById(serviceId);

    if (!service) {
        throw new ApiError(404, "Servizio non trovato");
    }

    const duration = Number(service.durationMinutes);

    if (!Number.isFinite(duration) || duration <= 0) {
        throw new ApiError(500, "Durata del servizio non valida");
    }

    // 3. Recupera il negozio
    const shop = await Shop.findOne();

    if (!shop) {
        throw new ApiError(404, "Negozio non trovato");
    }

    const timeZone = shop.timezone || "Europe/Rome";

    // Verifica che il fuso orario sia riconosciuto
    try {
        new Intl.DateTimeFormat("en-US", { timeZone });
    } catch {
        throw new ApiError(500, "Fuso orario del negozio non valido");
    }

    // 4. Calcola i confini della giornata nel fuso del negozio
    const dayStart = fromZonedTime(`${date}T00:00:00`, timeZone);
    const dayEnd = fromZonedTime(`${nextDate(date)}T00:00:00`, timeZone);

    if (
        !Number.isFinite(dayStart.getTime()) ||
        !Number.isFinite(dayEnd.getTime())
    ) {
        throw new ApiError(400, "Impossibile interpretare la data");
    }

    // 5. Determina il giorno della settimana nel fuso del negozio
    const [y, m, d] = date.split("-").map(Number);
    const dayOfWeek = new Date(Date.UTC(y, m - 1, d)).getUTCDay();

    const workingHours = shop.workingHours ?? [];
    const blockedSlots = shop.blockedSlots ?? [];
    const recurringBlocks = shop.recurringBlocks ?? [];

    if (
        !Array.isArray(workingHours) ||
        !Array.isArray(blockedSlots) ||
        !Array.isArray(recurringBlocks)
    ) {
        throw new ApiError(500, "Configurazione degli orari non valida");
    }

    const workingHour = workingHours.find(
        item => item.dayOfWeek === dayOfWeek
    );

    if (!workingHour) {
        return [];
    }

    // 6. Valida gli orari di apertura
    const openMinutes = parseTime(workingHour.open);
    const closeMinutes = parseTime(workingHour.close);

    if (
        openMinutes === null ||
        closeMinutes === null ||
        closeMinutes <= openMinutes
    ) {
        throw new ApiError(500, "Orari di apertura non validi");
    }

    // 7. Recupera gli appuntamenti della giornata
    const appointments = await Appointment.find({
        shopId: shop._id,
        status: "active",
        start: { $lt: dayEnd },
        end: { $gt: dayStart },
    }).select("start end");

    // 8. Filtra i recurringBlocks del giorno richiesto
    const recurringForDay = recurringBlocks.filter(
        rb => rb.dayOfWeek === dayOfWeek
    );

    // Converte gli orari ricorrenti in timestamp UTC
    const recurringIntervals = recurringForDay.map(rb => {
        const rbOpenMinutes = parseTime(rb.open);
        const rbCloseMinutes = parseTime(rb.close);

        if (
            rbOpenMinutes === null ||
            rbCloseMinutes === null ||
            rbCloseMinutes <= rbOpenMinutes
        ) {
            throw new ApiError(500, "Orari dei recurringBlocks non validi");
        }

        const rbStartLocal =
            `${date}T${String(Math.floor(rbOpenMinutes / 60)).padStart(2, "0")}:${String(rbOpenMinutes % 60).padStart(2, "0")}:00`;

        const rbEndLocal =
            `${date}T${String(Math.floor(rbCloseMinutes / 60)).padStart(2, "0")}:${String(rbCloseMinutes % 60).padStart(2, "0")}:00`;

        return {
            start: fromZonedTime(rbStartLocal, timeZone).getTime(),
            end: fromZonedTime(rbEndLocal, timeZone).getTime(),
        };
    });

    const now = Date.now();
    const availableSlots = [];

    // 9. Genera gli slot consecutivi della durata del servizio

    // Passo della griglia: configurabile sullo shop, default 10 minuti
    const SLOT_INTERVAL = Number(shop.slotInterval) || 10;

    if (SLOT_INTERVAL <= 0) {
        throw new ApiError(500, "Intervallo degli slot del negozio non valido");
    }

    for (
        let minutes = openMinutes;
        minutes + duration <= closeMinutes;
        minutes += SLOT_INTERVAL
    ) {
        const localStart =
            `${date}T${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}:00`;

        const start = fromZonedTime(localStart, timeZone);
        const end = new Date(start.getTime() + duration * MINUTE_MS);

        if (
            !Number.isFinite(start.getTime()) ||
            !Number.isFinite(end.getTime())
        ) {
            continue;
        }

        // Non proporre appuntamenti già iniziati
        if (start.getTime() <= now) {
            continue;
        }

        // Verifica le prenotazioni esistenti
        const appointmentConflict = appointments.some(appointment => {
            const appStart = new Date(appointment.start).getTime();
            const appEnd = new Date(appointment.end).getTime();

            return overlaps(
                start.getTime(),
                end.getTime(),
                appStart,
                appEnd
            );
        });

        if (appointmentConflict) {
            continue;
        }

        // Verifica le chiusure temporanee
        const blockConflict = blockedSlots.some(block => {
            const blockStart = new Date(block.start).getTime();
            const blockEnd = new Date(block.end).getTime();

            if (
                !Number.isFinite(blockStart) ||
                !Number.isFinite(blockEnd) ||
                blockEnd <= blockStart
            ) {
                return false;
            }

            return overlaps(
                start.getTime(),
                end.getTime(),
                blockStart,
                blockEnd
            );
        });

        // Verifica i recurringBlocks
        const recurringConflict = recurringIntervals.some(rb => {
            return overlaps(
                start.getTime(),
                end.getTime(),
                rb.start,
                rb.end
            );
        });

        // Inserisce solo gli slot senza conflitti
        if (!blockConflict && !recurringConflict) {
            availableSlots.push(start.toISOString());
        }
    }

    // 10. Restituisce gli inizi degli slot in UTC
    return availableSlots;
};
