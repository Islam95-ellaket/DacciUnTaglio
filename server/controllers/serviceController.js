import Service from "../models/Service.js"
import Shop from "../models/Shop.js"
import ApiError from "../utils/ApiError.js";
import { validationResult } from "express-validator";


export const getServices = async (req, res, next) => {
    try {
        const services = await Service.find({ isActive: true });
        res.status(200).json(services);

    } catch (error) {
        next(error);
    }

}

export const createService = async (req, res, next) => {
    try {
        const { name, price, durationMinutes } = req.body

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ApiError(400, errors.array()[0].msg);
        }

        const shop = await Shop.findOne()
        if (!shop) {
            throw new ApiError(404, "Configurazione del negozio non trovata nel database")
        }
        const service = await Service.create({
            name,
            price,
            durationMinutes,
            shopId: shop._id
        })

        res.status(201).json(service)

    } catch (error) {
        next(error)
    }

}

export const updateService = async (req, res, next) => {

    try {
        const { id } = req.params
        const { name, price, durationMinutes } = req.body

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new ApiError(400, errors.array()[0].msg);
        }

        // Aggiornamento parziale: solo i campi presenti nel body
        const updates = {};
        if (name !== undefined) updates.name = name;
        if (price !== undefined) updates.price = price;
        if (durationMinutes !== undefined) updates.durationMinutes = durationMinutes;

        const service = await Service.findByIdAndUpdate(id, updates, { new: true })

        if (!service) {
            throw new ApiError(404, "Servizio non trovato");
        }

        res.status(200).json(service)
    } catch (error) {
        next(error)
    }

}

export const deleteService = async (req, res, next) => {
    const { id } = req.params

    try {
        const service = await Service.findByIdAndUpdate(id,
            { isActive: false },
            { new: true }
        )

        if (!service) {
            throw new ApiError(404, "Servizio non trovato");
        }

        res.status(200).json({
            message: "servizio eliminato",
            service,
        })

    } catch (error) {
        next(error)
    }

}
