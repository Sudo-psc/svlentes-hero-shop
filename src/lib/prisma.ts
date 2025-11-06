import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const databaseUrl = process.env.DATABASE_URL

const createClient = () =>
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl
      }
    }
  })

const prismaClient = databaseUrl ? globalForPrisma.prisma ?? createClient() : undefined

const unavailableMessage = 'DATABASE_URL is not configured. Prisma Client is unavailable.'

export const prisma =
  prismaClient ??
  (new Proxy(
    {},
    {
      get() {
        throw new Error(unavailableMessage)
      },
      apply() {
        throw new Error(unavailableMessage)
      }
    }
  ) as PrismaClient)

if (prismaClient) {
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prismaClient
  } else {
    process.on('SIGINT', async () => {
      await prismaClient.$disconnect()
      process.exit(0)
    })
    process.on('SIGTERM', async () => {
      await prismaClient.$disconnect()
      process.exit(0)
    })
  }
} else if (process.env.NODE_ENV !== 'production') {
  console.warn(unavailableMessage)
}