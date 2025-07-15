const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkUsers() {
  try {
    console.log("📋 Usuarios en la base de datos:");

    const users = await prisma.user.findMany({
      include: {
        role: true,
      },
    });

    users.forEach((user) => {
      console.log(
        `  ${user.email} - ${user.firstName} ${user.lastName} (${user.role.name})`
      );
    });

    console.log(`\n📊 Total: ${users.length} usuarios`);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkUsers();
