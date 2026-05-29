import { Router } from "express";
import {
  register, login, logout, verify, changePassword,
} from "../../controllers/auth/auth.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  registerValidator, loginValidator, changePasswordValidator,
} from "../../validator/auth/auth.validator.js";

const router = Router();

// Public routes
router.post("/register", validate(registerValidator), register);
router.post("/login", validate(loginValidator), login);

// Protected routes
router.post("/logout", authMiddleware, logout);
router.get("/verify", authMiddleware, verify);
router.patch("/change-password", authMiddleware, validate(changePasswordValidator), changePassword);

export default router;
