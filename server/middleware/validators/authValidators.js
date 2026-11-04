import { body } from "express-validator";

export const registerValidation = [
  // Nome: trim + obbligatorio
  body("name")
  .trim()
  .notEmpty()
  .withMessage("Il nome è obbligatorio"),

  // Email: valida
  body("email")
    .isEmail()
    .withMessage("Inserisci un indirizzo email valido")
    .normalizeEmail(),

  // Password: minimo 6 caratteri
  body("password")
    .isLength({ min: 6 })
    .withMessage("La password deve contenere almeno 6 caratteri"),

  // Telefono: opzionale, se presente solo cifre/spazi/+/. /-
  body("phone")
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[+]?[\d .-]{6,20}$/)
    .withMessage("Numero di telefono non valido"),
];

export const loginValidation = [
  // Email: valida
  body("email")
    .isEmail()
    .withMessage("Inserisci un indirizzo email valido")
    .normalizeEmail(),

  // Password: obbligatoria
  body("password")
  .notEmpty()
  .withMessage("La password è obbligatoria"),
];
