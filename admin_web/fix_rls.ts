import { prisma } from './lib/db';

async function main() {
  console.log("Fixing storage policies...");
  
  await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Allow public insert to modules" ON storage.objects;`);
  await prisma.$executeRawUnsafe(`CREATE POLICY "Allow public insert to modules" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'modules');`);
  
  await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Allow public update to modules" ON storage.objects;`);
  await prisma.$executeRawUnsafe(`CREATE POLICY "Allow public update to modules" ON storage.objects FOR UPDATE TO public USING (bucket_id = 'modules');`);
  
  await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Allow public select to modules" ON storage.objects;`);
  await prisma.$executeRawUnsafe(`CREATE POLICY "Allow public select to modules" ON storage.objects FOR SELECT TO public USING (bucket_id = 'modules');`);
  
  console.log("Storage policies successfully applied!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
