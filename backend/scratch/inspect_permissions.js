const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    const tableInfo = await prisma.$queryRaw`DESCRIBE teacher_module_permissions`
    console.log('teacher_module_permissions:', JSON.stringify(tableInfo, null, 2))
    
    const data = await prisma.$queryRaw`SELECT * FROM teacher_module_permissions LIMIT 5`
    console.log('Data:', JSON.stringify(data, null, 2))
  } catch (err) {
    console.error('Error:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
