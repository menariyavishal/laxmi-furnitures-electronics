import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set')
}

// In CLI / Node scripts, standard PrismaClient connects directly via TCP/TLS without fragile WebSockets
const cleanDbUrl = process.env.DATABASE_URL
  .replace(/([?&])channel_binding=[^&]+(&|$)/, '$1')
  .replace(/\?$/, '')
  .replace(/&&/, '&')

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: cleanDbUrl,
    },
  },
})

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
