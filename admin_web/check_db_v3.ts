import { prisma } from './lib/db';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Manually load env from .env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      process.env[key] = value;
    }
  });
}

async function main() {
  const modules = await prisma.module.findMany({
    select: {
      id: true,
      title: true,
      file_url: true,
      file_type: true
    }
  });
  console.log('--- MODULES DATA ---');
  console.log(JSON.stringify(modules, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
