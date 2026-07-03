import { prisma } from './lib/db';

async function main() {
  try {
    const user = await prisma.user.findUnique({
      where: { nip: "5323600011" }
    });
    console.log("User with NIP 5323600011:", user);
    
    // Also fetch the trigger
    const trigger: any = await prisma.$queryRawUnsafe(`
      SELECT pg_get_functiondef(oid) 
      FROM pg_proc 
      WHERE proname = 'on_auth_user_created'
    `);
    console.log("Trigger Definition:");
    console.log(trigger[0]?.pg_get_functiondef || "Trigger not found!");

  } catch (err) {
    console.error("Error executing query:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
