const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    const tableInfo = await prisma.$queryRaw`DESCRIBE acad_class_subjects`
    console.log('Table Info:', JSON.stringify(tableInfo, null, 2))
    
    const rows = await prisma.$queryRaw`SELECT * FROM acad_class_subjects LIMIT 5`
    console.log('Data:', JSON.stringify(rows, null, 2))
  } catch (err) {
    console.error('Error:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
