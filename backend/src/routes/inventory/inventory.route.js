import { Router } from "express";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import {
  createInventoryItemValidator,
  updateInventoryItemValidator,
  createInventorySaleValidator,
} from "../../validator/inventory/inventory.validator.js";
import {
  getInventoryStats,
  listInventoryItems,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  listInventorySales,
  createInventorySale,
  updateInventorySale,
  deleteInventorySale,
} from "../../controllers/inventory/inventory.controller.js";

const router = Router();
router.use(authMiddleware);

router.get("/stats", getInventoryStats);
router.get("/items", listInventoryItems);
router.post("/items", validate(createInventoryItemValidator), createInventoryItem);
router.put("/items/:id", validate(updateInventoryItemValidator), updateInventoryItem);
router.delete("/items/:id", deleteInventoryItem);

router.get("/sales", listInventorySales);
router.post("/sales", validate(createInventorySaleValidator), createInventorySale);
router.put("/sales/:id", validate(createInventorySaleValidator), updateInventorySale);
router.delete("/sales/:id", deleteInventorySale);

export default router;
