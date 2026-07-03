import { prisma } from './lib/db';

async function main() {
  try {
    const func: any = await prisma.$queryRawUnsafe(`
      SELECT pg_get_functiondef(oid) 
      FROM pg_proc 
      WHERE proname = 'handle_new_user'
    `);
    console.log("Function definition:");
    console.log(func[0]?.pg_get_functiondef);

  } catch (err) {
    console.error("Error executing query:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
