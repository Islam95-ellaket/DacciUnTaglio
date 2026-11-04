import { Router } from "express";
import auth from "../middleware/auth.js";
import authorize from "../middleware/authorize.js"
import { createValidator } from "../middleware/validators/appointmentValidators.js";
import {
    createAppointment,
    getMyAppointments,
    cancelAppointment,
    getAdminAppointments,
    updateAppointmentStatus
} from "../controllers/appointmentController.js";

const router = Router();

// GET proprie prenotazioni (utente loggato)
router.get("/mine", auth, getMyAppointments);

// POST crea prenotazione (utente loggato)
router.post("/", auth, createValidator, createAppointment);

// DELETE annulla prenotazione (utente loggato)
router.delete("/:id", auth, cancelAppointment);

// Admin: lista appuntamenti per intervallo (admin)
router.get("/admin", auth, authorize(["admin"]), getAdminAppointments);

// Admin: cambia stato (admin)
router.patch("/:id/status", auth, authorize(["admin"]), updateAppointmentStatus);

export default router;
