const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  // Create test users
  const devUser = await prisma.user.create({
    data: {
      name: 'kongfoo',
      email: 'dev@kongfoo.cn',
      superAdmin: true,
    },
  });

  const businessUser = await prisma.user.create({
    data: {
      name: 'kongfoo',
      email: 'business@kongfoo.cn',
      superAdmin: false,
    },
  });

  console.log('Dev user created:', devUser);
  console.log('Business user created:', businessUser);

  // Create sessions for the test users
  const expirationDate = new Date();
  expirationDate.setDate(expirationDate.getDate() + 30); // Expires in 30 days

  const devSessionToken = uuidv4();
  const businessSessionToken = uuidv4();
  
  const devSession = await prisma.session.create({
    data: {
      sessionToken: devSessionToken,
      userId: devUser.id,
      expires: expirationDate,
    },
  });

  const businessSession = await prisma.session.create({
    data: {
      sessionToken: businessSessionToken,
      userId: businessUser.id,
      expires: expirationDate,
    },
  });

  console.log('Dev session created:', devSession);
  console.log('Business session created:', businessSession);
  console.log('Dev API authentication token:', devSessionToken);
  console.log('Business API authentication token:', businessSessionToken);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });