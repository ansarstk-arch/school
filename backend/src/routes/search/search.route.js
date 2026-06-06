import { Router } from "express";
import { fastSearch } from "../../controllers/search/search.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

router.get("/", authMiddleware, fastSearch);

export default router;
