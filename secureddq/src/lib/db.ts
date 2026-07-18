import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton. In development Next.js clears the module cache on
 * every request, which would otherwise exhaust the database connection pool.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/** True when a database connection string is configured. */
export function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
