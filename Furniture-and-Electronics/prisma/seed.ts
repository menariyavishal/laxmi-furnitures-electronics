import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { PrismaNeon } from '@prisma/adapter-neon'
import ws from 'ws'

const { neonConfig } = require('@neondatabase/serverless')
neonConfig.webSocketConstructor = ws

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Seeding initial production login credentials only...')

  const ownerUsername = process.env.INITIAL_OWNER_USERNAME || 'admin'
  const ownerPassword = process.env.INITIAL_OWNER_PASSWORD || 'password123'
  const ownerPasswordHash = await bcrypt.hash(ownerPassword, 10)

  const staffUsername = process.env.INITIAL_STAFF_USERNAME || 'staff'
  const staffPassword = process.env.INITIAL_STAFF_PASSWORD || 'password123'
  const staffPasswordHash = await bcrypt.hash(staffPassword, 10)

  // 1. Initial Owner Account
  const owner = await prisma.user.upsert({
    where: { username: ownerUsername },
    update: {
      passwordHash: ownerPasswordHash,
      role: 'owner',
      isActive: true,
    },
    create: {
      name: 'Owner',
      username: ownerUsername,
      passwordHash: ownerPasswordHash,
      role: 'owner',
      isActive: true,
    },
  })

  // 2. Initial Staff Account
  const staff = await prisma.user.upsert({
    where: { username: staffUsername },
    update: {
      passwordHash: staffPasswordHash,
      role: 'staff',
      isActive: true,
    },
    create: {
      name: 'Staff Member',
      username: staffUsername,
      passwordHash: staffPasswordHash,
      role: 'staff',
      isActive: true,
    },
  })

  console.log('Production credentials seeded successfully:')
  console.log(`- Owner Login: username="${owner.username}", role="${owner.role}"`)
  console.log(`- Staff Login: username="${staff.username}", role="${staff.role}"`)
  console.log('No categories, products, or transactions were seeded.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('Error during initial production seed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
