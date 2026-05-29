import { Router } from "express";
import {
  createExpense,
  listExpenses,
  getExpense,
  updateExpense,
  deleteExpense,
  getStatistics,
} from "../../controllers/expense/expense.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { validate } from "../../middlewares/validate.middleware.js";
import { createExpenseValidator, updateExpenseValidator } from "../../validator/expense/expense.validator.js";

const router = Router();
router.use(authMiddleware);

router.post('/', validate(createExpenseValidator), createExpense);
router.get('/', listExpenses);
router.get('/statistics', getStatistics);
router.get('/:id', getExpense);
router.put('/:id', validate(updateExpenseValidator), updateExpense);
router.delete('/:id', deleteExpense);

export default router;
