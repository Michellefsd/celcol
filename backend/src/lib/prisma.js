// backend/src/lib/prisma.js
import { PrismaClient } from '@prisma/client';

const prisma =
  globalThis.__prisma ??
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'], // ← unificás el log acá
  });

// cachear solo en dev para evitar múltiples instancias por hot-reload
if (process.env.NODE_ENV !== 'production') {
  globalThis.__prisma = prisma;
}

export default prisma;
