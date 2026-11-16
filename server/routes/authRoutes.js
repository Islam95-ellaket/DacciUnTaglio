import { Router } from "express";
import { register, login, googleLogin } from "../controllers/authController.js";
import {
  registerValidation,
  loginValidation,
  googleLoginValidation,
} from "../middleware/validators/authValidators.js";

const router = Router();

router.post("/register", registerValidation, register);
router.post("/login", loginValidation, login);
router.post("/google", googleLoginValidation, googleLogin);

export default router;
