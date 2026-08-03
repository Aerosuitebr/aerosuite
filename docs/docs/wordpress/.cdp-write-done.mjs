import fs from 'fs';
const src = process.argv[2];
const raw = src ? fs.readFileSync(src, 'utf8') : process.argv.slice(2).join(' ');
fs.writeFileSync('.cdp-mcp-done.json', raw);
console.log('done written', raw.length);
