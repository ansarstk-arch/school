import ApiError from "./ApiError.util.js";

export const asyncHandler = (fn) => async (req, res, next) => {
  try {
    await fn(req, res, next);
  } catch (error) {
    console.error("AsyncHandler caught error:", error);
    
    const status = error.status || error.statusCode || 500;
    const message = error.message || "داخلي سرور خرابي";
    
    return next(new ApiError(status, message));
  }
};

