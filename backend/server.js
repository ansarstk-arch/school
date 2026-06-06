import app from "./app.js";

// Simple logger using console
const logger = {
  error: (message) => console.error(`[ERROR] ${message}`),
  info: (message) => console.log(`[INFO] ${message}`),
  warn: (message) => console.warn(`[WARN] ${message}`)
};

process.on("uncaughtException", (err) => {
  logger.error(`Uncaught Exception: ${err.stack || err.message}`);
});

process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled Rejection: ${reason?.stack || reason}`);
});

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

app.listen(PORT, HOST, () => {
  console.log(`Server runs at http://localhost:${PORT}`);
  if (HOST === "0.0.0.0") {
    console.log(`Network access: http://<your-ip>:${PORT}`);
  }
});
