const sanitizeErrorMessage = (message, statusCode) => {
  if (!message) return "داخلي سرور خرابي";

  const isInternalDbError =
    message.includes("Failed query:") ||
    message.includes("SQLITE_") ||
    /\b(insert|update|delete|select)\s+into\b/i.test(message);

  if (isInternalDbError) {
    return statusCode >= 500 ? "داخلي سرور خرابي" : "د عملیات په ترسره کولو کې ستونزه";
  }

  if (process.env.NODE_ENV === "production" && statusCode === 500) {
    return "داخلي سرور خرابي";
  }

  return message;
};

export const ErrorMiddlware = async (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  console.error(`${req.method} ${req.originalUrl} - ${statusCode} - ${err.stack || err.message}`);

  const message = sanitizeErrorMessage(err.message, statusCode);

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
