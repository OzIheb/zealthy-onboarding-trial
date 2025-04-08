import { PrismaClient } from '../generated/prisma'; // Adjust path based on actual output location

// Declare a global variable to hold the Prisma Client instance
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Initialize Prisma Client, reusing the instance in development
export const prisma =
  globalThis.prisma ??
  new PrismaClient({
    // Optional: Add logging configuration if needed
    // log: ['query', 'info', 'warn', 'error'],
  });

// In non-production environments, assign the instance to the global variable
if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
} 