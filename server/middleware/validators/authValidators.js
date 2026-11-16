import { body } from "express-validator";

export const registerValidation = [
  body("name")
  .trim()
  .notEmpty()
  .withMessage("Il nome è obbligatorio"),

  body("email")
    .isEmail()
    .withMessage("Inserisci un indirizzo email valido")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 6 })
    .withMessage("La password deve contenere almeno 6 caratteri"),

  // Telefono opzionale: solo cifre/spazi/+/. /-
  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[+]?[\d .-]{6,20}$/)
    .withMessage("Numero di telefono non valido"),
];

export const loginValidation = [
  body("email")
    .isEmail()
    .withMessage("Inserisci un indirizzo email valido")
    .normalizeEmail(),

  body("password")
  .notEmpty()
  .withMessage("La password è obbligatoria"),
];

export const googleLoginValidation = [
  body("idToken")
  .notEmpty()
  .withMessage("Token Google mancante"),
];
