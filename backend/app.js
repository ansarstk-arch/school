import express, { urlencoded } from 'express'
import 'dotenv/config'
import cookieParser from 'cookie-parser';
import cors from 'cors'
import router from './src/routes/routes.js';
import { responseMiddleware } from './src/middlewares/response.middleware.js';
import { ErrorMiddlware } from './src/middlewares/error.middleware.js';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import db from './src/configs/db/db.config.js';
import { sql } from 'drizzle-orm';
import path from 'path';
import { fileURLToPath } from 'url';
import cron from 'node-cron';
import { runAutoAbsence } from './src/utils/autoAbsence.util.js';
import { ensureMonthlyFeeRecords } from './src/controllers/fee/fee.controller.js';
import { currentShamsiYearMonth } from './src/lib/afghan-date.js';
import { runStartupMigrations } from './src/utils/runMigrations.util.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

await runStartupMigrations();

app.use(express.json());

app.use(urlencoded({extended: true}));
app.use(cookieParser());

// Cross origin
const frontendUrls = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : [];
const allowedOrigins = [
  ...frontendUrls,
  'http://localhost:4173',
  'http://localhost:5173',
  'http://192.168.43.215:5173',
  process.env.RENDER_EXTERNAL_URL,
].filter(Boolean);

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (Postman, mobile apps, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language', 'x-refresh-token'],
    exposedHeaders: ['x-new-access-token', 'x-new-refresh-token'],
};

app.use(cors(corsOptions));

// Serve static files (images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../Client/dist')));



// configure the hpp middleware to prevent HTTP Parameter Pollution
app.use(hpp());

// Response Middleware for res.respond()
app.use(responseMiddleware);

// Auto-absence cron job - runs every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  console.log('[Cron] Running auto-absence job');
  await runAutoAbsence();
});

// Daily reset at midnight (00:00 Afghanistan) — fresh attendance day + fee records
cron.schedule('0 0 * * *', async () => {
  console.log('[Cron] Running daily midnight jobs');
  try {
    await db.run(sql`DELETE FROM absent_parent_calls WHERE attendance_date < date('now', '-1 day')`);
    console.log('[Cron] Parent call status reset completed');
  } catch (error) {
    console.error('[Cron] Error resetting parent call status:', error);
  }

  try {
    const month = currentShamsiYearMonth();
    const academicYear = month.split('-')[0];
    await ensureMonthlyFeeRecords(month, academicYear);
    console.log(`[Cron] Monthly fee records ensured for ${month}`);
  } catch (error) {
    console.error('[Cron] Error generating monthly fee records:', error);
  }
});

// Health check
app.get("/health", async (req, res) => {
  let dbStatus = "ok";
  let dbError = null;

  try {
    await db.run(sql`SELECT 1`);
  } catch (err) {
    dbStatus = "error";
    dbError = err.message;
  }

  const healthy = dbStatus === "ok";
  res.status(healthy ? 200 : 503).json({
    success: healthy,
    status: healthy ? 200 : 503,
    message: healthy ? "Server is running" : "Database connection failed",
    environment: process.env.NODE_ENV || "development",
    db: {
      mode: process.env.DB_MODE || "local",
      status: dbStatus,
      ...(dbError && { error: dbError }),
    },
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

// Router 
app.use("/api/v1", router);

// Serve frontend for all other routes (SPA fallback)
// This catches all non-API routes and serves the React app
app.use((req, res, next) => {
  // If it's an API route that wasn't handled, return 404
  if (req.path.startsWith('/api/')) {
    return res.respond(404, "پاڼه ونه موندل شوه");
  }
  // Otherwise serve the frontend
  res.sendFile(path.join(__dirname, '../Client/dist/index.html'));
});

// Error Middelware
app.use(ErrorMiddlware);

export default app