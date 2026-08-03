import fs from 'fs';

for (let n = 0; n <= 3; n++) {
  const j = JSON.parse(fs.readFileSync(`.cdp-step-${n}.invoke.json`, 'utf8'));
  let e = j.params.expression;
  e = e.replace(/^\(async\(\)=>\{/, '').replace(/\}\)\(\)$/, '');
  e = e.replace(/return\{batch:[^}]+\};?/g, '');
  fs.writeFileSync(`.cdp-body-${n}.js`, e);
}
console.log('bodies stripped');
