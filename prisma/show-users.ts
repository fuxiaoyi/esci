const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function showAllUsers() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        superAdmin: true,
        createDate: true,
      },
      orderBy: {
        createDate: 'desc',
      },
    });

    console.log('All Users:');
    console.log(JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error fetching users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Execute the function
showAllUsers(); 