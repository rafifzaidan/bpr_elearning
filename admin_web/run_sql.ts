import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe('ALTER PUBLICATION supabase_realtime ADD TABLE modules, exams, results;');
    console.log('Realtime enabled for modules, exams, and results tables.');
  } catch (e) {
    if (e instanceof Error && e.message.includes('already exists')) {
       console.log('Table might already be added to publication.');
    } else {
       console.error('Error enabling realtime:', e);
    }
  }
}

main().finally(() => prisma.$disconnect());
