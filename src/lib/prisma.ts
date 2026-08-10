import { Prisma, PrismaClient } from '@prisma/client';

// A suspended serverless database (Neon scales to zero after a few minutes of
// inactivity) refuses or resets the first connections while it wakes up, which
// takes a few seconds. Those failures are transient: retrying the same query a
// moment later succeeds. Without this, the first request after an idle period
// fails even though nothing is actually wrong.
const MAX_ATTEMPTS = 4;
const RETRY_DELAYS_MS = [1000, 2000, 4000];

function isTransientConnectionError(error: unknown) {
  // The client could not reach the database at all — nothing was executed, so
  // replaying the query is safe.
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P1001: server unreachable. P1017: server closed the connection.
    return error.code === 'P1001' || error.code === 'P1017';
  }

  return false;
}

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function createPrismaClient() {
  return new PrismaClient({
    log: ['error', 'warn']
  }).$extends({
    query: {
      async $allOperations({ args, query, model, operation }) {
        let lastError: unknown;

        for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
          try {
            return await query(args);
          } catch (error) {
            if (!isTransientConnectionError(error)) {
              throw error;
            }

            lastError = error;

            if (attempt < MAX_ATTEMPTS) {
              const delay = RETRY_DELAYS_MS[attempt - 1];
              console.warn(
                `Database unreachable on ${model ?? 'raw'}.${operation} ` +
                  `(attempt ${attempt}/${MAX_ATTEMPTS}) — waking up, retrying in ${delay}ms`
              );
              await wait(delay);
            }
          }
        }

        throw lastError;
      }
    }
  });
}

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

declare global {
  var prisma: ExtendedPrismaClient | undefined;
}

export const prisma = global.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}
