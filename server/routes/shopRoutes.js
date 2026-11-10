import { Router } from "express";
import auth from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";
import {
    updateWorkingHoursValidator,
    updateRecurringBlocksValidator,
} from "../middleware/validators/shopValidators.js";
import {
    getShop,
    updateWorkingHours,
    updateRecurringBlocks,
} from "../controllers/shopController.js";

const router = Router();

// Lettura e modifica del negozio riservate agli admin
router.get("/", auth, authorize(["admin"]), getShop);
router.put(
    "/working-hours",
    auth,
    authorize(["admin"]),
    updateWorkingHoursValidator,
    updateWorkingHours,
);
router.put(
    "/recurring-blocks",
    auth,
    authorize(["admin"]),
    updateRecurringBlocksValidator,
    updateRecurringBlocks,
);

export default router;
