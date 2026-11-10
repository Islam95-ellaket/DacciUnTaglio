import { checkValidation } from "../utils/validate.js";
import Service from "../models/Service.js";
import Shop from "../models/Shop.js";
import ApiError from "../utils/ApiError.js";

export const getServices = async (req, res, next) => {
    try {
        const services = await Service.find({ isActive: true });
        res.status(200).json(services);
    } catch (error) {
        next(error);
    }
};

export const createService = async (req, res, next) => {
    try {
        checkValidation(req);

        const shop = await Shop.findOne();
        if (!shop) {
            throw new ApiError(404, "Configurazione del negozio non trovata nel database");
        }

        const { name, price, durationMinutes } = req.body;
        const service = await Service.create({
            name,
            price,
            durationMinutes,
            shopId: shop._id,
        });

        res.status(201).json(service);
    } catch (error) {
        next(error);
    }
};

export const updateService = async (req, res, next) => {
    try {
        checkValidation(req);

        // Aggiornamento parziale: solo i campi presenti nel body
        const updates = {};
        const { name, price, durationMinutes } = req.body;
        if (name !== undefined) updates.name = name;
        if (price !== undefined) updates.price = price;
        if (durationMinutes !== undefined) updates.durationMinutes = durationMinutes;

        const service = await Service.findByIdAndUpdate(req.params.id, updates, {
            new: true,
        });

        if (!service) {
            throw new ApiError(404, "Servizio non trovato");
        }

        res.status(200).json(service);
    } catch (error) {
        next(error);
    }
};

export const deleteService = async (req, res, next) => {
    try {
        // Soft delete: il servizio resta nel DB con isActive: false
        const service = await Service.findByIdAndUpdate(
            req.params.id,
            { isActive: false },
            { new: true }
        );

        if (!service) {
            throw new ApiError(404, "Servizio non trovato");
        }

        res.status(200).json({ message: "servizio eliminato", service });
    } catch (error) {
        next(error);
    }
};
