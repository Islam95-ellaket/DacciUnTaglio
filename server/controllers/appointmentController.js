import mongoose from "mongoose";
import Appointment from "../models/Appointment.js";
import Service from "../models/Service.js";
import Shop from "../models/Shop.js";
import { getAvailableSlots } from "../services/availabilityService.js";
import ApiError from "../utils/ApiError.js";
import { fromZonedTime } from "date-fns-tz";


export const createAppointment = async (req, res, next) => {
    try {
        const { serviceId, start } = req.body;

        // MODIFICA 1: valida l'ID del servizio
        if (!mongoose.isValidObjectId(serviceId)) {
            throw new ApiError(400, "ID del servizio non valido");
        }

        // MODIFICA 2: valida il formato della data UTC
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

        // 1. Recupera il servizio
        const service = await Service.findById(serviceId);

        if (!service) {
            throw new ApiError(404, "Servizio non trovato");
        }

        // MODIFICA 3: verifica che il servizio sia attivo
        if (!service.isActive) {
            throw new ApiError(400, "Servizio non disponibile");
        }

        // MODIFICA 4: valida la durata
        const duration = Number(service.durationMinutes);

        if (!Number.isFinite(duration) || duration <= 0) {
            throw new ApiError(500, "Durata del servizio non valida");
        }

        // 2. Recupera il negozio
        const shop = await Shop.findOne();

        if (!shop) {
            throw new ApiError(404, "Negozio non trovato");
        }

        // 3. Calcola la fine dell'appuntamento
        const end = new Date(
            startDate.getTime() + duration * 60 * 1000
        );

        // MODIFICA 5: verifica la disponibilità effettiva
        // Riutilizza la logica del servizio disponibilità
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

        const availableSlots = await getAvailableSlots(
            serviceId,
            localDate
        );

        if (!availableSlots.includes(startDate.toISOString())) {
            throw new ApiError(
                409,
                "Orario non più disponibile"
            );
        }

        // 4. Controllo aggiuntivo delle sovrapposizioni
        const conflict = await Appointment.findOne({
            shopId: shop._id,
            status: "active",
            start: { $lt: end },
            end: { $gt: startDate },
        });

        if (conflict) {
            throw new ApiError(409, "Slot già prenotato");
        }

        // 5. Crea l'appuntamento
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

        // 6. Gestione conflitto indice unico
        if (error.code === 11000) {
            return next(
                new ApiError(409, "Slot già prenotato")
            );
        }

        next(error);
    }
};



export const getMyAppointments = async (req, res, next) => {
    try {
        // Auto-completa gli appuntamenti attivi il cui orario è passato
        await Appointment.updateMany(
            {
                userId: req.user.id,
                status: "active",
                end: { $lt: new Date() },
            },
            { $set: { status: "completed" } }
        );
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

        // MODIFICA 1: verifica il formato e la validità delle date
        const isValidDate = (value) => {
            if (
                typeof value !== "string" ||
                !/^\d{4}-\d{2}-\d{2}$/.test(value)
            ) {
                return false;
            }

            const [year, month, day] = value.split("-").map(Number);
            const parsed = new Date(Date.UTC(year, month - 1, day));

            return (
                parsed.getUTCFullYear() === year &&
                parsed.getUTCMonth() === month - 1 &&
                parsed.getUTCDate() === day
            );
        };

        if (!isValidDate(from) || !isValidDate(to)) {
            throw new ApiError(
                400,
                "Date non valide (formato YYYY-MM-DD)"
            );
        }

        // AGGIUNTA 2: verifica che from non sia successiva a to
        if (from > to) {
            throw new ApiError(
                400,
                "La data iniziale non può essere successiva alla data finale"
            );
        }

        // AGGIUNTA 3: recupera il fuso orario del negozio
        const shop = await Shop.findOne();

        if (!shop) {
            throw new ApiError(404, "Negozio non trovato");
        }

        // Auto-completa gli appuntamenti attivi il cui orario è passato
        await Appointment.updateMany(
            {
                shopId: shop._id,
                status: "active",
                end: { $lt: new Date() },
            },
            { $set: { status: "completed" } }
        );

        const timeZone = shop.timezone || "Europe/Rome";

        // AGGIUNTA 4: converte la mezzanotte locale in UTC
        const [year, month, day] = to.split("-").map(Number);
        const nextDay = new Date(
            Date.UTC(year, month - 1, day + 1)
        );

        const nextDate = [
            nextDay.getUTCFullYear(),
            String(nextDay.getUTCMonth() + 1).padStart(2, "0"),
            String(nextDay.getUTCDate()).padStart(2, "0"),
        ].join("-");

        const startDate = fromZonedTime(
            `${from}T00:00:00`,
            timeZone
        );

        const endDate = fromZonedTime(
            `${nextDate}T00:00:00`,
            timeZone
        );

        // MODIFICA 5: usa $lt invece di $lte
        const appointments = await Appointment.find({
            shopId: shop._id,
            start: {
                $gte: startDate,
                $lt: endDate,
            },
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

        // AGGIUNTA 1: valida l'ID MongoDB
        if (!mongoose.isValidObjectId(req.params.id)) {
            throw new ApiError(400, "ID appuntamento non valido");
        }

        // Validazione dello stato
        if (
            !["active", "cancelled", "completed", "no-show"].includes(status)
        ) {
            throw new ApiError(400, "Stato non valido");
        }

        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            throw new ApiError(404, "Appuntamento non trovato");
        }

        // AGGIUNTA 2: controlla eventuali sovrapposizioni
        // quando si riattiva un appuntamento
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

        // Aggiorna lo stato
        appointment.status = status;
        await appointment.save();

        res.status(200).json(appointment);
    } catch (error) {
        next(error);
    }
};

