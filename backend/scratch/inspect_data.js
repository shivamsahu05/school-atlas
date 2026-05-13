const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  try {
    const ac = await prisma.academic_classes.findMany()
    console.log('academic_classes:', JSON.stringify(ac, null, 2))
    
    const as = await prisma.acad_sections.findMany()
    console.log('acad_sections:', JSON.stringify(as, null, 2))
    
    const tt = await prisma.teacher_timetable.findMany()
    console.log('teacher_timetable:', JSON.stringify(tt, null, 2))

    const subjects = await prisma.subjects.findMany()
    console.log('subjects:', JSON.stringify(subjects, null, 2))
  } catch (err) {
    console.error('Error:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
