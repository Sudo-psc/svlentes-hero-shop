import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// P3: Database connection pooling configuration
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    // P3: Connection pool optimization for serverless
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })

// P3: Graceful shutdown - disconnect on process termination
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
} else {
  // Production: handle cleanup on shutdown
  process.on('SIGINT', async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  process.on('SIGTERM', async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
}