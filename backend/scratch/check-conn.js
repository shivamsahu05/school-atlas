const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkConnection() {
  try {
    await prisma.$connect();
    console.log('✅ Backend successfully connected to the Database.');
    
    const userCount = await prisma.users.count();
    console.log(`📊 Current User Count: ${userCount}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Backend failed to connect to the Database.');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkConnection();
