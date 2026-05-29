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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(express.json());

app.use(urlencoded({extended: true}));
app.use(cookieParser());

// Cross origin
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:4173',
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
app.options('/{*path}', cors(corsOptions));

// Serve static files (images)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// configure the hpp middleware to prevent HTTP Parameter Pollution
app.use(hpp());

// Response Middleware for res.respond()
app.use(responseMiddleware);

// Auto-absence cron job - runs every 30 minutes
cron.schedule('*/30 * * * *', async () => {
  console.log('[Cron] Running auto-absence job');
  await runAutoAbsence();
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

// 404 handler
app.use((req, res) => {
    res.respond(404, "پاڼه ونه موندل شوه");
});

// Error Middelware
app.use(ErrorMiddlware);

export default app