const bcrypt = require("bcryptjs");
const prisma = require("../utills/db");

const ADMIN_EMAIL = "bornilmahmud738@gmail.com";
const ADMIN_PASSWORD = "415934";

async function seedAdmin() {
  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const adminUser = await prisma.user.upsert({
    where: {
      email: ADMIN_EMAIL,
    },
    update: {
      password: hashedPassword,
      role: "admin",
    },
    create: {
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: "admin",
    },
  });

  console.log(`Admin user ready: ${adminUser.email}`);
}

seedAdmin()
  .catch((error) => {
    console.error("Failed to seed admin user:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
