import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";
import { fromZonedTime } from "date-fns-tz";
import Shop from "../models/Shop.js";
import Service from "../models/Service.js";
import Appointment from "../models/Appointment.js";
import { getAvailableSlots } from "../services/availabilityService.js";
import { nextDate } from "../utils/dateUtils.js";
import { TIMEZONE, futureLocalDate, slotISO } from "./helpers.js";

const makeAppointment = async (date, hhmm, status = "active", durationMin = 45) => {
  const start = fromZonedTime(`${date}T${hhmm}:00`, TIMEZONE);

  return Appointment.create({
    shopId: shop._id,
    serviceId: service._id,
    userId: new mongoose.Types.ObjectId(),
    start,
    end: new Date(start.getTime() + durationMin * 60 * 1000),
    status,
  });
};

// ─── Fixture: negozio (lun–sab 09:00–19:00) + servizio da 45 minuti ──────────

let shop;
let service;

const WORKING_HOURS = [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
  dayOfWeek,
  open: "09:00",
  close: "19:00",
}));

beforeEach(async () => {
  shop = await Shop.create({
    name: "DacciUnTaglio",
    timezone: TIMEZONE,
    slotInterval: 10,
    workingHours: WORKING_HOURS,
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
});

// ─── Test ────────────────────────────────────────────────────────────────────

describe("getAvailableSlots — griglia slot", () => {
  it("genera la griglia corretta: primo 09:00, ultimo 18:10, 56 slot (step 10)", async () => {
    const date = futureLocalDate(2); // martedì
    const slots = await getAvailableSlots(service._id, date);

    expect(slots[0]).toBe(slotISO(date, "09:00"));
    expect(slots.at(-1)).toBe(slotISO(date, "18:10"));
    expect(slots).toHaveLength(56);
  });

  it("rimuove gli slot sovrapposti a un appuntamento attivo", async () => {
    const date = futureLocalDate(2);
    await makeAppointment(date, "09:00"); // occupa 09:00–09:45

    const slots = await getAvailableSlots(service._id, date);

    // 09:00–09:40 sovrappongono 09:00–09:45 (5 slot rimossi); 09:50 torna libero
    expect(slots).not.toContain(slotISO(date, "09:00"));
    expect(slots).not.toContain(slotISO(date, "09:40"));
    expect(slots).toContain(slotISO(date, "09:50"));
    expect(slots).toHaveLength(51);
  });

  it("NON rimuove slot per appuntamenti cancelled, completed o no-show", async () => {
    const date = futureLocalDate(2);
    await makeAppointment(date, "09:00", "cancelled");
    await makeAppointment(date, "10:00", "completed");
    await makeAppointment(date, "11:00", "no-show");

    const slots = await getAvailableSlots(service._id, date);
    expect(slots).toHaveLength(56);
  });

  it("esclude gli slot sovrapposti a un blockedSlot (10:00–11:00)", async () => {
    const date = futureLocalDate(2);
    await Shop.updateOne(
      { _id: shop._id },
      {
        $push: {
          blockedSlots: {
            start: fromZonedTime(`${date}T10:00:00`, TIMEZONE),
            end: fromZonedTime(`${date}T11:00:00`, TIMEZONE),
            reason: "Blocco di test",
          },
        },
      }
    );

    const slots = await getAvailableSlots(service._id, date);

    // Rimossi 10 slot: un servizio da 45' che INIZIA prima del blocco
    // ci finisce dentro (09:20 finisce 10:05) → 09:20–10:50 esclusi; 11:00 libero
    expect(slots).not.toContain(slotISO(date, "09:20"));
    expect(slots).not.toContain(slotISO(date, "10:50"));
    expect(slots).toContain(slotISO(date, "11:00"));
    expect(slots).toHaveLength(46);
  });

  it("esclude gli slot nella pausa pranzo ricorrente (13:00–14:00)", async () => {
    shop.recurringBlocks = [{ dayOfWeek: 2, open: "13:00", close: "14:00", reason: "Pausa pranzo" }];
    await shop.save();
    const date = futureLocalDate(2); // martedì

    const slots = await getAvailableSlots(service._id, date);

    // 12:20–13:50 cadono nella pausa (10 slot rimossi); 12:10 e 14:00 restano
    expect(slots).toContain(slotISO(date, "12:10"));
    expect(slots).not.toContain(slotISO(date, "13:00"));
    expect(slots).not.toContain(slotISO(date, "13:50"));
    expect(slots).toContain(slotISO(date, "14:00"));
    expect(slots).toHaveLength(46);
  });

  it("ritorna [] nei giorni senza orari di apertura (domenica chiusa)", async () => {
    const date = futureLocalDate(0); // domenica
    const slots = await getAvailableSlots(service._id, date);
    expect(slots).toEqual([]);
  });

  it("ritorna [] se un blocco copre tutta la giornata", async () => {
    const date = futureLocalDate(2);
    await Shop.updateOne(
      { _id: shop._id },
      {
        $push: {
          blockedSlots: {
            start: fromZonedTime(`${date}T00:00:00`, TIMEZONE),
            end: fromZonedTime(`${nextDate(date)}T00:00:00`, TIMEZONE),
            reason: "Chiusura giornaliera",
          },
        },
      }
    );

    const slots = await getAvailableSlots(service._id, date);
    expect(slots).toEqual([]);
  });

  it("usa slotInterval custom dal DB (15) e fallback 10 se il campo manca", async () => {
    const date = futureLocalDate(2);

    await Shop.updateOne({ _id: shop._id }, { $set: { slotInterval: 15 } });
    let slots = await getAvailableSlots(service._id, date);
    expect(slots[0]).toBe(slotISO(date, "09:00"));
    expect(slots[1]).toBe(slotISO(date, "09:15"));

    await Shop.updateOne({ _id: shop._id }, { $unset: { slotInterval: 1 } });
    slots = await getAvailableSlots(service._id, date);
    expect(slots[1]).toBe(slotISO(date, "09:10"));
  });

  it("lancia 400 per data non valida o ID servizio non valido", async () => {
    await expect(getAvailableSlots(service._id, "17/11/2026")).rejects.toMatchObject({ statusCode: 400 });
    await expect(getAvailableSlots("id-non-valido", futureLocalDate(2))).rejects.toMatchObject({ statusCode: 400 });
  });

  it("lancia 404 se il servizio non esiste", async () => {
    const missingId = new mongoose.Types.ObjectId();
    await expect(getAvailableSlots(missingId, futureLocalDate(2))).rejects.toMatchObject({ statusCode: 404 });
  });
});
