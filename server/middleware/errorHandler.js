import ApiError from "../utils/ApiError.js";

// Route non trovate: crea un 404 e lo passa all'errorHandler
export const notFound = (req, res, next) => {
  next(
    new ApiError(404, `Route non trovata: ${req.method} ${req.originalUrl}`),
  );
};

// Gestore centralizzato: ApiError, errori MongoDB e bug imprevisti finiscono TUTTI qui,
// così il client riceve SEMPRE lo stesso formato: { error: { message } }
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Errore interno del server";

  // Chiave duplicata MongoDB (es. due utenti con la stessa email)
  if (err.code === 11000) {
    statusCode = 409;
    message = "Email già registrata";
  }

  // Validazione dello schema Mongoose fallita
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)[0].message;
  }

  // gli imprevisti li logghiamo tutti per il debug
  if (statusCode === 500) {
    console.error(err);
  }

  res.status(statusCode).json({ error: { message } });
};

export default errorHandler;
