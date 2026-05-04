import { prisma } from "./lib/db";
async function check() {
  const d = await prisma.division.findMany();
  console.log(d);
}
check();
