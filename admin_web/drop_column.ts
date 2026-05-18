import { PrismaClient } from '@prisma/client';
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE public.modules DROP CONSTRAINT IF EXISTS modules_division_id_fkey;');
    console.log("Dropped constraint");
    await prisma.$executeRawUnsafe('ALTER TABLE public.modules DROP COLUMN IF EXISTS division_id CASCADE;');
    console.log("Dropped column");
  } catch (e: any) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
