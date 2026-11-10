import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import Service from "../models/Service.js";
import Shop from "../models/Shop.js";
import { getAvailableSlots } from "../services/availabilityService.js";
import { isValidDateString, nextDate } from "../utils/dateUtils.js";
import ApiError from "../utils/ApiError.js";
import { fromZonedTime } from "date-fns-tz";

// Segna "completed" gli appuntamenti attivi il cui orario è già passato
const completePastAppointments = (filter) =>
    Appointment.updateMany(
        { ...filter, status: "active", end: { $lt: new Date() } },
        { $set: { status: "completed" } }
    );

export const createAppointment = async (req, res, next) => {
    try {
        const { serviceId, start } = req.body;

        if (!mongoose.isValidObjectId(serviceId)) {
            throw new ApiError(400, "ID del servizio non valido");
        }

        // La data deve essere UTC nel formato ISO restituito dagli slot
        if (
            typeof start !== "string" ||
            !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(start)
        ) {
            throw new ApiError(400, "Data di inizio non valida");
        }

        const startDate = new Date(start);

        if (
            !Number.isFinite(startDate.getTime()) ||
            startDate.toISOString() !== start
        ) {
            throw new ApiError(400, "Data di inizio non valida");
        }

        const service = await Service.findById(serviceId);

        if (!service) {
            throw new ApiError(404, "Servizio non trovato");
        }

        if (!service.isActive) {
            throw new ApiError(400, "Servizio non disponibile");
        }

        const duration = Number(service.durationMinutes);

        if (!Number.isFinite(duration) || duration <= 0) {
            throw new ApiError(500, "Durata del servizio non valida");
        }

        const shop = await Shop.findOne();

        if (!shop) {
            throw new ApiError(404, "Negozio non trovato");
        }

        const end = new Date(startDate.getTime() + duration * 60 * 1000);

        // Verifica che lo slot scelto sia ancora disponibile, ricalcolando
        // la disponibilità sul giorno locale del negozio
        const timeZone = shop.timezone || "Europe/Rome";

        const dateParts = new Intl.DateTimeFormat("en-CA", {
            timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).formatToParts(startDate);

        const localDate = [
            dateParts.find(p => p.type === "year").value,
            dateParts.find(p => p.type === "month").value,
            dateParts.find(p => p.type === "day").value,
        ].join("-");

        const availableSlots = await getAvailableSlots(serviceId, localDate);

        if (!availableSlots.includes(startDate.toISOString())) {
            throw new ApiError(409, "Orario non più disponibile");
        }

        // Doppio controllo anti race condition sulle sovrapposizioni
        const conflict = await Appointment.findOne({
            shopId: shop._id,
            status: "active",
            start: { $lt: end },
            end: { $gt: startDate },
        });

        if (conflict) {
            throw new ApiError(409, "Slot già prenotato");
        }

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
        // Conflitto sull'indice unico parziale: slot appena preso da qualcun altro
        if (error.code === 11000) {
            return next(new ApiError(409, "Slot già prenotato"));
        }

        next(error);
    }
};

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

        if (appointment.start.getTime() - Date.now() < 24 * 60 * 60 * 1000) {
            throw new ApiError(400, "L'appuntamento non può essere annullato a meno di 24 ore dall'orario di inizio ");
        }

        appointment.status = "cancelled";
        await appointment.save();

        res.status(200).json(appointment);
    } catch (error) {
        next(error);
    }
};

// Admin: lista appuntamenti per intervallo date
export const getAdminAppointments = async (req, res, next) => {
    try {
        const { from, to } = req.query;

        if (!isValidDateString(from) || !isValidDateString(to)) {
            throw new ApiError(400, "Date non valide (formato YYYY-MM-DD)");
        }

        if (from > to) {
            throw new ApiError(
                400,
                "La data iniziale non può essere successiva alla data finale"
            );
        }

        const shop = await Shop.findOne();

        if (!shop) {
            throw new ApiError(404, "Negozio non trovato");
        }

        await completePastAppointments({ shopId: shop._id });

        const timeZone = shop.timezone || "Europe/Rome";

        // Intervallo in UTC: dalla mezzanotte locale di "from"
        // alla mezzanotte di "to" (esclusa, quindi $lt)
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

// Admin: cambia stato appuntamento
export const updateAppointmentStatus = async (req, res, next) => {
    try {
        const { status } = req.body;

        if (!mongoose.isValidObjectId(req.params.id)) {
            throw new ApiError(400, "ID appuntamento non valido");
        }

        if (!["active", "cancelled", "completed", "no-show"].includes(status)) {
            throw new ApiError(400, "Stato non valido");
        }

        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            throw new ApiError(404, "Appuntamento non trovato");
        }

        // In ripristino, verifica che l'orario non sia nel frattempo occupato
        if (status === "active" && appointment.status !== "active") {
            const conflict = await Appointment.findOne({
                _id: { $ne: appointment._id },
                shopId: appointment.shopId,
                status: "active",
                start: { $lt: appointment.end },
                end: { $gt: appointment.start },
            });

            if (conflict) {
                throw new ApiError(
                    409,
                    "Impossibile riattivare: orario già occupato"
                );
            }
        }

        appointment.status = status;
        await appointment.save();

        res.status(200).json(appointment);
    } catch (error) {
        next(error);
    }
};
