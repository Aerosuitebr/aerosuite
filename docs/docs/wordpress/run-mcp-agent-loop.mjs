import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const viewId = process.argv[2] || '9a6000';
const reqPath = path.join(dir, '.mcp-request.json');
const resPath = path.join(dir, '.mcp-response.json');

const stepList = [
  { name: 'css-q1', file: '.mcp-step-css-q1.json', nested: true },
  { name: 'css-q2', file: '.params-css-q2.json' },
  { name: 'css-q3', file: '.params-css-q3.json' },
  { name: 'css-q4', file: '.params-css-q4.json' },
  { name: 'css-verify', file: '.params-css-verify.json', key: 'cssVerify' },
  { name: 'css-finalize', file: '.params-css-finalize.json', key: 'cssFinalize' },
  { name: 'enc-init', file: '.params-enc-init.json' },
  { name: 'enc-0', file: '.params-enc-0.json' },
  { name: 'enc-1', file: '.params-enc-1.json' },
  { name: 'enc-2', file: '.params-enc-2.json' },
  { name: 'enc-3', file: '.params-enc-3.json' },
  { name: 'enc-run', file: '.params-enc-run.json', key: 'encRun' },
];

function loadPayload(step) {
  const raw = JSON.parse(fs.readFileSync(path.join(dir, step.file), 'utf8'));
  const params = step.nested ? raw.params : raw;
  return { method: 'Runtime.evaluate', params, viewId };
}

function waitForResponse(timeoutMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (fs.existsSync(resPath)) {
      const raw = fs.readFileSync(resPath, 'utf8');
      fs.unlinkSync(resPath);
      return JSON.parse(raw);
    }
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
  }
  throw new Error('timeout waiting for .mcp-response.json');
}

const summary = {
  viewId,
  originalViewId: '8f0e3d',
  note: 'Tab 8f0e3d was closed; reloaded css buffer q1+q2 on viewId ' + viewId,
  errors: [],
  steps: {},
  cssVerify: null,
  cssFinalize: null,
  encRun: null,
};

for (const step of stepList) {
  if (fs.existsSync(resPath)) fs.unlinkSync(resPath);
  const payload = loadPayload(step);
  fs.writeFileSync(reqPath, JSON.stringify({ step: step.name, ...payload }));
  process.stdout.write(`CALL_MCP ${step.name}\n`);
  let resp;
  try {
    resp = waitForResponse();
  } catch (e) {
    summary.errors.push({ step: step.name, message: String(e) });
    break;
  }
  if (resp?.exceptionDetails || resp?.result?.subtype === 'error') {
    summary.errors.push({ step: step.name, error: resp.exceptionDetails || resp.result });
    break;
  }
  const value = resp?.result?.value ?? resp?.value ?? resp;
  summary.steps[step.name] = value;
  if (step.key) summary[step.key] = value;
  process.stderr.write(`OK ${step.name} ${JSON.stringify(value).slice(0, 120)}\n`);
}

fs.writeFileSync(path.join(dir, '.cdp-params-summary.json'), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));
if (fs.existsSync(reqPath)) fs.unlinkSync(reqPath);
