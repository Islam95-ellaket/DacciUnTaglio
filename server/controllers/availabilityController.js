import { getAvailableSlots } from "../services/availabilityService.js";
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