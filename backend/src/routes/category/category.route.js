import { Router } from "express";
import {
  createCategory,
  listCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from "../../controllers/category/category.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createExpenseCategoryValidator as createCategoryValidator, updateExpenseCategoryValidator as updateCategoryValidator } from "../../validator/expense/expense.validator.js";

const router = Router();

// All category routes require authentication
router.use(authMiddleware);

router.post('/', validate(createCategoryValidator), createCategory);
router.get('/', listCategories);
router.get('/:id', getCategory);
router.put('/:id', validate(updateCategoryValidator), updateCategory);
router.delete('/:id', deleteCategory);

export default router;
