import { describe, it, expect } from "vitest";
import { validationResult } from "express-validator";
import {
  createValidator,
  updateValidator,
} from "../middleware/validators/serviceValidators.js";

// Fa girare i validatori su una req finta, come farebbe Express
const runValidators = async (validators, body) => {
  const req = { body };
  for (const validator of validators) {
    await validator.run(req);
  }
  return validationResult(req);
};

describe("serviceValidators — imageUrl", () => {
  it("creazione senza immagine: valida", async () => {
    const result = await runValidators(createValidator, {
      name: "Taglio",
      price: 20,
      durationMinutes: 30,
    });
    expect(result.isEmpty()).toBe(true);
  });

  it("creazione con immagine https: valida", async () => {
    const result = await runValidators(createValidator, {
      name: "Taglio",
      price: 20,
      durationMinutes: 30,
      imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
    });
    expect(result.isEmpty()).toBe(true);
  });

  it("creazione con URL non-http (javascript:): rifiutata", async () => {
    const result = await runValidators(createValidator, {
      name: "Taglio",
      price: 20,
      durationMinutes: 30,
      imageUrl: "javascript:alert(1)",
    });
    expect(result.isEmpty()).toBe(false);
  });

  it("modifica con stringa qualsiasi come immagine: rifiutata", async () => {
    const result = await runValidators(updateValidator, {
      imageUrl: "non-un-url",
    });
    expect(result.isEmpty()).toBe(false);
  });

  it("modifica con immagine valida: valida", async () => {
    const result = await runValidators(updateValidator, {
      imageUrl: "https://res.cloudinary.com/demo/image/upload/sample.png",
    });
    expect(result.isEmpty()).toBe(true);
  });
});
