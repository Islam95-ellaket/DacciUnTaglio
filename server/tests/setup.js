import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { beforeAll, afterAll, afterEach } from "vitest";

// Database Mongo "in memoria": avviato una volta per tutta la suite e distrutto
// alla fine. I test NON toccano mai il database Atlas vero.
let mongoServer;

beforeAll(async () => {
  console.log("⏳ Avvio MongoDB in memoria (alla prima esecuzione scarica il binario)...");
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  console.log("✅ MongoDB in memoria pronto");
}, 600000);

afterEach(async () => {
  // Svuota tutte le collection DOPO ogni test: ogni test riparte da dati puliti.
  // deleteMany mantiene gli indici (al Pezzo 2 serviranno per il test del 409).
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop(); // se beforeAll è fallito, non c'è nulla da spegnere
});
