import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";

const auth = (req, res, next) => {
  try {
    // 1. Estrai l'header Authorization
    const authHeader = req.headers.authorization;

    // 2. Verifica che il token sia presente e inizi con Bearer
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next(new ApiError(401, "Token mancante"));
    }

    // 3. Estrai il token
    const token = authHeader.split(" ")[1];

    // 4. Verifica e decodifica il token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 5. Salva i dati dell'utente nella request
    req.user = decoded;

    // Continua verso il middleware successivo
    next();
  } catch (error) {
    next(new ApiError(401, "Token non valido"));
  }
};

export default auth;
