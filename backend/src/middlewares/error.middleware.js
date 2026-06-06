export const ErrorMiddlware = async (err, req, res, next) => {
  let message = err.message || "داخلي سرور خرابي";

  const statusCode = err.statusCode || err.status || 500;
  console.error(`${req.method} ${req.originalUrl} - ${statusCode} - ${err.stack || err.message}`);

  // In production, don't expose internal error details
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = "داخلي سرور خرابي";
  }

  // Check if res.respond is available (should be added by responseMiddleware)
  if (typeof res.respond === 'function') {
    return res.respond(statusCode, message);
  } else {
    // Fallback if middleware not applied (CORS errors, etc.)
    return res.status(statusCode).json({
      success: false,
      message: message,
      status: statusCode
    });
  }
};
