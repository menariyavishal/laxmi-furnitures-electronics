import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = process.argv[2];
  const newPassword = process.argv[3];

  if (!username || !newPassword) {
    console.log("Usage: npx tsx prisma/change-password.ts <username> <new_password>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { username },
  });

  if (!user) {
    console.error(`User '${username}' not found in database.`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { username },
    data: { passwordHash },
  });

  console.log(`Successfully updated password for user '${username}'.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
