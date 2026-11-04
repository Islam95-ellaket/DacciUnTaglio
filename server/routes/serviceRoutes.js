import { Router } from "express";
import auth from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";
import { createValidator, updateValidator } from "../middleware/validators/serviceValidators.js";
import {
    getServices,
    createService,
    updateService,
    deleteService,
} from "../controllers/serviceController.js";

const router = Router();

// GET pubblico; scrittura riservata agli admin
router.get("/", getServices);
router.post("/", auth, authorize(["admin"]), createValidator, createService);
router.patch("/:id", auth, authorize(["admin"]), updateValidator, updateService);
router.delete("/:id", auth, authorize(["admin"]), deleteService);

export default router;
