import { describe, it, expect, beforeEach } from "vitest";
import { fromZonedTime } from "date-fns-tz";
import Shop from "../models/Shop.js";
import Service from "../models/Service.js";
import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import {
  createAppointment,
  cancelAppointment,
  updateAppointmentStatus,
} from "../controllers/appointmentController.js";
import { TIMEZONE, futureLocalDate, slotISO, callController, nextError } from "./helpers.js";

// ─── Fixture: negozio + servizio 45' + cliente ───────────────────────────────

let shop;
let service;
let user;

beforeEach(async () => {
  shop = await Shop.create({
    name: "DacciUnTaglio",
    timezone: TIMEZONE,
    slotInterval: 10,
    workingHours: [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
      dayOfWeek,
      open: "09:00",
      close: "19:00",
    })),
    blockedSlots: [],
    recurringBlocks: [],
  });

  service = await Service.create({
    shopId: shop._id,
    name: "Taglio + shampoo",
    price: 25,
    durationMinutes: 45,
    isActive: true,
  });

  user = await User.create({
    name: "Mario Rossi",
    email: "mario@test.it",
    passwordHash: "hash-di-prova",
  });
});

const book = (hhmm, date, userDoc = user) =>
  callController(createAppointment, {
    body: { serviceId: service._id.toString(), start: slotISO(date, hhmm) },
    user: { id: userDoc._id.toString() },
  });

// ─── Creazione prenotazione ──────────────────────────────────────────────────

describe("createAppointment — prenotazione", () => {
  it("crea un appuntamento valido (201) con end = start + durata del servizio", async () => {
    const date = futureLocalDate(2);
    const { res } = await book("09:00", date);

    expect(res.status).toHaveBeenCalledWith(201);
    const appointment = res.json.mock.calls[0][0];
    expect(appointment.status).toBe("active");
    expect(new Date(appointment.end).getTime() - new Date(appointment.start).getTime()).toBe(
      45 * 60 * 1000
    );
  });

  it("due prenotazioni sullo stesso slot: la seconda riceve 409 (una sola salvata)", async () => {
    const date = futureLocalDate(2);
    // Secondo cliente: con lo stesso utente scatterebbe prima il limite
    // giornaliero (403, fail-fast in testa al controller), non il conflitto
    const otherUser = await User.create({
      name: "Luca Bianchi",
      email: "luca@test.it",
      passwordHash: "hash-di-prova",
    });

    await book("09:00", date); // cliente 1 → ok
    const { next } = await book("09:00", date, otherUser); // cliente 2, stesso slot → 409

    expect(nextError(next).statusCode).toBe(409);
    expect(await Appointment.countDocuments()).toBe(1);
  });

  it("slot non più disponibile (orario passato) → 409", async () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { next } = await callController(createAppointment, {
      body: { serviceId: service._id.toString(), start: yesterday },
      user: { id: user._id.toString() },
    });

    expect(nextError(next).statusCode).toBe(409);
    expect(await Appointment.countDocuments()).toBe(0);
  });

  it("limite giornaliero: seconda prenotazione nello stesso giorno → 403", async () => {
    const date = futureLocalDate(2);

    await book("09:00", date); // prima ok (maxBookingsPerDay default = 1)
    const { next } = await book("10:00", date); // altro slot libero, ma stesso giorno

    expect(nextError(next).statusCode).toBe(403);
    expect(await Appointment.countDocuments()).toBe(1);
  });

  it("ID servizio non valido → 400", async () => {
    const { next } = await callController(createAppointment, {
      body: { serviceId: "id-non-valido", start: slotISO(futureLocalDate(2), "09:00") },
      user: { id: user._id.toString() },
    });

    expect(nextError(next).statusCode).toBe(400);
  });
});

// ─── Annullamento (regola delle 24 ore) ──────────────────────────────────────

describe("cancelAppointment — regola delle 24 ore", () => {
  it("annullamento oltre 24h prima → 200 e status 'cancelled'", async () => {
    const date = futureLocalDate(2); // tra almeno 3 giorni
    const { res } = await book("09:00", date);
    const appointment = res.json.mock.calls[0][0];

    const result = await callController(cancelAppointment, {
      params: { id: appointment._id.toString() },
      user: { id: user._id.toString() },
    });

    expect(result.res.status).toHaveBeenCalledWith(200);
    expect((await Appointment.findById(appointment._id)).status).toBe("cancelled");
  });

  it("annullamento a meno di 24h dall'inizio → 400, l'appuntamento resta attivo", async () => {
    // Creato direttamente nel DB: un appuntamento reale tra 2 ore non passerebbe
    // mai il check della disponibilità (slot nel passato/fuori griglia), ma per
    // testare la regola 24h ci basta un documento con start vicino.
    const start = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const appointment = await Appointment.create({
      shopId: shop._id,
      serviceId: service._id,
      userId: user._id,
      start,
      end: new Date(start.getTime() + 45 * 60 * 1000),
      status: "active",
    });

    const { next } = await callController(cancelAppointment, {
      params: { id: appointment._id.toString() },
      user: { id: user._id.toString() },
    });

    expect(nextError(next).statusCode).toBe(400);
    expect((await Appointment.findById(appointment._id)).status).toBe("active");
  });

  it("un cliente non può annullare l'appuntamento di un altro → 403", async () => {
    const otherUser = await User.create({
      name: "Luca Bianchi",
      email: "luca@test.it",
      passwordHash: "hash-di-prova",
    });
    const date = futureLocalDate(2);
    const { res } = await book("09:00", date);
    const appointment = res.json.mock.calls[0][0];

    const { next } = await callController(cancelAppointment, {
      params: { id: appointment._id.toString() },
      user: { id: otherUser._id.toString() },
    });

    expect(nextError(next).statusCode).toBe(403);
  });
});

// ─── Cambio stato admin (esente dalla regola 24h) ────────────────────────────

describe("updateAppointmentStatus — admin esente dalla regola 24h", () => {
  it("l'admin segna 'no-show' anche a meno di 24h → 200", async () => {
    const start = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const appointment = await Appointment.create({
      shopId: shop._id,
      serviceId: service._id,
      userId: user._id,
      start,
      end: new Date(start.getTime() + 45 * 60 * 1000),
      status: "active",
    });

    const { res } = await callController(updateAppointmentStatus, {
      params: { id: appointment._id.toString() },
      body: { status: "no-show" },
      user: { id: user._id.toString(), role: "admin" }, // il controllo ruolo avviene nel middleware delle route
    });

    expect(res.status).toHaveBeenCalledWith(200);
    expect((await Appointment.findById(appointment._id)).status).toBe("no-show");
  });
});
