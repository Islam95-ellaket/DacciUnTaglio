import { body } from "express-validator";
import Shop from "../../models/Shop.js";

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

// Nomi dei giorni per i messaggi d'errore (indice = dayOfWeek, 0 = domenica)
const DAY_NAMES = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];

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

    // La pausa deve cadere DENTRO l'orario di apertura del giorno: una pausa
    // fuori fascia non coprirebbe nessuno slot (dato salvato ma privo di effetto).
    body("recurringBlocks").custom(async (items) => {
        const shop = await Shop.findOne().select("workingHours");
        if (!shop) return true; // senza shop non c'è riferimento: non giudichiamo

        for (const item of items) {
            const dayOfWeek = Number(item.dayOfWeek);
            const dayName = DAY_NAMES[dayOfWeek];
            const workingHour = shop.workingHours?.find((w) => w.dayOfWeek === dayOfWeek);

            if (!workingHour) {
                throw new Error(`Il negozio è chiuso di ${dayName}: una pausa non ha senso in quel giorno`);
            }

            if (item.open < workingHour.open || item.close > workingHour.close) {
                throw new Error(
                    `La pausa di ${dayName} deve essere dentro l'orario di apertura (${workingHour.open} - ${workingHour.close})`
                );
            }
        }

        return true;
    }),
];
