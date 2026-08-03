/**
 * Short Runtime.evaluate wrapper: fetch step params from local server and execute.
 */
export function stepExpr(stepName, port = 8765) {
  return `(async()=>{const p=await fetch('http://127.0.0.1:${port}/${stepName}').then(r=>r.json());let v=eval(p.expression);if(p.awaitPromise)v=await v;return v;})()`;
}

export const REMAINING_STEPS = [
  'css-q1',
  'css-q2',
  'css-q3',
  'css-q4',
  'css-verify',
  'css-finalize',
  'enc-init',
  'enc-0',
  'enc-1',
  'enc-2',
  'enc-3',
  'enc-run',
];

export const USER_STEPS = [
  'css-q3',
  'css-q4',
  'css-verify',
  'css-finalize',
  'enc-init',
  'enc-0',
  'enc-1',
  'enc-2',
  'enc-3',
  'enc-run',
];
