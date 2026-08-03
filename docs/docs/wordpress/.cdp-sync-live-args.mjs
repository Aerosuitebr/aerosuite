import fs from 'fs';
for (let n = 0; n <= 29; n++) {
  const call = JSON.parse(fs.readFileSync(`.cdp-call-${n}.json`, 'utf8'));
  fs.writeFileSync(`.cdp-step-${n}-live-args.json`, JSON.stringify({ method: call.method, params: call.params }));
}
console.log('synced 0-29');
