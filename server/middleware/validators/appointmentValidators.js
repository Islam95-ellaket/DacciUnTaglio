import { body } from "express-validator"

export const createValidator = [
    body("serviceId")
        .isMongoId()
        .withMessage("L'ID del servizio non è valido"),

    body("start")
        .isISO8601()
        .withMessage("La data di inizio non è valida"),
];
