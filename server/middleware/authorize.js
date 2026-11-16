import ApiError from "../utils/ApiError.js";

const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Non autenticato"));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, "Accesso negato"));
    }

    next();
  };
};

export default authorize;
