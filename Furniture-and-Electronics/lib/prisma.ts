import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

// Configure Neon for serverless/edge environments
const { neonConfig } = require('@neondatabase/serverless')
neonConfig.webSocketConstructor = false // Use HTTP fetch instead of WebSocket on Vercel

// 1. Add a safeguard to catch the missing variable immediately
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined in your environment variables.')
}

// 2. Initialize adapter directly with connection string (new Prisma 6.x API)
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })

const globalForPrisma = global as unknown as { prisma: PrismaClient }

function getPrismaInstance(): PrismaClient {
  // If already instantiated and has latest models, reuse it
  if (globalForPrisma.prisma && 'booking' in globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  let ClientClass = PrismaClient

  // In development, if Node cached an older @prisma/client without 'booking', purge require cache
  if (process.env.NODE_ENV !== 'production' && typeof require !== 'undefined' && require.cache) {
    const testClient = new ClientClass({ adapter })
    if (!('booking' in testClient)) {
      console.log('♻️ Purging stale Prisma module cache in development...')
      Object.keys(require.cache).forEach((key) => {
        if (key.includes('@prisma') || key.includes('.prisma')) {
          delete require.cache[key]
        }
      })
      ClientClass = require('@prisma/client').PrismaClient
    }
  }

  const newPrisma = new ClientClass({ adapter })
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = newPrisma
  }
  return newPrisma
}

export const prisma = getPrismaInstance()