import { Router } from "express";
import { getAvailability, getAvailabilityMonth } from "../controllers/availabilityController.js";

const router = Router();

// GET /api/availability/month?serviceId=...&month=YYYY-MM (pubblico)
router.get("/month", getAvailabilityMonth);

// GET /api/availability?serviceId=...&date=YYYY-MM-DD (pubblico)
router.get("/", getAvailability);

export default router;
