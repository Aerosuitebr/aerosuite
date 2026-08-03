#!/usr/bin/env node
/**
 * Verifica literais PT remanescentes em conteúdo server-side de proposta (e-mail/WhatsApp).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const targets = [
  'backend/src/main/java/com/aerosuite/service/PropostaComercialService.java',
  'backend/src/main/java/com/aerosuite/i18n/PropostaComercialMessages.java',
  'backend/src/main/java/com/aerosuite/i18n/PropostaOsBridgeMessages.java',
  'backend/src/main/java/com/aerosuite/i18n/TransactionalEmailMessages.java'
];

const ptUserRe =
  /\.append\("[^"]*[àáâãéêíóôõúçÀÁÂÃÉÊÍÓÔÕÚÇ][^"]*"\)|mensagem\.append\("[^"]*[àáâãéêíóôõúç]/;

let hits = 0;
for (const rel of targets) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) continue;
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    if (ptUserRe.test(line) && !line.trim().startsWith('//') && !/LOGGER\./.test(line)) {
      console.log(`${rel}:${i + 1}: ${line.trim()}`);
      hits++;
    }
  });
}

console.log(`\nServer-side proposta PT literals: ${hits}`);
process.exit(hits > 0 ? 1 : 0);
