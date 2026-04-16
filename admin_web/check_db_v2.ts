
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const modules = await prisma.module.findMany({
    select: {
      id: true,
      title: true,
      file_url: true,
      file_type: true
    }
  })
  console.log('--- MODULES DATA ---')
  console.log(JSON.stringify(modules, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
