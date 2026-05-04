import * as dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE modules ADD COLUMN division_ids INT[] DEFAULT \'{}\';');
    console.log('Column division_ids added.');
  } catch (e) {
    console.error('Error adding column:', e);
  }
}

main().finally(() => prisma.$disconnect());
