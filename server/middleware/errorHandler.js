import ApiError from "../utils/ApiError.js";

// Route non trovate: crea un 404 e lo passa all'errorHandler
export const notFound = (req, res, next) => {
  next(
    new ApiError(404, `Route non trovata: ${req.method} ${req.originalUrl}`),
  );
};

// Gestore centralizzato: ApiError, errori MongoDB e bug imprevisti finiscono TUTTI qui,
// così il client riceve SEMPRE lo stesso formato: { error: { message } }.
// Express riconosce un gestore di errori dal fatto che dichiara 4 parametri:
// `_next` non viene usato, ma va dichiarato (la firma a 4 argomenti è il contratto).
const errorHandler = (err, req, res, _next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Errore interno del server";

  // Chiave duplicata MongoDB: distingue email duplicata da slot duplicato
  if (err.code === 11000) {
    statusCode = 409;
    const duplicatedField = Object.keys(err.keyPattern || {})[0];
    if (duplicatedField === "email") {
      message = "Email già registrata";
    } else if (duplicatedField === "start" || duplicatedField === "shopId") {
      message = "Slot già prenotato";
    } else {
      message = "Valore già esistente";
    }
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
