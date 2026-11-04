import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { validationResult } from "express-validator";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";

// Firma un JWT valido 7 giorni contenente id e ruolo dell'utente
const generateToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

export const register = async (req, res, next) => {
  try {
    // 1. Gli input sono validi?
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, errors.array()[0].msg);
    }

    const { name, email, password, phone } = req.body;

    // 2. L'email è già in uso?
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ApiError(409, "Email già registrata");
    }

    // 3. Cifra la password (12 round = buon bilanciamento sicurezza/velocità)
    const passwordHash = await bcrypt.hash(password, 12);

    // 4. Salva l'utente e rispondi con token + dati pubblici (MAI la password)
    const user = await User.create({ name, email, passwordHash, phone: phone || "" });
    const token = generateToken(user);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error); // passa l'errore all'errorHandler centralizzato
  }
};

export const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(400, errors.array()[0].msg);
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new ApiError(401, "Email o password errati");
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      throw new ApiError(401, "Email o password errati");
    }

    const token = generateToken(user);
    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};
