const { execSync } = require('child_process');
const fs = require('fs');
try {
  const out = execSync('npx prisma db push', { encoding: 'utf8' });
  fs.writeFileSync('raw_out.txt', out);
} catch (err) {
  fs.writeFileSync('raw_out.txt', err.stdout + '\n' + err.message);
}
