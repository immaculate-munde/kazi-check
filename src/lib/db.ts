import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

// Prefer project .env over a stale shell DATABASE_URL (common on Windows).
if (process.env.NODE_ENV !== "production") {
  config({ override: true });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/** True when a DATABASE_URL is configured (Prisma path). Otherwise memory store. */
export function usePrisma() {
  return Boolean(process.env.DATABASE_URL?.trim());
}
