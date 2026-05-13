const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const classesCount = await prisma.classes.count();
  const acadClassesCount = await prisma.academic_classes.count();
  const subjectsCount = await prisma.subjects.count();
  
  console.log('Classes count:', classesCount);
  console.log('Academic Classes count:', acadClassesCount);
  console.log('Subjects count:', subjectsCount);
  
  if (classesCount > 0) {
    const sampleClasses = await prisma.classes.findMany({ take: 3 });
    console.log('Sample Classes:', sampleClasses);
  }
  
  if (acadClassesCount > 0) {
    const sampleAcadClasses = await prisma.academic_classes.findMany({ take: 3 });
    console.log('Sample Academic Classes:', sampleAcadClasses);
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
