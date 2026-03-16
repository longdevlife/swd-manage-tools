import express from "express";
import cors from "cors";
import morgan from "morgan";
import session from "express-session";
import dotenv from "dotenv";
import { apiReference } from "@scalar/express-api-reference";

import prisma from "./config/db.js";
import passportConfig from "./config/passport.js";
import routes from "./routes/index.js";
import { errorHandler } from "./middlewares/index.js";
import swaggerSpec from "./config/swagger.js";
import { initCronJobs } from "./jobs/cronJobs.js";

// Load env vars
dotenv.config();

// Initialize Express app
const app = express();

// --------------- Global Middlewares ---------------

app.use(cors({
  origin: [
    process.env.CLIENT_URL || "http://localhost:5173",
    "https://swd-manage-tools.vercel.app",
  ].filter(Boolean),
  credentials: true,
}));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Session (cần cho OAuth passport)
app.use(session({
  secret: process.env.SESSION_SECRET || "dev_secret",
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === "production" },
}));

// Passport OAuth
app.use(passportConfig.initialize());
app.use(passportConfig.session());

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// --------------- API Routes ---------------

app.get("/api/health", async (req, res) => {
  try {
    // Test Neon connection
    await prisma.$queryRaw`SELECT 1`;
    res.status(200).json({
      success: true,
      message: "Server is running 🚀",
      database: "Neon PostgreSQL ✅",
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(500).json({ success: false, message: "Database connection failed ❌" });
  }
});

app.use("/api", routes);

// --------------- Scalar API Docs ---------------

// Raw OpenAPI spec (JSON)
app.get("/api/docs/spec", (req, res) => {
  res.json(swaggerSpec);
});

// Scalar UI — Beautiful API Reference
app.use(
  "/api/docs",
  apiReference({
    spec: {
      content: swaggerSpec,
    },
    theme: "kepler",
    layout: "modern",
    defaultHttpClient: {
      targetKey: "javascript",
      clientKey: "fetch",
    },
    metaData: {
      title: "SWP391 API Docs",
    },
  })
);

// --------------- Error Handling ---------------

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

// --------------- Start Server ---------------

const PORT = process.env.PORT || 5000;

// Only listen when NOT running as Vercel serverless function
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`📡 Health:   http://localhost:${PORT}/api/health`);
    console.log(`📖 API Docs: http://localhost:${PORT}/api/docs`);
    console.log(`📋 Raw Spec: http://localhost:${PORT}/api/docs/spec`);
    console.log(`🗄️  Database: Neon PostgreSQL (Prisma v7)\n`);

    // Khởi tạo Cron Jobs (Phase 10)
    initCronJobs();
  });
}

export default app;
