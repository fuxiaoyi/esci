const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteUserByEmail(email) {
  try {
    const deletedUser = await prisma.user.delete({
      where: {
        email: email,
      },
    });
    console.log('User deleted:', deletedUser);
  } catch (error) {
    console.error('Error deleting user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Call the function with the email of the user you want to delete
deleteUserByEmail('user@example.com');