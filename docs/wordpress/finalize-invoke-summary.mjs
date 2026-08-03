import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const summaryPath = path.join(dir, '.invoke-12-run-summary.json');
const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
const deploy = {
  viewId: '258c93',
  activeTabViewId: summary.viewId || 'bb8370',
  steps: summary.steps,
  cssVerify: summary.steps['css-verify'] ?? null,
  cssFinalize: summary.steps['css-finalize'] ?? null,
  encRun: summary.steps['enc-run'] ?? null,
  errors: summary.errors || [],
};
if (deploy.errors.length === 0 && summary.steps['enc-run']?.ok === false) {
  deploy.errors.push({ step: 'enc-run', note: 'first attempt failed b64 mismatch; enc-4 required' });
}
fs.writeFileSync(path.join(dir, 'deploy-invoke-summary.json'), JSON.stringify(deploy, null, 2));
console.log(JSON.stringify(deploy));
