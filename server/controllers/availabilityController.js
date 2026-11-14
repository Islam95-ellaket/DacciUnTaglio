import { getAvailableSlots, getAvailableDaysInMonth } from "../services/availabilityService.js";
import ApiError from "../utils/ApiError.js";
import mongoose from "mongoose";

export const getAvailability = async (req, res, next) => {
    try {
        const { serviceId, date } = req.query;

        if (!serviceId || !date) {
            throw new ApiError(
                400,
                "Parametri serviceId e date obbligatori"
            );
        }

        if (!mongoose.isValidObjectId(serviceId)) {
            throw new ApiError(400, "ID del servizio non valido");
        }

        const slots = await getAvailableSlots(serviceId, date);

        res.status(200).json(slots);
    } catch (error) {
        next(error);
    }
};

// GET /api/availability/month?serviceId=...&month=YYYY-MM (pubblico)
// Giorni del mese con almeno uno slot libero: alimenta il calendario mensile del cliente.
export const getAvailabilityMonth = async (req, res, next) => {
    try {
        const { serviceId, month } = req.query;

        if (!serviceId || !month) {
            throw new ApiError(400, "Parametri serviceId e month obbligatori");
        }

        const days = await getAvailableDaysInMonth(serviceId, month);

        res.status(200).json(days);
    } catch (error) {
        next(error);
    }
};
