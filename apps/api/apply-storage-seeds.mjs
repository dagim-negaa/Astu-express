import { execSync } from 'node:child_process';
import fs from 'node:fs';

const isRemote = process.argv.includes('--remote');
const flag = isRemote ? '--remote' : '--local';

console.log(`Starting storage seed execution (${flag})...`);

for (let i = 0; i <= 6; i++) {
  const fileName = `seed-img-${i}.sql`;
  if (!fs.existsSync(fileName)) {
    console.warn(`File ${fileName} not found, skipping.`);
    continue;
  }
  console.log(`[${i + 1}/7] Applying ${fileName} ${flag}...`);
  try {
    const cmd = `npx wrangler d1 execute astu-express-db ${flag} --file=./${fileName}`;
    const output = execSync(cmd, { encoding: 'utf8', stdio: 'pipe' });
    console.log(`Successfully applied ${fileName}`);
  } catch (err) {
    console.error(`Failed to apply ${fileName}:`, err.stdout || err.message);
  }
}

console.log(`Finished seeding storage objects (${flag}).`);
