import * as dotenv from 'dotenv';
dotenv.config();

import { prisma } from './lib/db';

async function main() {
  try {
    console.log("Using DB URL:", process.env.DATABASE_URL);
    console.log("Adding set_name to questions...");
    await prisma.$executeRawUnsafe(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS set_name TEXT NOT NULL DEFAULT 'Default';`);
    console.log("Added set_name to questions.");

    console.log("Adding question_set_name to exams...");
    await prisma.$executeRawUnsafe(`ALTER TABLE exams ADD COLUMN IF NOT EXISTS question_set_name TEXT NOT NULL DEFAULT 'Default';`);
    console.log("Added question_set_name to exams.");

    console.log("Success!");
  } catch (error) {
    console.error("Error modifying tables:", error);
  } finally {
    process.exit(0);
  }
}

main();
