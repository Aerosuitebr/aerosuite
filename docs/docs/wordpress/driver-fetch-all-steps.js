(async () => {
  const names = [
    'css-preload',
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
  const keyMap = {
    'css-preload': 'preload',
    'css-q3': 'cssQ3',
    'css-q4': 'cssQ4',
    'css-verify': 'cssVerify',
    'css-finalize': 'cssFinalize',
    'enc-init': 'encInit',
    'enc-0': 'enc0',
    'enc-1': 'enc1',
    'enc-2': 'enc2',
    'enc-3': 'enc3',
    'enc-run': 'encRun',
  };
  const out = { viewId: '9a6000', errors: [] };
  for (const name of names) {
    const key = keyMap[name] || name;
    try {
      const p = await fetch(`http://127.0.0.1:8765/${name}`).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} for ${name}`);
        return r.json();
      });
      out[key] = await eval(p.expression);
    } catch (e) {
      out.errors.push({ step: name, error: String(e && e.message ? e.message : e) });
      break;
    }
  }
  return out;
})()
