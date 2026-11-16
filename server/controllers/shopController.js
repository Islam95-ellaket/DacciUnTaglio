import { checkValidation } from "../utils/validate.js";
import Shop from "../models/Shop.js";
import ApiError from "../utils/ApiError.js";

export const getShop = async (req, res, next) => {
    try {
        const shop = await Shop.findOne();

        if (!shop) {
            throw new ApiError(404, "Configurazione del negozio non trovata nel database");
        }

        res.status(200).json(shop);
    } catch (error) {
        next(error);
    }
};

// Sostituisce tutto l'elenco degli orari: un giorno assente = chiuso.
export const updateWorkingHours = async (req, res, next) => {
    try {
        checkValidation(req);

        const shop = await Shop.findOne();

        if (!shop) {
            throw new ApiError(404, "Configurazione del negozio non trovata nel database");
        }

        shop.workingHours = req.body.workingHours;
        await shop.save();

        res.status(200).json(shop.workingHours);
    } catch (error) {
        next(error);
    }
};

// Sostituisce tutto l'elenco dei blocchi ricorrenti (es. pausa pranzo);
// availabilityService li esclude già dagli slot generati.
export const updateRecurringBlocks = async (req, res, next) => {
    try {
        checkValidation(req);

        const shop = await Shop.findOne();

        if (!shop) {
            throw new ApiError(404, "Configurazione del negozio non trovata nel database");
        }

        shop.recurringBlocks = req.body.recurringBlocks;
        await shop.save();

        res.status(200).json(shop.recurringBlocks);
    } catch (error) {
        next(error);
    }
};
