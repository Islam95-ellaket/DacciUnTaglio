import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import { checkValidation } from "../utils/validate.js";

// JWT valido 7 giorni con id e ruolo dell'utente
const generateToken = (user) =>
    jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });

// Risposta identica per login e registrazione: token + dati pubblici (mai la password)
const authResponse = (res, status, user) => {
    res.status(status).json({
        token: generateToken(user),
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    });
};

export const register = async (req, res, next) => {
    try {
        checkValidation(req);

        const { name, email, password, phone } = req.body;

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            throw new ApiError(409, "Email già registrata");
        }

        // 12 round = buon bilanciamento sicurezza/velocità
        const passwordHash = await bcrypt.hash(password, 12);
        const user = await User.create({ name, email, passwordHash, phone });

        authResponse(res, 201, user);
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        checkValidation(req);

        const { email, password } = req.body;

        const user = await User.findOne({ email: email.toLowerCase() });

        // Messaggio volutamente generico: non rivela quale campo è sbagliato
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
            throw new ApiError(401, "Email o password errati");
        }

        authResponse(res, 200, user);
    } catch (error) {
        next(error);
    }
};
