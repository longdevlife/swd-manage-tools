// Global error handling middleware – Prisma + JWT
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  // ── Prisma Errors ──────────────────────────────────
  // P2002: Unique constraint violation
  if (err.code === "P2002") {
    statusCode = 400;
    const fields = err.meta?.target?.join(", ") || "unknown field";
    message = `Duplicate value for: ${fields}. Please use another value.`;
  }

  // P2025: Record not found
  if (err.code === "P2025") {
    statusCode = 404;
    message = err.meta?.cause || "Record not found.";
  }

  // P2003: Foreign key constraint failed
  if (err.code === "P2003") {
    statusCode = 400;
    message = `Related record not found for field: ${err.meta?.field_name || "unknown"}.`;
  }

  // P2014: Required relation violation
  if (err.code === "P2014") {
    statusCode = 400;
    message = "Required relation violation.";
  }

  // ── JWT Errors ─────────────────────────────────────
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Invalid token";
  }

  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Token expired";
  }

  // ── Validation Errors ──────────────────────────────
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = err.message;
  }

  console.error(`❌ Error: ${message}`);
  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

export default errorHandler;
