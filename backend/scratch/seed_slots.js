const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const defaultSlots = [
    { start_time: '08:00', end_time: '09:00', is_break: false },
    { start_time: '09:00', end_time: '10:00', is_break: false },
    { start_time: '10:00', end_time: '11:00', is_break: false },
    { start_time: '11:00', end_time: '11:30', is_break: true },
    { start_time: '11:30', end_time: '12:30', is_break: false },
    { start_time: '12:30', end_time: '01:30', is_break: false },
    { start_time: '01:30', end_time: '02:00', is_break: true },
    { start_time: '02:00', end_time: '03:00', is_break: false },
  ];

  console.log('Seeding time slots...');
  for (const slot of defaultSlots) {
    await prisma.time_slots.create({ data: slot });
  }
  console.log('Done!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
