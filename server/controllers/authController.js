import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
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

// Client creato lazy: dotenv.config() in server.js gira DOPO gli import,
// quindi process.env non è pronto a livello di modulo (stessa storia del
// transporter Nodemailer).
let googleClient = null;
const getGoogleClient = () => {
    if (!googleClient) googleClient = new OAuth2Client();
    return googleClient;
};

export const googleLogin = async (req, res, next) => {
    try {
        checkValidation(req);

        if (!process.env.GOOGLE_CLIENT_ID) {
            throw new ApiError(500, "Login con Google non configurato sul server");
        }

        const { idToken } = req.body;

        // Verifica firma, scadenza e audience con i server di Google: il
        // token è garantito emesso per IL NOSTRO Client ID.
        let payload;
        try {
            const ticket = await getGoogleClient().verifyIdToken({
                idToken,
                audience: process.env.GOOGLE_CLIENT_ID,
            });
            payload = ticket.getPayload();
        } catch {
            throw new ApiError(401, "Accesso con Google non riuscito. Riprova.");
        }

        // Solo email verificate da Google: garanzia che la casella è davvero sua.
        if (!payload.email_verified) {
            throw new ApiError(401, "La tua email Google non è verificata");
        }

        const email = payload.email.toLowerCase();

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            // Già registrato (anche con email+password): Google è solo un
            // altro modo per entrare nello stesso account.
            return authResponse(res, 200, existingUser);
        }

        // Nuovo utente: passwordHash casuale, sconosciuta a tutti.
        // L'accesso con password resta impossibile: si entra via Google.
        const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12);
        const user = await User.create({
            name: payload.name || email.split("@")[0],
            email,
            passwordHash,
        });

        authResponse(res, 200, user);
    } catch (error) {
        next(error);
    }
};
