const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$queryRawUnsafe(`
    SELECT pg_get_functiondef(oid) 
    FROM pg_proc 
    WHERE proname = 'on_auth_user_created'
  `);
  console.log(result);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
