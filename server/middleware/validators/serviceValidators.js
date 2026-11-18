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

    // Immagine opzionale: URL dell'immagine caricata su Cloudinary
    body("imageUrl")
        .optional({ checkFalsy: true })
        .isURL()
        .withMessage("L'URL dell'immagine non è valido")
        .isLength({ max: 500 })
        .withMessage("L'URL dell'immagine è troppo lungo"),
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

    body("imageUrl")
        .optional({ checkFalsy: true })
        .isURL()
        .withMessage("L'URL dell'immagine non è valido")
        .isLength({ max: 500 })
        .withMessage("L'URL dell'immagine è troppo lungo"),
];
