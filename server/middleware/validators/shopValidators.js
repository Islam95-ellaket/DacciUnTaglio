import { body } from "express-validator";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

// PUT /api/shop/working-hours — sostituzione completa degli orari settimanali.
// Ogni elemento: { dayOfWeek 0-6 (0 = domenica), open "HH:MM", close "HH:MM" }.
// Un giorno assente dall'array equivale a "chiuso".
export const updateWorkingHoursValidator = [
    body("workingHours")
        .isArray({ max: 7 })
        .withMessage("Gli orari devono essere un elenco di massimo 7 giorni"),

    body("workingHours.*.dayOfWeek")
        .isInt({ min: 0, max: 6 })
        .withMessage("Il giorno della settimana deve essere compreso tra 0 e 6"),

    body("workingHours.*.open")
        .matches(TIME_REGEX)
        .withMessage("L'orario di apertura deve essere nel formato HH:MM"),

    body("workingHours.*.close")
        .matches(TIME_REGEX)
        .withMessage("L'orario di chiusura deve essere nel formato HH:MM"),

    // Vincoli sull'insieme: niente giorni duplicati e apertura precedente alla
    // chiusura (le stringhe "HH:MM" si confrontano lessicograficamente)
    body("workingHours").custom((items) => {
        const seen = new Set();

        for (const item of items) {
            if (seen.has(item.dayOfWeek)) {
                throw new Error("Sono presenti giorni della settimana duplicati");
            }
            seen.add(item.dayOfWeek);

            if (item.open >= item.close) {
                throw new Error("L'orario di apertura deve precedere quello di chiusura");
            }
        }

        return true;
    }),
];

// PUT /api/shop/recurring-blocks — sostituzione completa dei blocchi ricorrenti
// (es. pausa pranzo). Ogni elemento: { dayOfWeek 0-6, open "HH:MM", close "HH:MM", reason? }.
// A differenza degli orari di apertura, più blocchi sullo stesso giorno sono ammessi.
export const updateRecurringBlocksValidator = [
    body("recurringBlocks")
        .isArray({ max: 14 })
        .withMessage("I blocchi devono essere un elenco di massimo 14 elementi"),

    body("recurringBlocks.*.dayOfWeek")
        .isInt({ min: 0, max: 6 })
        .withMessage("Il giorno della settimana deve essere compreso tra 0 e 6"),

    body("recurringBlocks.*.open")
        .matches(TIME_REGEX)
        .withMessage("L'orario di inizio deve essere nel formato HH:MM"),

    body("recurringBlocks.*.close")
        .matches(TIME_REGEX)
        .withMessage("L'orario di fine deve essere nel formato HH:MM"),

    body("recurringBlocks.*.reason")
        .optional({ values: "falsy" })
        .isString()
        .trim()
        .isLength({ max: 100 })
        .withMessage("Il motivo può avere al massimo 100 caratteri"),

    // Vincolo per elemento: inizio precedente alla fine (confronto lessicografico)
    body("recurringBlocks").custom((items) => {
        for (const item of items) {
            if (item.open >= item.close) {
                throw new Error("L'orario di inizio deve precedere quello di fine");
            }
        }

        return true;
    }),
];
