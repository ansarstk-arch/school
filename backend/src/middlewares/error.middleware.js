export const ErrorMiddlware = async (err, req, res, next) => {
  let message = err.message || "داخلي سرور خرابي";

  const statusCode = err.statusCode || err.status || 500;
  console.error(`${req.method} ${req.originalUrl} - ${statusCode} - ${err.stack || err.message}`);

  // In production, don't expose internal error details
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = "داخلي سرور خرابي";
  }

  return res.respond(statusCode, message);
};
