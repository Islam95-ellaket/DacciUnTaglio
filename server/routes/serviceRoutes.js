import {Router} from "express"
import {createValidator, updateValidator} from "../middleware/validators/serviceValidators.js"
import { getServices, createService, updateService, deleteService } from "../controllers/serviceController.js";
import auth from "../middleware/auth.js"
import authorize from "../middleware/authorize.js"


const router = Router()
// GET pubblico: nessun middleware auth
router.get("/", getServices);
// POST protetto: auth → authorize → validator → controller
router.post("/", auth, authorize(["admin"]), createValidator, createService)
// PATCH protetto: auth → authorize → validator → controller
router.patch("/:id", auth, authorize(["admin"]), updateValidator, updateService)
// DELETE authorize 
router.delete("/:id", auth, authorize(["admin"]), deleteService)

export default router