// Errore personalizzato con codice HTTP associato.
// Lanciando `throw new ApiError(409, 'Email già registrata')` da qualunque punto
// del codice, l'errorHandler centralizzato risponderà con status 409 e questo messaggio.
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

export default ApiError;
