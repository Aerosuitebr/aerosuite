(async () => {
  const b64 = window.__logoB64;
  if (!b64 || b64.length < 1000) return { err: 'missing b64', len: (b64||'').length };
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  const fd = new FormData();
  fd.append('file', new Blob([arr], { type: 'image/png' }), 'aerosuite-pictureandletter.png');
  const m = await wp.apiFetch({ path: '/wp/v2/media', method: 'POST', body: fd });
  window.__asUrls = window.__asUrls || {};
  window.__asUrls.hero = m.source_url;
  return { hero: m.source_url };
})()