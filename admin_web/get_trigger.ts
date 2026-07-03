import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    const result: any = await prisma.$queryRawUnsafe(`
      SELECT pg_get_functiondef(oid) 
      FROM pg_proc 
      WHERE proname = 'on_auth_user_created'
    `);
    console.log("Trigger Definition:");
    console.log(result[0]?.pg_get_functiondef || "Trigger not found!");
  } catch (err) {
    console.error("Error executing query:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
