import fs from 'fs';
const f = process.argv[2];
process.stdout.write(fs.readFileSync(f, 'utf8'));
