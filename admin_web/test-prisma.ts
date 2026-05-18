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
    const columns = await prisma.$queryRaw`SELECT column_name, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'modules'`;
    console.log("Columns:", columns);
  } catch (e: any) {
    console.error("Error creating module:");
    console.error(e);
    if (e.meta && e.meta.driverAdapterError) {
      console.error("Cause:", e.meta.driverAdapterError.cause);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
