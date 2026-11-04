import { body } from "express-validator";

export const createValidator = [
    body("name")
        .trim()
        .notEmpty()
        .withMessage("Il nome del servizio è obbligatorio"),

    body("price")
        .isFloat({ min: 0 })
        .withMessage("Inserisci un prezzo valido (minimo 0)"),

    body("durationMinutes")
        .isInt({ min: 1 })
        .withMessage("Inserisci la durata in minuti (minimo 1)"),
];

export const updateValidator = [
    body("name")
        .optional()
        .trim()
        .notEmpty()
        .withMessage("Il nome del servizio è obbligatorio"),

    body("price")
        .optional()
        .isFloat({ min: 0 })
        .withMessage("Inserisci un prezzo valido (minimo 0)"),

    body("durationMinutes")
        .optional()
        .isInt({ min: 1 })
        .withMessage("Inserisci la durata in minuti (minimo 1)"),
];
