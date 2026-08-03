import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const cmd = process.argv[2];
const qPath = path.join(dir, '.mcp-chunk-queue.json');
const pPath = path.join(dir, '.mcp-chunk-progress.json');
const invokePath = path.join(dir, '.mcp-chunk-invoke.json');
const resultPath = path.join(dir, '.mcp-chunk-result.json');

function load() {
  return {
    queue: JSON.parse(fs.readFileSync(qPath, 'utf8')),
    progress: JSON.parse(fs.readFileSync(pPath, 'utf8')),
  };
}

function saveProgress(p) {
  fs.writeFileSync(pPath, JSON.stringify(p));
}

function extractValue(r) {
  const v = r?.result?.result?.value ?? r?.result?.value ?? r?.value ?? null;
  if (v && typeof v === 'object' && 'value' in v && Object.keys(v).length === 1) return v.value;
  return v;
}

if (cmd === 'next') {
  const { queue, progress } = load();
  if (progress.i >= queue.length) {
    console.log(JSON.stringify({ done: true, total: queue.length }));
    process.exit(0);
  }
  const item = queue[progress.i];
  fs.writeFileSync(invokePath, JSON.stringify(item.call));
  console.log(
    JSON.stringify({
      done: false,
      i: progress.i,
      total: queue.length,
      step: item.step,
      part: item.part,
      exprLen: item.call.params.expression.length,
      isLastPartOfStep:
        item.part === queue.filter((q) => q.step === item.step).length - 1,
    })
  );
  process.exit(0);
}

if (cmd === 'save') {
  const raw = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  const { queue, progress } = load();
  const item = queue[progress.i];
  const value = extractValue(raw);
  const resultsPath = path.join(dir, '.mcp-chunk-step-results.json');
  const results = fs.existsSync(resultsPath)
    ? JSON.parse(fs.readFileSync(resultsPath, 'utf8'))
    : {};
  if (!results[item.step]) results[item.step] = { parts: [], final: null };
  const isEval = item.call.params.awaitPromise === true;
  if (isEval) results[item.step].final = raw;
  else results[item.step].parts.push(value);
  fs.writeFileSync(resultsPath, JSON.stringify(results));
  progress.i += 1;
  saveProgress(progress);
  const stepDone =
    progress.i >= queue.length ||
    queue[progress.i]?.step !== item.step;
  if (stepDone && results[item.step].final) {
    fs.writeFileSync(path.join(dir, '.mcp-runner-result.json'), results[item.step].final);
    console.log(
      JSON.stringify({
        runnerResult: true,
        step: item.step,
        value: extractValue(results[item.step].final),
      })
    );
  } else {
    console.log(JSON.stringify({ saved: true, i: progress.i, step: item.step, part: item.part }));
  }
  process.exit(0);
}

console.error('next | save');
process.exit(2);
