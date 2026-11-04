import ApiError from "../utils/ApiError.js";

const authorize = (allowedRoles) => {
  return (req, res, next) => {
    // Verifica che l'utente sia autenticato
    if (!req.user) {
      return next(new ApiError(401, "Non autenticato"));
    }

    // Verifica che il ruolo sia autorizzato
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, "Accesso negato"));
    }

    // L'utente è autorizzato
    next();
  };
};

export default authorize;
