import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

/**
 * Singleton Prisma client. Reused across module reloads in dev (tsx watch)
 * to avoid exhausting SQLite connections.
 */
export const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}
