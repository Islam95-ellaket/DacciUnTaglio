import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import Service from "../models/Service.js";
import Shop from "../models/Shop.js";
import { getAvailableSlots } from "../services/availabilityService.js";
import { isValidDateString, nextDate, getLocalDateString } from "../utils/dateUtils.js";
import ApiError from "../utils/ApiError.js";
import { fromZonedTime } from "date-fns-tz";

/**
 * Helper per aggiornare automaticamente gli appuntamenti passati allo stato "completed".
 */
const completePastAppointments = (filter) =>
  Appointment.updateMany(
    { ...filter, status: "active", end: { $lt: new Date() } },
    { $set: { status: "completed" } }
  );

/**
 * Crea un nuovo appuntamento.
 * Include controlli rigorosi su disponibilità e race condition.
 */
export const createAppointment = async (req, res, next) => {
  try {
    const { serviceId, start } = req.body;

    // 1. Validazione input base
    if (!mongoose.isValidObjectId(serviceId)) {
      throw new ApiError(400, "ID del servizio non valido");
    }

    if (typeof start !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(start)) {
      throw new ApiError(400, "Data di inizio non valida (formato ISO richiesto)");
    }

    const startDate = new Date(start);
    if (!Number.isFinite(startDate.getTime()) || startDate.toISOString() !== start) {
      throw new ApiError(400, "Data di inizio non valida");
    }

    // 2. Recupero dati necessari (Servizio e Negozio)
    const [service, shop] = await Promise.all([
      Service.findById(serviceId),
      Shop.findOne(),
    ]);

    if (!service || !service.isActive) {
      throw new ApiError(400, "Servizio non trovato o non disponibile");
    }

    if (!shop) {
      throw new ApiError(404, "Configurazione negozio non trovata");
    }

    const duration = Number(service.durationMinutes);
    const end = new Date(startDate.getTime() + duration * 60 * 1000);
    const timeZone = shop.timezone || "Europe/Rome";
    const localDate = getLocalDateString(startDate, timeZone);

    // 3. Limite prenotazioni: max N appuntamenti "active" per cliente nello stesso giorno (fuso negozio)
    const maxBookingsPerDay = Number(shop.maxBookingsPerDay) || 1;
    const dayStart = fromZonedTime(`${localDate}T00:00:00`, timeZone);
    const dayEnd = fromZonedTime(`${nextDate(localDate)}T00:00:00`, timeZone);

    const activeBookings = await Appointment.countDocuments({
      userId: req.user.id,
      status: "active",
      start: { $gte: dayStart, $lt: dayEnd },
    });

    if (activeBookings >= maxBookingsPerDay) {
      throw new ApiError(403, `hai già un'appuntamento in questa data`);
    }

    // 4. Verifica disponibilità reale
    const availableSlots = await getAvailableSlots(serviceId, localDate);

    if (!availableSlots.includes(startDate.toISOString())) {
      throw new ApiError(409, "Orario non più disponibile");
    }

    // 5. Protezione finale dalle Race Condition (sovrapposizione temporale)
    const conflict = await Appointment.findOne({
      shopId: shop._id,
      status: "active",
      start: { $lt: end },
      end: { $gt: startDate },
    });

    if (conflict) {
      throw new ApiError(409, "Slot già prenotato");
    }

    // 6. Creazione
    const appointment = await Appointment.create({
      shopId: shop._id,
      serviceId: service._id,
      userId: req.user.id,
      start: startDate,
      end,
      status: "active",
    });

    res.status(201).json(appointment);
  } catch (error) {
    if (error.code === 11000) {
      return next(new ApiError(409, "Slot già prenotato"));
    }
    next(error);
  }
};

/**
 * Restituisce gli appuntamenti dell'utente loggato.
 */
export const getMyAppointments = async (req, res, next) => {
  try {
    await completePastAppointments({ userId: req.user.id });

    const appointments = await Appointment.find({ userId: req.user.id })
      .populate("serviceId", "name price durationMinutes")
      .sort({ start: 1 });

    res.status(200).json(appointments);
  } catch (error) {
    next(error);
  }
};

/**
 * Annulla un appuntamento (Cliente).
 * Verifica la regola delle 24 ore.
 */
export const cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      throw new ApiError(404, "Appuntamento non trovato");
    }

    if (appointment.userId.toString() !== req.user.id.toString()) {
      throw new ApiError(403, "Non puoi annullare questo appuntamento");
    }

    if (appointment.status !== "active") {
      throw new ApiError(400, "Appuntamento già annullato o completato");
    }

    // Regola 24h: calcolo in millisecondi
    if (appointment.start.getTime() - Date.now() < 24 * 60 * 60 * 1000) {
      throw new ApiError(400, "L'appuntamento non può essere annullato a meno di 24 ore dall'inizio");
    }

    appointment.status = "cancelled";
    await appointment.save();

    res.status(200).json(appointment);
  } catch (error) {
    next(error);
  }
};

/**
 * Restituisce tutti gli appuntamenti in un intervallo di date (Admin).
 */
export const getAdminAppointments = async (req, res, next) => {
  try {
    const { from, to } = req.query;

    if (!isValidDateString(from) || !isValidDateString(to)) {
      throw new ApiError(400, "Date non valide (richiesto YYYY-MM-DD)");
    }

    if (from > to) {
      throw new ApiError(400, "La data iniziale non può superare la finale");
    }

    const shop = await Shop.findOne();
    if (!shop) throw new ApiError(404, "Negozio non trovato");

    await completePastAppointments({ shopId: shop._id });

    const timeZone = shop.timezone || "Europe/Rome";
    const startDate = fromZonedTime(`${from}T00:00:00`, timeZone);
    const endDate = fromZonedTime(`${nextDate(to)}T00:00:00`, timeZone);

    const appointments = await Appointment.find({
      shopId: shop._id,
      start: { $gte: startDate, $lt: endDate },
    })
      .populate("userId", "name email phone")
      .populate("serviceId", "name price durationMinutes")
      .sort({ start: 1 });

    res.status(200).json(appointments);
  } catch (error) {
    next(error);
  }
};

/**
 * Aggiorna lo stato di un appuntamento (Admin).
 */
export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      throw new ApiError(400, "ID appuntamento non valido");
    }

    const validStatuses = ["active", "cancelled", "completed", "no-show"];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, "Stato richiesto non valido");
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) throw new ApiError(404, "Appuntamento non trovato");

    // Se si tenta di riattivare un appuntamento, controlla conflitti
    if (status === "active" && appointment.status !== "active") {
      const conflict = await Appointment.findOne({
        _id: { $ne: appointment._id },
        shopId: appointment.shopId,
        status: "active",
        start: { $lt: appointment.end },
        end: { $gt: appointment.start },
      });

      if (conflict) {
        throw new ApiError(409, "Impossibile riattivare: slot già occupato");
      }
    }

    appointment.status = status;
    await appointment.save();

    res.status(200).json(appointment);
  } catch (error) {
    next(error);
  }
};
