import { validationResult } from "express-validator";
import ApiError from "./ApiError.js";

// Helper condiviso: lancia ApiError(400) se la validazione fallisce.
// Usato da tutti i controller per mantenere lo stesso comportamento.
export const checkValidation = (req) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ApiError(400, errors.array()[0].msg);
    }
};