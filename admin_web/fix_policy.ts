import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Public read exams" ON public.exams; CREATE POLICY "Public read exams" ON public.exams FOR SELECT USING (true);`);
  await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Public read questions" ON public.questions; CREATE POLICY "Public read questions" ON public.questions FOR SELECT USING (true);`);
  console.log("Done adding public policies");
}
main();
