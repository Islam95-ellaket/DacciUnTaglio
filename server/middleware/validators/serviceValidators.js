import { body } from "express-validator";

export const createValidator = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("il nome del servizio è obbligatorio"),

    body("price")
        .isFloat({ min: 0 })
        .withMessage("inserire il prezzo del servizio"),

    body("durationMinutes")
        .isInt({ min: 1 })
        .withMessage("inserisci la durata del servizio/ trattamento ")
];


export const updateValidator = [
    body("name")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("il nome del servizio è obbligatorio"),

    body("price")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("inserire il prezzo del servizio"),

    body("durationMinutes")
        .optional()
        .isInt({ min: 1 })
        .withMessage("inserisci la durata del servizio/ trattamento ")
];
