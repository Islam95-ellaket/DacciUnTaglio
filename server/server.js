import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js"
import appointmentRoutes from "./routes/appointmentRoutes.js";
import availabilityRoutes from "./routes/availabilityRoutes.js";
import shopRoutes from "./routes/shopRoutes.js";
import errorHandler, { notFound } from "./middleware/errorHandler.js";

// Carica le variabili d'ambiente
dotenv.config();

// Connetti al database
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({ origin: process.env.FRONTEND_URL }));

// Route di test
app.get("/api/test", (req, res) => {
  res.json({ message: "✅ Backend funziona! 🎉" });
});

// Route API
app.use("/api/auth", authRoutes);
app.use("/api/services", serviceRoutes)
app.use("/api/appointments", appointmentRoutes)
app.use("/api/availability", availabilityRoutes);
app.use("/api/shop", shopRoutes);

// 404 per le route non gestite (deve stare DOPO tutte le route)
app.use(notFound);

// Gestore errori centralizzato (deve essere l'ULTIMO middleware)
app.use(errorHandler);

// Avvia il server
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Backend URL: http://localhost:${PORT}`);
});
