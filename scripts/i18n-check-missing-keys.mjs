#!/usr/bin/env node
import fs from 'fs';

const java = fs.readFileSync('backend/src/main/java/com/aerosuite/i18n/ApiI18nMessages.java', 'utf8');
const ts = fs.readFileSync('frontend/src/app/core/i18n/api-backend-i18n.ts', 'utf8');
const keys = [...java.matchAll(/=\s*"(api\.[^"]+)"/g)].map((m) => m[1]);
const missing = keys.filter((k) => !ts.includes(`'${k}'`));
console.log('Total api keys:', keys.length);
console.log('Missing in frontend:', missing.length);
missing.forEach((k) => console.log(k));
