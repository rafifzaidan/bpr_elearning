import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const mCount = await prisma.module.count();
  const eCount = await prisma.exam.count();
  const qCount = await prisma.question.count();
  console.log(`Modules: ${mCount}`);
  console.log(`Exams: ${eCount}`);
  console.log(`Questions: ${qCount}`);
}
main();
