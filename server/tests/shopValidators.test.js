import { describe, it, expect, beforeEach } from "vitest";
import { validationResult } from "express-validator";
import Shop from "../models/Shop.js";
import { updateRecurringBlocksValidator } from "../middleware/validators/shopValidators.js";

// Fa girare i validatori su una req finta, come farebbe Express, senza
// avviare un server.
const runValidators = async (recurringBlocks) => {
  const req = { body: { recurringBlocks } };
  for (const validator of updateRecurringBlocksValidator) {
    await validator.run(req);
  }
  return validationResult(req);
};

describe("updateRecurringBlocksValidator", () => {
  beforeEach(async () => {
    // Negozio di prova: lunedì 09:00-19:00, domenica 09:00-13:00.
    // I giorni assenti da workingHours (mar-sab) sono "chiuso".
    await Shop.create({
      name: "Negozio di test",
      workingHours: [
        { dayOfWeek: 0, open: "09:00", close: "13:00" },
        { dayOfWeek: 1, open: "09:00", close: "19:00" },
      ],
      recurringBlocks: [],
    });
  });

  it("accetta una pausa dentro l'orario di apertura", async () => {
    const result = await runValidators([
      { dayOfWeek: 1, open: "12:00", close: "14:00", reason: "Pausa pranzo" },
    ]);

    expect(result.isEmpty()).toBe(true);
  });

  it("rifiuta una pausa fuori dagli orari di apertura", async () => {
    const result = await runValidators([{ dayOfWeek: 1, open: "21:00", close: "23:00" }]);

    expect(result.isEmpty()).toBe(false);
    expect(result.array()[0].msg).toMatch(/dentro l'orario di apertura/);
  });

  it("rifiuta una pausa in un giorno di chiusura", async () => {
    const result = await runValidators([{ dayOfWeek: 3, open: "12:00", close: "13:00" }]);

    expect(result.array()[0].msg).toMatch(/chiuso/);
  });

  it("rifiuta una pausa che attraversa la mezzanotte", async () => {
    const result = await runValidators([{ dayOfWeek: 1, open: "23:30", close: "00:00" }]);

    expect(result.array()[0].msg).toMatch(/precedere/);
  });

  it("accetta più pause valide nello stesso giorno", async () => {
    const result = await runValidators([
      { dayOfWeek: 1, open: "11:00", close: "11:30" },
      { dayOfWeek: 1, open: "15:00", close: "15:30" },
    ]);

    expect(result.isEmpty()).toBe(true);
  });
});
