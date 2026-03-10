import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import dotenv from "dotenv";

import connectDB from "./config/db.js";
import routes from "./routes/index.js";
import { errorHandler } from "./middlewares/index.js";

// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// --------------- Global Middlewares ---------------

// Security headers
app.use(helmet());

// CORS
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
  }),
);

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Logging (dev only)
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// --------------- API Routes ---------------

// Health check
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running 🚀",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Mount all routes
app.use("/api", routes);

// --------------- Error Handling ---------------

// Handle 404 - Route not found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// Global error handler
app.use(errorHandler);

// --------------- Start Server ---------------

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`,
  );
  console.log(`📡 API Health: http://localhost:${PORT}/api/health\n`);
});

export default app;
