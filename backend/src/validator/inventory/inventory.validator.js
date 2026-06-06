import { body } from "express-validator";

const ERR = {
  nameRequired: "د توکي نوم اړین دی",
  nameInvalid: "د توکي نوم سم نه دی",
  yearRequired: "تعلیمي کال اړین دی",
  purchasePriceInvalid: "د اخیستلو بیه باید مثبت عدد وي",
  salePriceInvalid: "د خرڅلاو بیه باید مثبت عدد وي",
  stockInvalid: "سټاک باید صفر یا مثبت عدد وي",
  lowStockInvalid: "د کم سټاک حد باید صفر یا مثبت عدد وي",
  itemIdRequired: "د توکي ID اړین دی",
  quantityInvalid: "تعداد باید له صفر څخه لوی وي",
  discountInvalid: "تخفیف باید صفر یا مثبت عدد وي",
  saleDateInvalid: "د خرڅلاو نېټه سمه نه ده",
};

export const createInventoryItemValidator = [
  body("name")
    .notEmpty().withMessage(ERR.nameRequired)
    .matches(/^[\u0600-\u06FF\u200C\u200Da-zA-Z0-9\s\-_,.()]+$/).withMessage(ERR.nameInvalid)
    .isLength({ min: 2, max: 120 }).withMessage(ERR.nameInvalid),
  body("academicYear")
    .notEmpty().withMessage(ERR.yearRequired)
    .matches(/^\d{4}$/).withMessage(ERR.yearRequired),
  body("purchasePrice").notEmpty().withMessage(ERR.purchasePriceInvalid).isFloat({ min: 0 }).withMessage(ERR.purchasePriceInvalid),
  body("salePrice").notEmpty().withMessage(ERR.salePriceInvalid).isFloat({ min: 0 }).withMessage(ERR.salePriceInvalid),
  body("stockQuantity").notEmpty().withMessage(ERR.stockInvalid).isInt({ min: 0 }).withMessage(ERR.stockInvalid),
  body("lowStockThreshold").optional().isInt({ min: 0 }).withMessage(ERR.lowStockInvalid),
  body("category").optional({ checkFalsy: true }).isLength({ max: 80 }),
  body("sku").optional({ checkFalsy: true }).isLength({ max: 60 }),
  body("description").optional({ checkFalsy: true }).isLength({ max: 500 }),
];

export const updateInventoryItemValidator = [
  body("name").optional().matches(/^[\u0600-\u06FF\u200C\u200Da-zA-Z0-9\s\-_,.()]+$/).withMessage(ERR.nameInvalid).isLength({ min: 2, max: 120 }),
  body("academicYear").optional().matches(/^\d{4}$/).withMessage(ERR.yearRequired),
  body("purchasePrice").optional().isFloat({ min: 0 }).withMessage(ERR.purchasePriceInvalid),
  body("salePrice").optional().isFloat({ min: 0 }).withMessage(ERR.salePriceInvalid),
  body("stockQuantity").optional().isInt({ min: 0 }).withMessage(ERR.stockInvalid),
  body("lowStockThreshold").optional().isInt({ min: 0 }).withMessage(ERR.lowStockInvalid),
  body("category").optional({ checkFalsy: true }).isLength({ max: 80 }),
  body("sku").optional({ checkFalsy: true }).isLength({ max: 60 }),
  body("description").optional({ checkFalsy: true }).isLength({ max: 500 }),
];

export const createInventorySaleValidator = [
  body("itemId").notEmpty().withMessage(ERR.itemIdRequired).isInt({ min: 1 }).withMessage(ERR.itemIdRequired),
  body("quantity").notEmpty().withMessage(ERR.quantityInvalid).isInt({ min: 1 }).withMessage(ERR.quantityInvalid),
  body("discount").optional().isFloat({ min: 0 }).withMessage(ERR.discountInvalid),
  body("saleDate").notEmpty().withMessage(ERR.saleDateInvalid).matches(/^\d{4}-\d{2}-\d{2}$/).withMessage(ERR.saleDateInvalid),
  body("academicYear").notEmpty().withMessage(ERR.yearRequired).matches(/^\d{4}$/).withMessage(ERR.yearRequired),
  body("notes").optional({ checkFalsy: true }).isLength({ max: 500 }),
];
