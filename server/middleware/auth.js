import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";

const auth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new ApiError(401, "Token mancante"));
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch {
    // jwt.verify lancia su token scaduto/malformato: per il client è sempre un 401
    next(new ApiError(401, "Token non valido"));
  }
};

export default auth;
