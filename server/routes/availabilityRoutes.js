import { Router } from "express";
import { getAvailability } from "../controllers/availabilityController.js";

const router = Router();

// GET /api/availability?serviceId=...&date=YYYY-MM-DD (pubblico)
router.get("/", getAvailability);

export default router;
