const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    const modules = await prisma.$queryRaw`DESCRIBE modules`
    console.log('modules info:', JSON.stringify(modules, null, 2))
    
    const perms = await prisma.$queryRaw`DESCRIBE teacher_module_permissions`
    console.log('teacher_module_permissions info:', JSON.stringify(perms, null, 2))
    
    const teachers = await prisma.$queryRaw`DESCRIBE teachers`
    console.log('teachers info:', JSON.stringify(teachers, null, 2))
  } catch (err) {
    console.error('Error:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
