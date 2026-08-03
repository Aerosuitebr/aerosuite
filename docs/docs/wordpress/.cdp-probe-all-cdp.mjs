const ports = [5939,6432,8053,8080,8081,8765,8766,8767,8768,8769,9247,9633,9876,20241,53153,61820,62056,64972];
for (const port of ports) {
  try {
    const res = await fetch(`http://127.0.0.1:${port}/json/version`, { signal: AbortSignal.timeout(800) });
    const j = await res.json();
    console.log('HIT', port, j.Browser || j.browser);
    const list = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(800) });
    const tabs = await list.json();
    const tab = tabs.find((t) => (t.url || '').includes('wp-admin'));
    if (tab) console.log('TAB', port, tab.url, tab.webSocketDebuggerUrl?.slice(0, 60));
  } catch {
    /* skip */
  }
}
