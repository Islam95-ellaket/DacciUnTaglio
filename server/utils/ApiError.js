// Errore con codice HTTP associato: `throw new ApiError(409, "…")` da
// qualunque punto del codice, e l'errorHandler risponde 409 con quel messaggio.
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

export default ApiError;
