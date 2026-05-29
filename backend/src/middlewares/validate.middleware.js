import { validationResult } from 'express-validator';

export const validate = (validations) => {
  return async (req, res, next) => {
    // Run all validations
    for (let validation of validations) {
      const result = await validation.run(req);
    }

    // Check for errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const firstError = errors.array()[0];
      
      // Debug: Log validation errors
      console.log("Validation failed:");
      console.log("All errors:", errors.array());
      console.log("First error:", firstError);
      console.log("Request body:", req.body);
      
      return res.respond(400, firstError.msg || "د معلوماتو تایید کې تېروتنه");
    }
    
    next();
  };
};

// Alias for backward compatibility
export const requestValidator = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0];
    return res.respond(400, firstError.msg || "د معلوماتو تایید کې تېروتنه");
  }
  
  next();
};
