import { describe, it, expect, beforeEach, vi } from "vitest";
import User from "../models/User.js";
import { googleLogin } from "../controllers/authController.js";
import { callController, nextError } from "./helpers.js";

// jwt.sign e verifyIdToken leggono process.env quando vengono CHIAMATI:
// basta definirle qui, prima dei test.
process.env.JWT_SECRET = "segreto-di-test";
process.env.GOOGLE_CLIENT_ID = "client-id-di-test.apps.googleusercontent.com";

// Mock di google-auth-library: verifyIdToken restituisce quello che decide
// il singolo test invece di chiamare i server di Google.
const { verifyIdToken } = vi.hoisted(() => ({ verifyIdToken: vi.fn() }));
vi.mock("google-auth-library", () => ({
  OAuth2Client: class {
    verifyIdToken = verifyIdToken;
  },
}));

const googlePayload = (overrides = {}) => ({
  sub: "1234567890",
  email: "mario.rossi@gmail.com",
  name: "Mario Rossi",
  email_verified: true,
  ...overrides,
});

const tokenOk = (payload) =>
  verifyIdToken.mockResolvedValue({ getPayload: () => payload });

describe("googleLogin", () => {
  beforeEach(() => {
    verifyIdToken.mockReset();
  });

  it("primo accesso: crea l'utente e restituisce il JWT", async () => {
    tokenOk(googlePayload());
    const { res, next } = await callController(googleLogin, {
      body: { idToken: "token-finto" },
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    const body = res.json.mock.calls[0][0];
    expect(body.token).toBeTruthy();
    expect(body.user.email).toBe("mario.rossi@gmail.com");
    expect(body.user.name).toBe("Mario Rossi");

    const saved = await User.findOne({ email: "mario.rossi@gmail.com" });
    expect(saved).toBeTruthy();
  });

  it("accesso successivo: trova l'utente esistente senza duplicarlo", async () => {
    await User.create({
      name: "Mario Rossi",
      email: "mario.rossi@gmail.com",
      passwordHash: "hash-finto",
    });

    // Google può restituire l'email con maiuscole diverse: il confronto è case-insensitive
    tokenOk(googlePayload({ email: "Mario.Rossi@Gmail.com" }));
    const { res, next } = await callController(googleLogin, {
      body: { idToken: "token-finto" },
    });

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(await User.countDocuments({ email: "mario.rossi@gmail.com" })).toBe(1);
  });

  it("rifiuta la email se Google la considera non verificata (401)", async () => {
    tokenOk(googlePayload({ email_verified: false }));
    const { next } = await callController(googleLogin, {
      body: { idToken: "token-finto" },
    });

    expect(nextError(next).statusCode).toBe(401);
  });

  it("rifiuta un token non valido o scaduto (401)", async () => {
    verifyIdToken.mockRejectedValue(new Error("invalid token"));
    const { next } = await callController(googleLogin, {
      body: { idToken: "token-scaduto" },
    });

    expect(nextError(next).statusCode).toBe(401);
  });

  it("senza GOOGLE_CLIENT_ID configurato risponde 500", async () => {
    const original = process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_ID;

    const { next } = await callController(googleLogin, {
      body: { idToken: "token-finto" },
    });
    expect(nextError(next).statusCode).toBe(500);

    process.env.GOOGLE_CLIENT_ID = original;
  });
});
