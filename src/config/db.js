import { PrismaClient } from "../generated/prisma/index.js";
import { PrismaPg } from "@prisma/adapter-pg";
import dotenv from "dotenv";
dotenv.config();

// Driver Adapter cho Prisma v7 (bắt buộc)
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

// Singleton pattern: tránh tạo nhiều kết nối khi nodemon hot-reload
let prisma;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient({ adapter });
} else {
  if (!globalThis.__prisma) {
    globalThis.__prisma = new PrismaClient({ adapter });
  }
  prisma = globalThis.__prisma;
}

export default prisma;
